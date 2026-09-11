import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { COOKIE_NAME, OAUTH_STATE_COOKIE, SESSION_MAX_AGE_MS } from "@shared/const";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { loc, pick, resolveLang, type Lang, type Localized } from "@shared/i18n";

/**
 * Autenticación con Google, sin plataforma intermedia.
 *
 * Sustituye al OAuth de Manus. El flujo es el estándar de código de autorización:
 * el servidor redirige a Google, Google vuelve con un código, el servidor lo canjea,
 * verifica el `id_token` contra las claves públicas de Google y emite su propia sesión
 * firmada con `JWT_SECRET`.
 *
 * El acceso está restringido por lista blanca de correos: sin `ALLOWED_EMAILS` no entra
 * nadie. Es deliberado —una herramienta de estrategia interna no debe quedar abierta
 * porque falte una variable de entorno.
 */

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function sessionSecret() {
  if (!ENV.cookieSecret || ENV.cookieSecret.length < 32) {
    throw new AuthError("JWT_SECRET debe existir y tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

/** Correos autorizados, en minúsculas. Vacío significa que no entra nadie. */
export function allowedEmails() {
  return ENV.allowedEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined) {
  const list = allowedEmails();
  if (!list.length || !email) return false;
  return list.includes(email.trim().toLowerCase());
}

/** El primer correo de la lista es el propietario y recibe rol de administrador. */
export function isOwnerEmail(email: string | null | undefined) {
  const list = allowedEmails();
  return Boolean(email && list[0] && list[0] === email.trim().toLowerCase());
}

export async function createSessionToken(openId: string, name: string | null) {
  return new SignJWT({ name: name ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(openId)
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_MAX_AGE_MS))
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return typeof payload.sub === "string" && payload.sub ? { openId: payload.sub } : null;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string) {
  return parseCookieHeader(req.headers.cookie ?? "")[name];
}

/** Resuelve el usuario de la petición. Devuelve null cuando no hay sesión válida. */
export async function authenticateRequest(req: Request): Promise<User | null> {
  const session = await verifySessionToken(readCookie(req, COOKIE_NAME));
  if (!session) return null;
  const user = await db.getUserByOpenId(session.openId);
  if (!user) return null;
  return user;
}

function callbackUrl(req: Request) {
  if (ENV.publicUrl) return `${ENV.publicUrl.replace(/\/+$/, "")}/api/auth/callback`;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0]?.trim() || req.protocol;
  return `${proto}://${req.get("host")}/api/auth/callback`;
}

type GoogleTokenResponse = { id_token?: string; access_token?: string; error?: string; error_description?: string };
type GoogleIdTokenClaims = { sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string };

export function registerAuthRoutes(app: Express) {
  /** Inicia el login. El nonce va en cookie y en `state`, y deben coincidir a la vuelta. */
  app.get("/api/auth/login", (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET." });
      return;
    }
    const nonce = crypto.randomUUID();
    res.cookie(OAUTH_STATE_COOKIE, nonce, { httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: 10 * 60 * 1000 });

    const url = new URL(GOOGLE_AUTH_ENDPOINT);
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", callbackUrl(req));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", nonce);
    url.searchParams.set("prompt", "select_account");
    res.redirect(302, url.toString());
  });

  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;

    // Guardia CSRF: el `state` que vuelve de Google debe coincidir con la cookie que
    // escribió esta misma máquina al iniciar el login.
    const expectedNonce = readCookie(req, OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });
    if (!code || !state || !expectedNonce || state !== expectedNonce) {
      res.status(403).send(renderAuthError(req, loc("La sesión de login no es válida. Vuelva a intentarlo.", "The login session is not valid. Please try again.")));
      return;
    }

    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: callbackUrl(req),
          grant_type: "authorization_code",
        }),
      });
      const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
      if (!tokenResponse.ok || !tokens.id_token) {
        throw new AuthError(tokens.error_description || tokens.error || "Google returned no id_token.");
      }

      const { payload } = await jwtVerify(tokens.id_token, googleKeys, {
        issuer: GOOGLE_ISSUERS,
        audience: ENV.googleClientId,
      });
      const claims = payload as GoogleIdTokenClaims;
      const emailVerified = claims.email_verified === true || claims.email_verified === "true";
      if (!claims.sub || !claims.email || !emailVerified) {
        throw new AuthError("Google did not confirm a verified email for this account.");
      }
      if (!isEmailAllowed(claims.email)) {
        res.status(403).send(renderAuthError(req, loc(
          `La cuenta ${claims.email} no está autorizada en esta instalación.`,
          `The account ${claims.email} is not authorised on this installation.`
        )));
        return;
      }

      const openId = `google:${claims.sub}`;
      await db.upsertUser({
        openId,
        name: claims.name || null,
        email: claims.email,
        loginMethod: "google",
        role: isOwnerEmail(claims.email) ? "admin" : "user",
        lastSignedIn: new Date(),
      });

      const sessionToken = await createSessionToken(openId, claims.name ?? null);
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: SESSION_MAX_AGE_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Google callback failed", error);
      res.status(500).send(renderAuthError(req, loc("No se pudo completar el inicio de sesión.", "The sign-in could not be completed.")));
    }
  });
}

const AUTH_ERROR_PAGE: Record<Lang, { title: string; retry: string }> = {
  es: { title: "No se pudo iniciar sesión", retry: "Volver a intentarlo" },
  en: { title: "Could not sign in", retry: "Try again" },
};

/**
 * Esta página se sirve antes de que exista sesión, así que no hay preferencia de idioma
 * guardada que consultar. Lo único disponible es lo que declara el navegador.
 */
function renderAuthError(req: Request, message: Localized) {
  const lang = resolveLang(req.headers["accept-language"]);
  const page = AUTH_ERROR_PAGE[lang];
  const escape = (text: string) => text.replace(/[<>&"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[character] ?? character);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${escape(page.title)}</title><style>body{font-family:system-ui,sans-serif;max-width:34rem;margin:12vh auto;padding:0 1.5rem;line-height:1.6;color:#161b21}a{color:#1b4a6b}</style></head><body><h1>${escape(page.title)}</h1><p>${escape(pick(message, lang))}</p><p><a href="/api/auth/login">${escape(page.retry)}</a></p></body></html>`;
}
