/**
 * Catálogo único de países.
 *
 * Antes existían dos listas desalineadas: las monedas ISO 4217 en
 * `server/strategy/countryFinancialData.ts` y los nombres y regiones en
 * `client/src/pages/Home.tsx`. Cualquier alta de país obligaba a editar ambas.
 * Este módulo es ahora la única fuente; servidor y cliente lo importan.
 *
 * Bilingüe: el nombre del país y el de su región llevan su par `{ es, en }`. La región es
 * además un identificador, no la etiqueta, para que comparar no dependa del idioma.
 */

import { loc, type Localized } from "../i18n";

export type CountryRegion = "europe" | "americas" | "asia_pacific" | "mea";

export const COUNTRY_REGIONS: { id: CountryRegion; label: Localized }[] = [
  { id: "europe", label: loc("Europa", "Europe") },
  { id: "americas", label: loc("Américas", "Americas") },
  { id: "asia_pacific", label: loc("Asia-Pacífico", "Asia Pacific") },
  { id: "mea", label: loc("Oriente Medio y África", "Middle East and Africa") },
];

export function regionLabel(id: CountryRegion): Localized {
  return COUNTRY_REGIONS.find((region) => region.id === id)?.label ?? loc(id, id);
}

export type CountryCatalogEntry = {
  /** Código ISO 3166-1 alfa-2. */
  code: string;
  /** Nombre del país en los dos idiomas, tal como se muestra en la interfaz. */
  name: Localized;
  region: CountryRegion;
  /** Moneda ISO 4217. Un país sin moneda declarada exige entrada manual de divisa y tipo de cambio. */
  currency: string;
};

export const countryCatalog: readonly CountryCatalogEntry[] = [
  { code: "DE", name: loc("Alemania", "Germany"), region: "europe", currency: "EUR" },
  { code: "FR", name: loc("Francia", "France"), region: "europe", currency: "EUR" },
  { code: "GB", name: loc("Reino Unido", "United Kingdom"), region: "europe", currency: "GBP" },
  { code: "ES", name: loc("España", "Spain"), region: "europe", currency: "EUR" },
  { code: "PL", name: loc("Polonia", "Poland"), region: "europe", currency: "PLN" },
  { code: "IT", name: loc("Italia", "Italy"), region: "europe", currency: "EUR" },
  { code: "US", name: loc("Estados Unidos", "United States"), region: "americas", currency: "USD" },
  { code: "CA", name: loc("Canadá", "Canada"), region: "americas", currency: "CAD" },
  { code: "MX", name: loc("México", "Mexico"), region: "americas", currency: "MXN" },
  { code: "BR", name: loc("Brasil", "Brazil"), region: "americas", currency: "BRL" },
  { code: "CL", name: loc("Chile", "Chile"), region: "americas", currency: "CLP" },
  { code: "CO", name: loc("Colombia", "Colombia"), region: "americas", currency: "COP" },
  { code: "CN", name: loc("China", "China"), region: "asia_pacific", currency: "CNY" },
  { code: "JP", name: loc("Japón", "Japan"), region: "asia_pacific", currency: "JPY" },
  { code: "KR", name: loc("Corea del Sur", "South Korea"), region: "asia_pacific", currency: "KRW" },
  { code: "IN", name: loc("India", "India"), region: "asia_pacific", currency: "INR" },
  { code: "ID", name: loc("Indonesia", "Indonesia"), region: "asia_pacific", currency: "IDR" },
  { code: "SG", name: loc("Singapur", "Singapore"), region: "asia_pacific", currency: "SGD" },
  { code: "AU", name: loc("Australia", "Australia"), region: "asia_pacific", currency: "AUD" },
  { code: "AE", name: loc("Emiratos Árabes Unidos", "United Arab Emirates"), region: "mea", currency: "AED" },
  { code: "SA", name: loc("Arabia Saudí", "Saudi Arabia"), region: "mea", currency: "SAR" },
  { code: "ZA", name: loc("Sudáfrica", "South Africa"), region: "mea", currency: "ZAR" },
  { code: "NG", name: loc("Nigeria", "Nigeria"), region: "mea", currency: "NGN" },
  { code: "EG", name: loc("Egipto", "Egypt"), region: "mea", currency: "EGP" },
] as const;

const byCode = new Map(countryCatalog.map((entry) => [entry.code, entry]));

export function findCountry(code: string): CountryCatalogEntry | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function currencyForCountry(code: string): string | null {
  return findCountry(code)?.currency ?? null;
}

export function countryName(code: string): Localized {
  const found = findCountry(code);
  if (found) return found.name;
  const fallback = code.trim().toUpperCase();
  return loc(fallback, fallback);
}
