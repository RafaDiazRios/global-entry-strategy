import type { MarketData } from "./engine";
import { getWgiGovernanceData } from "./wgi";

type WorldBankRow = { date?: string; value?: number | null };
type WorldBankResponse = [unknown, WorldBankRow[]?];

const transientStatuses = new Set([429, 500, 502, 503, 504]);

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readWorldBankJson(url: string, indicator: string): Promise<WorldBankResponse> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        if (transientStatuses.has(response.status) && attempt < 2) {
          await delay(250 * (attempt + 1));
          continue;
        }
        throw new Error(`World Bank request failed for ${indicator}: ${response.status}`);
      }
      const text = await response.text();
      try {
        return JSON.parse(text) as WorldBankResponse;
      } catch {
        throw new Error(`World Bank returned a non-JSON response for ${indicator}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("World Bank request failed");
      if (attempt < 2) await delay(250 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`World Bank request failed for ${indicator}`);
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

/**
 * Indicadores de la Tabla 6.1 «Macro indicators used in international market assessments»
 * (Lasserre y Monteiro, 5.ª ed., p. 231), agrupados como los agrupa el libro.
 * La tabla pide cuatro familias: económica, sociológica, demográfica e institucional.
 */
const indicators = {
  // Económicos
  gdpUsd: "NY.GDP.MKTP.CD",
  gdpPpp: "NY.GDP.MKTP.PP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  gdpPerCapitaPpp: "NY.GDP.PCAP.PP.CD",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  incomeDistributionGini: "SI.POV.GINI",
  householdConsumptionPctGdp: "NE.CON.PRVT.ZS",
  savingsRate: "NY.GNS.ICTR.ZS",
  tradeOpenness: "NE.TRD.GNFS.ZS",
  investmentRate: "NE.GDI.FTOT.ZS",
  fdiInflowUsd: "BX.KLT.DINV.CD.WD",
  fdiInflowPctGdp: "BX.KLT.DINV.WD.GD.ZS",
  // Sociológicos y demográficos
  population: "SP.POP.TOTL",
  populationGrowth: "SP.POP.GROW",
  urbanization: "SP.URB.TOTL.IN.ZS",
  workingAgeSharePct: "SP.POP.1564.TO.ZS",
  // Institucionales
  governmentSpendingPctGdp: "NE.CON.GOVT.ZS",
  tertiaryEnrolmentPct: "SE.TER.ENRR",
  researchersPerMillion: "SP.POP.SCIE.RD.P6",
  researchSpendingPctGdp: "GB.XPD.RSDV.GD.ZS",
  internetUse: "IT.NET.USER.ZS",
  electricityAccessPct: "EG.ELC.ACCS.ZS",
} as const;

/** Indicadores que ya existían antes de ampliar a la Tabla 6.1, usados para medir cobertura. */
const coreIndicatorFields = [
  "gdpUsd", "gdpPerCapita", "gdpGrowth", "population", "urbanization",
  "internetUse", "tradeOpenness", "investmentRate", "fdiInflowUsd", "fdiInflowPctGdp",
] as const;

async function latestValue(countryCode: string, indicator: string): Promise<{ value: number | null; year: number | null }> {
  // Algunas series de la Tabla 6.1 se publican con retraso, así que la ventana se abre a diez años.
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}/indicator/${indicator}?format=json&per_page=15&date=2015:2025`;
  const body = await readWorldBankJson(url, indicator);
  const latest = (body[1] ?? []).find((row) => row.value !== null && row.value !== undefined);
  return { value: latest?.value ?? null, year: latest?.date ? Number(latest.date) : null };
}

/**
 * Serie de crecimiento real para medir la variabilidad económica.
 * El libro mide el riesgo económico con el coeficiente de variación del crecimiento anual,
 * no con su nivel: dos países con el mismo crecimiento medio y distinta dispersión no
 * presentan el mismo riesgo (Figura 6.13, p. 245).
 */
export async function getGrowthSeries(countryCode: string, fromYear = 2004, toYear = 2024) {
  const indicator = indicators.gdpGrowth;
  const span = toYear - fromYear + 1;
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}/indicator/${indicator}?format=json&per_page=${span}&date=${fromYear}:${toYear}`;
  try {
    const body = await readWorldBankJson(url, indicator);
    return (body[1] ?? [])
      .filter((row) => row.value !== null && row.value !== undefined)
      .map((row) => ({ year: Number(row.date), value: row.value as number }))
      .sort((a, b) => a.year - b.year);
  } catch {
    return [];
  }
}

/**
 * Pares (renta per cápita, consumo) para ajustar una curva de penetración.
 * El indicador de consumo lo elige el analista según su industria: el libro usa
 * suscripciones móviles por cien habitantes y producción de cemento por cien habitantes
 * como los dos ejemplos de forma opuesta (Figuras 6.4 y 6.5, p. 230).
 */
export async function getIndicatorPoints(indicator: string, countryCodes: string[]) {
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(indicator)) throw new Error("Código de indicador no válido.");
  const codes = Array.from(new Set(countryCodes.map((code) => code.trim().toUpperCase())));
  const rows = await mapWithConcurrency(codes, 3, async (code) => {
    try {
      const [income, value] = await Promise.all([
        latestValue(code, indicators.gdpPerCapita),
        latestValue(code, indicator),
      ]);
      if (income.value === null || value.value === null) return null;
      return { label: code, gdpPerCapita: income.value, value: value.value };
    } catch {
      return null;
    }
  });
  return rows.filter((row): row is { label: string; gdpPerCapita: number; value: number } => row !== null);
}

export async function getWorldBankMarketData(countryCode: string, includeGovernance = true): Promise<MarketData> {
  const entries = await mapWithConcurrency(
    Object.entries(indicators),
    3,
    async ([field, indicator]) => {
      try { return [field, await latestValue(countryCode, indicator)] as const; }
      catch { return [field, { value: null, year: null }] as const; }
    },
  );
  const mapped = Object.fromEntries(entries) as Record<string, { value: number | null; year: number | null }>;
  const governance = includeGovernance
    ? await getWgiGovernanceData(countryCode)
    : { politicalStability: null, governmentEffectiveness: null, regulatoryQuality: null, ruleOfLaw: null, controlOfCorruption: null, sourceYear: null, sourceStatus: "unavailable" as const };
  const values = Object.values(mapped);
  const coreAvailable = coreIndicatorFields.filter((field) => mapped[field]?.value !== null && mapped[field]?.value !== undefined).length;
  const years = [...values.map((entry) => entry.year), governance.sourceYear].filter((year): year is number => year !== null);
  const growthSeries = await getGrowthSeries(countryCode);

  return {
    gdpUsd: mapped.gdpUsd.value,
    gdpPpp: mapped.gdpPpp.value,
    gdpPerCapita: mapped.gdpPerCapita.value,
    gdpPerCapitaPpp: mapped.gdpPerCapitaPpp.value,
    gdpGrowth: mapped.gdpGrowth.value,
    incomeDistributionGini: mapped.incomeDistributionGini.value,
    householdConsumptionPctGdp: mapped.householdConsumptionPctGdp.value,
    savingsRate: mapped.savingsRate.value,
    population: mapped.population.value,
    populationGrowth: mapped.populationGrowth.value,
    urbanization: mapped.urbanization.value,
    workingAgeSharePct: mapped.workingAgeSharePct.value,
    governmentSpendingPctGdp: mapped.governmentSpendingPctGdp.value,
    tertiaryEnrolmentPct: mapped.tertiaryEnrolmentPct.value,
    researchersPerMillion: mapped.researchersPerMillion.value,
    researchSpendingPctGdp: mapped.researchSpendingPctGdp.value,
    internetUse: mapped.internetUse.value,
    electricityAccessPct: mapped.electricityAccessPct.value,
    tradeOpenness: mapped.tradeOpenness.value,
    investmentRate: mapped.investmentRate.value,
    fdiInflowUsd: mapped.fdiInflowUsd.value,
    fdiInflowPctGdp: mapped.fdiInflowPctGdp.value,
    gdpGrowthSeries: growthSeries.length ? growthSeries : null,
    governance,
    sourceYear: years.length ? Math.max(...years) : null,
    lastUpdatedAt: new Date().toISOString(),
    manualFields: [],
    sourceStatus: coreAvailable >= 8 ? "live" : coreAvailable >= 4 ? "partial" : "unavailable",
  };
}

export const publicSources = [
  {
    name: "World Bank Open Data",
    status: "Conectado",
    coverage: "PIB nominal y PPA, renta per cápita, crecimiento y su serie histórica, Gini, consumo de hogares, ahorro, población y su estructura, urbanización, gasto público, matrícula terciaria, investigadores, gasto en I+D, conectividad, acceso eléctrico, comercio e inversión",
    use: "Las cuatro familias de indicadores de la Tabla 6.1 del libro: económica, sociológica, demográfica e institucional.",
    url: "https://data.worldbank.org/",
  },
  {
    name: "UNCTAD — IED",
    status: "Conectado",
    coverage: "Flujos netos de IED entrante en US$ y como % del PIB",
    use: "Dato originado en UNCTAD, distribuido mediante la serie pública World Development Indicators.",
    url: "https://unctadstat.unctad.org/datacentre/reportInfo/US.FdiFlowsStock",
  },
  {
    name: "Worldwide Governance Indicators",
    status: "Conectado",
    coverage: "Estabilidad política, efectividad gubernamental, calidad regulatoria, estado de derecho y control de corrupción",
    use: "Descarga oficial WGI 2025 con puntuaciones absolutas 0–100, para más de 200 economías.",
    url: "https://www.worldbank.org/content/dam/sites/govindicators/doc/wgidataset_with_sourcedata-2025.xlsx",
  },
  {
    name: "International Labour Organization",
    status: "Pendiente de parametrización",
    coverage: "Mercado laboral, empleo, salarios y capacidades",
    use: "Siguiente extensión para disponibilidad y coste de recursos humanos.",
    url: "https://ilostat.ilo.org/",
  },
];
