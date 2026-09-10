export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
/** Duración de la sesión emitida por la aplicación. */
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

/**
 * Nonce de un solo uso que ata el login al navegador que lo inició. El prefijo `__Host-`
 * fuerza que la cookie sea host-only (Secure, Path=/, sin Domain).
 */
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";
