import { loc, type Localized } from "./i18n";

/**
 * Errores bilingües.
 *
 * En el resto de la API el servidor devuelve los dos idiomas y el cliente elige. Un `Error`
 * no tiene sitio donde meter un par `{ es, en }`: solo lleva un `message`, y por el camino
 * de tRPC al cliente lo único que sobrevive es esa cadena. Así que el par viaja dentro del
 * mensaje, serializado, y el cliente lo vuelve a abrir.
 *
 * La alternativa era arrastrar el idioma en cada petición solo para poder redactar el
 * mensaje de fallo, que es peor: obliga a tocar todas las entradas de la API por una rama
 * que casi nunca se ejecuta.
 *
 * Lo que no venga de aquí (un fallo de red, un error de la base, un `throw` de una
 * dependencia) se muestra tal cual. Es preferible a inventarle una traducción.
 */

const MARK = "i18n:";

export function localizedError(es: string, en: string): Error {
  return new Error(MARK + JSON.stringify(loc(es, en)));
}

/** Devuelve el par si el error lo trae; si no, el texto plano que tenga. */
export function readLocalizedError(error: unknown): Localized | string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message.startsWith(MARK)) return message;
  try {
    const parsed = JSON.parse(message.slice(MARK.length)) as Partial<Localized>;
    if (typeof parsed?.es === "string" && typeof parsed?.en === "string") return parsed as Localized;
  } catch {
    // Un mensaje que empieza por la marca pero no es JSON válido se trata como texto.
  }
  return message;
}
