/**
 * Bilingüe español / inglés.
 *
 * Dos decisiones de diseño que explican por qué esto tiene esta forma y no otra.
 *
 * Primera: el texto de los marcos vive junto a la definición del marco, no en un fichero de
 * traducciones aparte. Un `Localized` es un par `{ es, en }` incrustado donde estaba la
 * cadena. Así, cuando alguien cambie la definición de una tabla del libro, ve los dos
 * idiomas en la misma pantalla y no puede olvidarse de uno. Un diccionario por claves
 * separaría el concepto de su nombre, que es exactamente el error que queremos evitar en
 * una herramienta cuya razón de ser es la fidelidad al original.
 *
 * Segunda: el servidor devuelve los dos idiomas y el cliente elige. No hace falta arrastrar
 * el idioma por cada llamada ni recalcular nada al cambiarlo, y el conmutador es inmediato.
 * El coste es un payload algo mayor, irrelevante para estos volúmenes.
 *
 * Y una observación que conviene tener presente: el libro está en inglés. «Window of
 * opportunity», «first mover», «liability of foreignness», «Transfer, Adapt, Create» son los
 * términos del original. En inglés esta herramienta no traduce esos nombres: los devuelve.
 */

export const LANGUAGES = ["es", "en"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: Lang = "es";

export type Localized = { es: string; en: string };

export const LANGUAGE_NAMES: Record<Lang, string> = { es: "Español", en: "English" };

/** Atajo para escribir pares sin repetir las claves en cada tabla. */
export function loc(es: string, en: string): Localized {
  return { es, en };
}

export function pick(value: Localized | string | null | undefined, lang: Lang): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value[DEFAULT_LANG] ?? "";
}

export function pickAll(values: (Localized | string)[] | null | undefined, lang: Lang): string[] {
  return (values ?? []).map((value) => pick(value, lang));
}

/** Normaliza lo que diga el navegador a uno de los idiomas que existen. */
export function resolveLang(candidate: string | null | undefined): Lang {
  if (!candidate) return DEFAULT_LANG;
  const base = candidate.toLowerCase().split("-")[0];
  return (LANGUAGES as readonly string[]).includes(base) ? (base as Lang) : DEFAULT_LANG;
}
