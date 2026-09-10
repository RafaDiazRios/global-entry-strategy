export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Inicia el login. El servidor construye la URL de Google y gestiona el nonce, de modo que
 * el cliente no necesita ninguna variable de entorno ni conocer al proveedor.
 */
export const startLogin = () => {
  window.location.href = "/api/auth/login";
};
