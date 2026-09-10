import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Las funciones de sesión leen el entorno al ejecutarse, así que el módulo se importa
 * de nuevo en cada prueba con las variables ya puestas.
 */
async function loadAuth(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  // ENV se construye al importar el módulo, así que hay que reevaluarlo tras tocar el entorno.
  vi.resetModules();
  return import("./auth");
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ALLOWED_EMAILS = "";
  process.env.JWT_SECRET = "";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("lista blanca de acceso", () => {
  it("no deja entrar a nadie cuando la lista está vacía", async () => {
    const auth = await loadAuth({ ALLOWED_EMAILS: "" });
    expect(auth.isEmailAllowed("cualquiera@ejemplo.com")).toBe(false);
    // Deliberado: una instalación mal configurada queda cerrada, no abierta.
    expect(auth.allowedEmails()).toEqual([]);
  });

  it("compara sin distinguir mayúsculas ni espacios sobrantes", async () => {
    const auth = await loadAuth({ ALLOWED_EMAILS: " Rafa@Ejemplo.com , socio@ejemplo.com " });
    expect(auth.isEmailAllowed("rafa@ejemplo.com")).toBe(true);
    expect(auth.isEmailAllowed("SOCIO@EJEMPLO.COM")).toBe(true);
    expect(auth.isEmailAllowed("otro@ejemplo.com")).toBe(false);
    expect(auth.isEmailAllowed(null)).toBe(false);
  });

  it("da administración solo al primero de la lista", async () => {
    const auth = await loadAuth({ ALLOWED_EMAILS: "rafa@ejemplo.com,socio@ejemplo.com" });
    expect(auth.isOwnerEmail("rafa@ejemplo.com")).toBe(true);
    expect(auth.isOwnerEmail("socio@ejemplo.com")).toBe(false);
  });
});

describe("sesión firmada", () => {
  const secret = "un-secreto-de-pruebas-suficientemente-largo-1234567890";

  it("emite y verifica un token propio", async () => {
    const auth = await loadAuth({ JWT_SECRET: secret });
    const token = await auth.createSessionToken("google:123", "Rafa");
    await expect(auth.verifySessionToken(token)).resolves.toEqual({ openId: "google:123" });
  });

  it("rechaza un token manipulado o ausente", async () => {
    const auth = await loadAuth({ JWT_SECRET: secret });
    const token = await auth.createSessionToken("google:123", "Rafa");
    await expect(auth.verifySessionToken(`${token}x`)).resolves.toBeNull();
    await expect(auth.verifySessionToken(undefined)).resolves.toBeNull();
    await expect(auth.verifySessionToken("")).resolves.toBeNull();
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const issuer = await loadAuth({ JWT_SECRET: secret });
    const token = await issuer.createSessionToken("google:123", "Rafa");
    const other = await loadAuth({ JWT_SECRET: "otro-secreto-igual-de-largo-0987654321-abcdef" });
    await expect(other.verifySessionToken(token)).resolves.toBeNull();
  });

  it("exige un secreto de longitud suficiente", async () => {
    const auth = await loadAuth({ JWT_SECRET: "corto" });
    await expect(auth.createSessionToken("google:123", "Rafa")).rejects.toThrow(/JWT_SECRET/);
  });
});
