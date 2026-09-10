/**
 * Catálogo único de países.
 *
 * Antes existían dos listas desalineadas: las monedas ISO 4217 en
 * `server/strategy/countryFinancialData.ts` y los nombres y regiones en
 * `client/src/pages/Home.tsx`. Cualquier alta de país obligaba a editar ambas.
 * Este módulo es ahora la única fuente; servidor y cliente lo importan.
 */

export type CountryRegion = "Europa" | "Américas" | "Asia-Pacífico" | "Oriente Medio y África";

export type CountryCatalogEntry = {
  /** Código ISO 3166-1 alfa-2. */
  code: string;
  /** Nombre en español, tal como se muestra en la interfaz. */
  name: string;
  region: CountryRegion;
  /** Moneda ISO 4217. Un país sin moneda declarada exige entrada manual de divisa y tipo de cambio. */
  currency: string;
};

export const countryCatalog: readonly CountryCatalogEntry[] = [
  { code: "DE", name: "Alemania", region: "Europa", currency: "EUR" },
  { code: "FR", name: "Francia", region: "Europa", currency: "EUR" },
  { code: "GB", name: "Reino Unido", region: "Europa", currency: "GBP" },
  { code: "ES", name: "España", region: "Europa", currency: "EUR" },
  { code: "PL", name: "Polonia", region: "Europa", currency: "PLN" },
  { code: "IT", name: "Italia", region: "Europa", currency: "EUR" },
  { code: "US", name: "Estados Unidos", region: "Américas", currency: "USD" },
  { code: "CA", name: "Canadá", region: "Américas", currency: "CAD" },
  { code: "MX", name: "México", region: "Américas", currency: "MXN" },
  { code: "BR", name: "Brasil", region: "Américas", currency: "BRL" },
  { code: "CL", name: "Chile", region: "Américas", currency: "CLP" },
  { code: "CO", name: "Colombia", region: "Américas", currency: "COP" },
  { code: "CN", name: "China", region: "Asia-Pacífico", currency: "CNY" },
  { code: "JP", name: "Japón", region: "Asia-Pacífico", currency: "JPY" },
  { code: "KR", name: "Corea del Sur", region: "Asia-Pacífico", currency: "KRW" },
  { code: "IN", name: "India", region: "Asia-Pacífico", currency: "INR" },
  { code: "ID", name: "Indonesia", region: "Asia-Pacífico", currency: "IDR" },
  { code: "SG", name: "Singapur", region: "Asia-Pacífico", currency: "SGD" },
  { code: "AU", name: "Australia", region: "Asia-Pacífico", currency: "AUD" },
  { code: "AE", name: "Emiratos Árabes Unidos", region: "Oriente Medio y África", currency: "AED" },
  { code: "SA", name: "Arabia Saudí", region: "Oriente Medio y África", currency: "SAR" },
  { code: "ZA", name: "Sudáfrica", region: "Oriente Medio y África", currency: "ZAR" },
  { code: "NG", name: "Nigeria", region: "Oriente Medio y África", currency: "NGN" },
  { code: "EG", name: "Egipto", region: "Oriente Medio y África", currency: "EGP" },
] as const;

const byCode = new Map(countryCatalog.map((entry) => [entry.code, entry]));

export function findCountry(code: string): CountryCatalogEntry | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function currencyForCountry(code: string): string | null {
  return findCountry(code)?.currency ?? null;
}

export function countryName(code: string): string {
  return findCountry(code)?.name ?? code.trim().toUpperCase();
}
