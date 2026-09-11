import { currencyForCountry } from "@shared/domain/countries";
import { loc, type Localized } from "@shared/i18n";
export type PublicDataStatus = "live" | "partial" | "unavailable";

export type TaxReference = {
  ratePct: number | null;
  sourceYear: number | null;
  sourceStatus: PublicDataStatus;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  note: Localized;
};

export type FxReference = {
  localCurrency: string | null;
  reportingCurrency: string;
  rateToReportingCurrency: number | null;
  observedAt: string | null;
  sourceStatus: PublicDataStatus;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  note: Localized;
};

export type CountryFinancialReference = {
  countryCode: string;
  tax: TaxReference;
  fx: FxReference;
};

type TaxRow = { iso2: string; ratePct: number | null };
type FrankfurterRate = { date?: string; base?: string; quote?: string; rate?: number };

const taxDataUrl = "https://taxfoundation.org/wp-content/uploads/2025/12/rates_final-1.csv";
const taxPageUrl = "https://taxfoundation.org/data/all/global/corporate-tax-rates-by-country-2025/";
const frankfurterBaseUrl = "https://api.frankfurter.dev";
const cacheLifetimeMs = 24 * 60 * 60 * 1000;
let taxCache: { loadedAt: number; data: Map<string, TaxRow> } | null = null;
let taxFetchInProgress: Promise<Map<string, TaxRow>> | null = null;

/**
 * Monedas del catálogo. La lista vive ahora en `shared/domain/countries.ts` para que
 * servidor y cliente no mantengan dos catálogos que se desalinean.
 * Un código fuera del catálogo sigue siendo utilizable con moneda y tipo de cambio manuales.
 */
function currencyFor(countryCode: string) {
  return currencyForCountry(countryCode);
}

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { fields.push(value); value = ""; }
    else value += char;
  }
  fields.push(value);
  return fields;
}

function parseTaxCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  const isoIndex = headers.indexOf("iso_2");
  const yearIndex = headers.indexOf("2025");
  if (isoIndex < 0 || yearIndex < 0) throw new Error("Tax Foundation CSV is missing iso_2 or 2025 columns");
  const data = new Map<string, TaxRow>();
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const iso2 = values[isoIndex]?.trim().toUpperCase();
    const rawRate = values[yearIndex]?.trim();
    const ratePct = rawRate && rawRate !== "NA" ? Number(rawRate) : null;
    if (iso2 && /^[A-Z]{2}$/.test(iso2)) data.set(iso2, { iso2, ratePct: Number.isFinite(ratePct) ? ratePct : null });
  }
  return data;
}

async function getTaxDataset() {
  if (taxCache && Date.now() - taxCache.loadedAt < cacheLifetimeMs) return taxCache.data;
  if (taxFetchInProgress) return taxFetchInProgress;
  taxFetchInProgress = (async () => {
    const response = await fetch(taxDataUrl, { headers: { Accept: "text/csv" } });
    if (!response.ok) throw new Error(`Tax Foundation request failed: ${response.status}`);
    const data = parseTaxCsv(await response.text());
    taxCache = { loadedAt: Date.now(), data };
    return data;
  })();
  try { return await taxFetchInProgress; }
  finally { taxFetchInProgress = null; }
}

export async function getCorporateTaxReference(countryCode: string): Promise<TaxReference> {
  const retrievedAt = new Date().toISOString();
  const normalized = countryCode.trim().toUpperCase();
  try {
    const dataset = await getTaxDataset();
    const result = dataset.get(normalized);
    if (!result || result.ratePct === null) {
      return { ratePct: null, sourceYear: 2025, sourceStatus: "unavailable", sourceName: "Tax Foundation — Corporate Tax Rates Around the World", sourceUrl: taxPageUrl, retrievedAt, note: loc(
        "La fuente no ofrece una tasa corporativa estatutaria comparable para este código ISO en 2025.",
        "The source offers no comparable statutory corporate rate for this ISO code in 2025."
      ) };
    }
    return { ratePct: result.ratePct, sourceYear: 2025, sourceStatus: "live", sourceName: "Tax Foundation — Corporate Tax Rates Around the World", sourceUrl: taxPageUrl, retrievedAt, note: loc(
      "Tasa corporativa estatutaria máxima estándar y combinada. No incorpora regímenes especiales, incentivos sectoriales, pérdidas fiscales, impuestos de distribución ni la posición particular de la empresa.",
      "Top standard and combined statutory corporate rate. It does not take in special regimes, sector incentives, tax losses, distribution taxes or the particular position of the company."
    ) };
  } catch (error) {
    return { ratePct: null, sourceYear: null, sourceStatus: "unavailable", sourceName: "Tax Foundation — Corporate Tax Rates Around the World", sourceUrl: taxPageUrl, retrievedAt, note: loc("No se pudo consultar la fuente de impuestos.", "The tax source could not be queried.") };
  }
}

export async function getCountryCurrency(countryCode: string) {
  return currencyFor(countryCode);
}

export async function getExchangeRateReference(countryCode: string, reportingCurrency = "USD"): Promise<FxReference> {
  const retrievedAt = new Date().toISOString();
  const target = reportingCurrency.trim().toUpperCase() || "USD";
  const localCurrency = await getCountryCurrency(countryCode);
  if (!localCurrency) {
    return { localCurrency: null, reportingCurrency: target, rateToReportingCurrency: null, observedAt: null, sourceStatus: "unavailable", sourceName: "Frankfurter", sourceUrl: "https://frankfurter.dev/", retrievedAt, note: loc(
      "El código de país no tiene una moneda preconfigurada en el catálogo actual. Introduzca moneda y tipo de cambio manualmente.",
      "The country code has no preconfigured currency in the current catalogue. Enter the currency and the exchange rate by hand."
    ) };
  }
  if (localCurrency === target) {
    return { localCurrency, reportingCurrency: target, rateToReportingCurrency: 1, observedAt: new Date().toISOString().slice(0, 10), sourceStatus: "live", sourceName: "Frankfurter", sourceUrl: "https://frankfurter.dev/", retrievedAt, note: loc("Moneda local y de reporte idénticas; se aplica tipo de cambio 1,0.", "Local and reporting currency are the same; an exchange rate of 1.0 applies.") };
  }
  try {
    const response = await fetch(`${frankfurterBaseUrl}/v2/rate/${encodeURIComponent(localCurrency)}/${encodeURIComponent(target)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Frankfurter request failed: ${response.status}`);
    const body = await response.json() as FrankfurterRate;
    const rate = body.rate;
    if (!Number.isFinite(rate) || !rate || rate <= 0) throw new Error("Frankfurter returned no valid rate");
    return { localCurrency, reportingCurrency: target, rateToReportingCurrency: rate, observedAt: body.date ?? null, sourceStatus: "live", sourceName: "Frankfurter", sourceUrl: `https://api.frankfurter.dev/v2/rate/${localCurrency}/${target}`, retrievedAt, note: loc(
      "Tipo de cambio de referencia al cierre de la fecha indicada. No es una cotización ejecutable, una previsión ni una cobertura de divisa.",
      "Reference exchange rate at the close of the date shown. It is not an executable quote, a forecast or a currency hedge."
    ) };
  } catch (error) {
    return { localCurrency, reportingCurrency: target, rateToReportingCurrency: null, observedAt: null, sourceStatus: "unavailable", sourceName: "Frankfurter", sourceUrl: "https://frankfurter.dev/", retrievedAt, note: loc("No se pudo consultar el tipo de cambio.", "The exchange rate could not be queried.") };
  }
}

export async function getCountryFinancialReference(countryCode: string, reportingCurrency = "USD"): Promise<CountryFinancialReference> {
  const [tax, fx] = await Promise.all([getCorporateTaxReference(countryCode), getExchangeRateReference(countryCode, reportingCurrency)]);
  return { countryCode: countryCode.trim().toUpperCase(), tax, fx };
}

export const financialPublicSources: { name: string; live: boolean; status: Localized; coverage: Localized; use: Localized; url: string }[] = [
  {
    name: "Tax Foundation — Corporate Tax Rates Around the World",
    live: true,
    status: loc("Conectado", "Connected"),
    coverage: loc(
      "Tasas corporativas estatutarias estándar de 226 jurisdicciones; publicación 2025.",
      "Standard statutory corporate rates for 226 jurisdictions; 2025 publication."
    ),
    use: loc(
      "Valor inicial de impuesto corporativo para sensibilidad; editable y no sustitutivo de un análisis fiscal local.",
      "A starting corporate tax value for sensitivity; editable, and no substitute for local tax analysis."
    ),
    url: taxPageUrl,
  },
  {
    name: "Frankfurter",
    live: true,
    status: loc("Conectado", "Connected"),
    coverage: loc(
      "Tipos de cambio actuales e históricos de 205 monedas, con fuentes de 94 bancos centrales.",
      "Current and historical exchange rates for 205 currencies, sourced from 94 central banks."
    ),
    use: loc(
      "Conversión de moneda local a moneda de reporte; tipo de referencia no ejecutable y editable.",
      "Conversion from local to reporting currency; a reference rate, not executable, and editable."
    ),
    url: "https://frankfurter.dev/",
  },
];

export { parseTaxCsv };
