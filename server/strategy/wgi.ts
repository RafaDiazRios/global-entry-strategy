import * as XLSX from "xlsx";

export type GovernanceData = {
  politicalStability: number | null;
  governmentEffectiveness: number | null;
  regulatoryQuality: number | null;
  ruleOfLaw: number | null;
  controlOfCorruption: number | null;
  sourceYear: number | null;
  sourceStatus: "live" | "partial" | "unavailable";
};

type WgiRow = Record<string, string | number | null | undefined>;
type CountryApiResponse = [unknown, { id?: string }[]?];

const WGI_XLSX_URL = "https://www.worldbank.org/content/dam/sites/govindicators/doc/wgidataset_with_sourcedata-2025.xlsx";
const sheets = {
  pv: "politicalStability",
  ge: "governmentEffectiveness",
  rq: "regulatoryQuality",
  rl: "ruleOfLaw",
  cc: "controlOfCorruption",
} as const;

let datasetCache: Map<string, GovernanceData> | null = null;
let datasetFetchedAt = 0;
let datasetInFlight: Promise<Map<string, GovernanceData>> | null = null;
const iso3Cache = new Map<string, string | null>();

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function resolveIso3(countryCode: string): Promise<string | null> {
  const normalized = countryCode.toUpperCase();
  if (normalized.length === 3) return normalized;
  if (iso3Cache.has(normalized)) return iso3Cache.get(normalized) ?? null;
  try {
    const response = await fetch(`https://api.worldbank.org/v2/country/${encodeURIComponent(normalized)}?format=json`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Country lookup failed: ${response.status}`);
    const body = (await response.json()) as CountryApiResponse;
    const iso3 = body[1]?.[0]?.id?.toUpperCase() ?? null;
    iso3Cache.set(normalized, iso3);
    return iso3;
  } catch {
    iso3Cache.set(normalized, null);
    return null;
  }
}

async function loadDataset() {
  const response = await fetch(WGI_XLSX_URL, { headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  if (!response.ok) throw new Error(`WGI download failed: ${response.status}`);
  const bytes = await response.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const values = new Map<string, Partial<GovernanceData>>();

  for (const [sheetName, field] of Object.entries(sheets)) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    const rows = XLSX.utils.sheet_to_json<WgiRow>(worksheet, { defval: null });
    const newestByEconomy = new Map<string, WgiRow>();
    rows.forEach((row) => {
      const iso3 = typeof row["Economy (code)"] === "string" ? row["Economy (code)"] : null;
      const year = numeric(row.Year);
      if (!iso3 || year === null) return;
      const existing = newestByEconomy.get(iso3);
      if (!existing || year > (numeric(existing.Year) ?? -Infinity)) newestByEconomy.set(iso3, row);
    });
    newestByEconomy.forEach((row, iso3) => {
      const existing = values.get(iso3) ?? {};
      const score = numeric(row["Governance score (0-100)"]);
      values.set(iso3, { ...existing, [field]: score, sourceYear: Math.max(numeric(existing.sourceYear) ?? 0, numeric(row.Year) ?? 0) || null });
    });
  }

  datasetCache = new Map(
    Array.from(values.entries()).map(([iso3, value]) => {
      const scoreValues = [value.politicalStability, value.governmentEffectiveness, value.regulatoryQuality, value.ruleOfLaw, value.controlOfCorruption].filter((score) => score !== null && score !== undefined);
      return [iso3, {
        politicalStability: value.politicalStability ?? null,
        governmentEffectiveness: value.governmentEffectiveness ?? null,
        regulatoryQuality: value.regulatoryQuality ?? null,
        ruleOfLaw: value.ruleOfLaw ?? null,
        controlOfCorruption: value.controlOfCorruption ?? null,
        sourceYear: value.sourceYear ?? null,
        sourceStatus: scoreValues.length === 5 ? "live" : scoreValues.length >= 2 ? "partial" : "unavailable",
      } satisfies GovernanceData];
    }),
  );
  datasetFetchedAt = Date.now();
  return datasetCache;
}

async function getDataset() {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (datasetCache && Date.now() - datasetFetchedAt < twentyFourHours) return datasetCache;
  if (!datasetInFlight) {
    datasetInFlight = loadDataset().finally(() => { datasetInFlight = null; });
  }
  return datasetInFlight;
}

export async function getWgiGovernanceData(countryCode: string): Promise<GovernanceData> {
  try {
    const iso3 = await resolveIso3(countryCode);
    if (!iso3) throw new Error("ISO3 code unavailable");
    return (await getDataset()).get(iso3) ?? {
      politicalStability: null, governmentEffectiveness: null, regulatoryQuality: null, ruleOfLaw: null, controlOfCorruption: null, sourceYear: null, sourceStatus: "unavailable",
    };
  } catch {
    return {
      politicalStability: null, governmentEffectiveness: null, regulatoryQuality: null, ruleOfLaw: null, controlOfCorruption: null, sourceYear: null, sourceStatus: "unavailable",
    };
  }
}

export const WGI_SOURCE_URL = WGI_XLSX_URL;
