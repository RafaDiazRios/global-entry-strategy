import type { MarketData } from "./engine";

type WorldBankRow = {
  date?: string;
  value?: number | null;
};

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
} as const;

async function latestValue(countryCode: string, indicator: string): Promise<{ value: number | null; year: number | null }> {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}/indicator/${indicator}?format=json&per_page=8&date=2018:2025`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator}: ${response.status}`);
  const body = (await response.json()) as WorldBankResponse;
  const rows = body[1] ?? [];
  const latest = rows.find((row) => row.value !== null && row.value !== undefined);
  return { value: latest?.value ?? null, year: latest?.date ? Number(latest.date) : null };
}

export async function getWorldBankMarketData(countryCode: string): Promise<MarketData> {
  const entries = await Promise.all(
    Object.entries(indicators).map(async ([field, indicator]) => {
      try {
        const result = await latestValue(countryCode, indicator);
        return [field, result] as const;
      } catch {
        return [field, { value: null, year: null }] as const;
      }
    }),
  );

  const mapped = Object.fromEntries(entries) as Record<string, { value: number | null; year: number | null }>;
  const values = Object.values(mapped);
  const available = values.filter((entry) => entry.value !== null).length;
  const sourceYears = values.map((entry) => entry.year).filter((year): year is number => year !== null);

  return {
    gdpUsd: mapped.gdpUsd.value,
    gdpPerCapita: mapped.gdpPerCapita.value,
    gdpGrowth: mapped.gdpGrowth.value,
    population: mapped.population.value,
    urbanization: mapped.urbanization.value,
    internetUse: mapped.internetUse.value,
    tradeOpenness: mapped.tradeOpenness.value,
    investmentRate: mapped.investmentRate.value,
    sourceYear: sourceYears.length ? Math.max(...sourceYears) : null,
    sourceStatus: available === Object.keys(indicators).length ? "live" : available >= 3 ? "partial" : "unavailable",
  };
}

export const publicSources = [
  {
    name: "World Bank Open Data",
    status: "Conectado",
    coverage: "PIB, PIB per cápita, crecimiento, población, urbanización, internet, comercio e inversión",
    use: "Indicadores macroeconómicos comparables y actualizables por país.",
    url: "https://data.worldbank.org/",
  },
  {
    name: "UNCTADstat",
    status: "Próxima conexión",
    coverage: "IED, comercio, inversión internacional y estadísticas por sector",
    use: "Complemento para atractividad de inversión y exposición internacional.",
    url: "https://unctadstat.unctad.org/",
  },
  {
    name: "Worldwide Governance Indicators",
    status: "Pendiente de parametrización",
    coverage: "Gobernanza, estado de derecho, estabilidad política y calidad regulatoria",
    use: "Evidencia para las dimensiones política, administrativa y de riesgo.",
    url: "https://www.worldbank.org/en/publication/worldwide-governance-indicators",
  },
  {
    name: "International Labour Organization",
    status: "Pendiente de parametrización",
    coverage: "Mercado laboral, empleo, salarios y capacidades",
    use: "Evidencia para disponibilidad y coste de recursos humanos.",
    url: "https://ilostat.ilo.org/",
  },
];
