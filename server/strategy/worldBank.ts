import type { MarketData } from "./engine";
import { getWgiGovernanceData } from "./wgi";

type WorldBankRow = { date?: string; value?: number | null };
type WorldBankResponse = [unknown, WorldBankRow[]?];

const indicators = {
  gdpUsd: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  population: "SP.POP.TOTL",
  urbanization: "SP.URB.TOTL.IN.ZS",
  internetUse: "IT.NET.USER.ZS",
  tradeOpenness: "NE.TRD.GNFS.ZS",
  investmentRate: "NE.GDI.FTOT.ZS",
  fdiInflowUsd: "BX.KLT.DINV.CD.WD",
  fdiInflowPctGdp: "BX.KLT.DINV.WD.GD.ZS",
} as const;

async function latestValue(countryCode: string, indicator: string): Promise<{ value: number | null; year: number | null }> {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}/indicator/${indicator}?format=json&per_page=8&date=2018:2025`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator}: ${response.status}`);
  const body = (await response.json()) as WorldBankResponse;
  const latest = (body[1] ?? []).find((row) => row.value !== null && row.value !== undefined);
  return { value: latest?.value ?? null, year: latest?.date ? Number(latest.date) : null };
}

export async function getWorldBankMarketData(countryCode: string, includeGovernance = true): Promise<MarketData> {
  const entries = await Promise.all(
    Object.entries(indicators).map(async ([field, indicator]) => {
      try { return [field, await latestValue(countryCode, indicator)] as const; }
      catch { return [field, { value: null, year: null }] as const; }
    }),
  );
  const mapped = Object.fromEntries(entries) as Record<string, { value: number | null; year: number | null }>;
  const governance = includeGovernance
    ? await getWgiGovernanceData(countryCode)
    : { politicalStability: null, governmentEffectiveness: null, regulatoryQuality: null, ruleOfLaw: null, controlOfCorruption: null, sourceYear: null, sourceStatus: "unavailable" as const };
  const values = Object.values(mapped);
  const available = values.filter((entry) => entry.value !== null).length;
  const years = [...values.map((entry) => entry.year), governance.sourceYear].filter((year): year is number => year !== null);

  return {
    gdpUsd: mapped.gdpUsd.value,
    gdpPerCapita: mapped.gdpPerCapita.value,
    gdpGrowth: mapped.gdpGrowth.value,
    population: mapped.population.value,
    urbanization: mapped.urbanization.value,
    internetUse: mapped.internetUse.value,
    tradeOpenness: mapped.tradeOpenness.value,
    investmentRate: mapped.investmentRate.value,
    fdiInflowUsd: mapped.fdiInflowUsd.value,
    fdiInflowPctGdp: mapped.fdiInflowPctGdp.value,
    governance,
    sourceYear: years.length ? Math.max(...years) : null,
    lastUpdatedAt: new Date().toISOString(),
    manualFields: [],
    sourceStatus: available >= 8 ? "live" : available >= 4 ? "partial" : "unavailable",
  };
}

export const publicSources = [
  {
    name: "World Bank Open Data",
    status: "Conectado",
    coverage: "PIB, población, crecimiento, comercio, conectividad e inversión doméstica",
    use: "Indicadores macroeconómicos comparables y actualizables por país.",
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
