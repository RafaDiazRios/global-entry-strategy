export type EntryModeKey =
  | "greenfield"
  | "acquisition"
  | "alliance"
  | "licensing"
  | "distributor"
  | "office"
  | "digital";

export type ModeFinancialProfile = {
  initialInvestment?: number | null;
  annualOperatingCost?: number | null;
  revenueCapturePct?: number | null;
};

export type FinancialAssumptions = {
  currency?: string | null;
  tamYearOne?: number | null;
  annualMarketGrowthPct?: number | null;
  samPct?: number | null;
  somPctYearOne?: number | null;
  somPctHorizon?: number | null;
  operatingMarginPct?: number | null;
  discountRatePct?: number | null;
  modeProfiles?: Partial<Record<EntryModeKey, ModeFinancialProfile>>;
};

export type FinancialModeResult = {
  key: EntryModeKey;
  mode: string;
  status: "ok" | "insufficient_data" | "not_meaningful";
  roiPct: number | null;
  npv: number | null;
  paybackYear: number | null;
  cumulativeOperatingProfit: number | null;
  initialInvestment: number | null;
  annualOperatingCost: number | null;
  revenueCapturePct: number | null;
  missingInputs: string[];
};

export type FinancialResult = {
  status: "ok" | "insufficient_data";
  currency: string | null;
  horizonYears: number;
  market: {
    tamYearOne: number | null;
    tamAtHorizon: number | null;
    samAtHorizon: number | null;
    somRevenueYearOne: number | null;
    somRevenueAtHorizon: number | null;
  };
  alternatives: FinancialModeResult[];
  missingInputs: string[];
  methodology: string;
};

export type ModeForFinance = { key: EntryModeKey; mode: string };

function asNumber(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? null : value;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateMarket(assumptions: FinancialAssumptions, horizonYears: number) {
  const tamYearOne = asNumber(assumptions.tamYearOne);
  const growth = asNumber(assumptions.annualMarketGrowthPct);
  const samPct = asNumber(assumptions.samPct);
  const somYearOne = asNumber(assumptions.somPctYearOne);
  const somHorizon = asNumber(assumptions.somPctHorizon);
  if ([tamYearOne, growth, samPct, somYearOne, somHorizon].some((value) => value === null)) {
    return null;
  }
  const tamAtHorizon = tamYearOne! * Math.pow(1 + growth! / 100, Math.max(0, horizonYears - 1));
  const samAtHorizon = tamAtHorizon * (samPct! / 100);
  const samYearOne = tamYearOne! * (samPct! / 100);
  return {
    tamYearOne: round(tamYearOne!),
    tamAtHorizon: round(tamAtHorizon),
    samAtHorizon: round(samAtHorizon),
    somRevenueYearOne: round(samYearOne * (somYearOne! / 100)),
    somRevenueAtHorizon: round(samAtHorizon * (somHorizon! / 100)),
    annualRevenue: Array.from({ length: horizonYears }, (_, index) => {
      const year = index + 1;
      const tam = tamYearOne! * Math.pow(1 + growth! / 100, index);
      const sam = tam * (samPct! / 100);
      const progress = horizonYears === 1 ? 1 : index / (horizonYears - 1);
      const somPct = somYearOne! + (somHorizon! - somYearOne!) * progress;
      return sam * (somPct / 100);
    }),
  };
}

function missingCoreInputs(assumptions: FinancialAssumptions) {
  const checks: [keyof FinancialAssumptions, string][] = [
    ["currency", "moneda"],
    ["tamYearOne", "TAM anual del año 1"],
    ["annualMarketGrowthPct", "crecimiento anual del mercado"],
    ["samPct", "% de SAM"],
    ["somPctYearOne", "% de SOM en año 1"],
    ["somPctHorizon", "% de SOM en horizonte"],
    ["operatingMarginPct", "margen operativo"],
    ["discountRatePct", "tasa de descuento"],
  ];
  return checks
    .filter(([key]) => assumptions[key] === null || assumptions[key] === undefined || assumptions[key] === "")
    .map(([, label]) => label);
}

function calculateMode(
  assumptions: FinancialAssumptions,
  market: NonNullable<ReturnType<typeof calculateMarket>> | null,
  horizonYears: number,
  mode: ModeForFinance,
): FinancialModeResult {
  const profile = assumptions.modeProfiles?.[mode.key] ?? {};
  const investment = asNumber(profile.initialInvestment);
  const annualCost = asNumber(profile.annualOperatingCost);
  const capture = asNumber(profile.revenueCapturePct);
  const margin = asNumber(assumptions.operatingMarginPct);
  const discount = asNumber(assumptions.discountRatePct);
  const missing = [
    ...(market ? [] : ["variables de mercado TAM/SAM/SOM"]),
    ...(investment === null ? ["inversión inicial"] : []),
    ...(annualCost === null ? ["coste operativo anual"] : []),
    ...(capture === null ? ["captura de ingresos"] : []),
    ...(margin === null ? ["margen operativo"] : []),
    ...(discount === null ? ["tasa de descuento"] : []),
  ];
  if (missing.length) {
    return { key: mode.key, mode: mode.mode, status: "insufficient_data", roiPct: null, npv: null, paybackYear: null, cumulativeOperatingProfit: null, initialInvestment: investment, annualOperatingCost: annualCost, revenueCapturePct: capture, missingInputs: missing };
  }
  if (investment! <= 0) {
    return { key: mode.key, mode: mode.mode, status: "not_meaningful", roiPct: null, npv: null, paybackYear: null, cumulativeOperatingProfit: null, initialInvestment: investment, annualOperatingCost: annualCost, revenueCapturePct: capture, missingInputs: ["La inversión inicial debe ser positiva para calcular ROI."] };
  }

  let cumulativeCash = -investment!;
  let cumulativeOperatingProfit = 0;
  let npv = -investment!;
  let paybackYear: number | null = null;
  market!.annualRevenue.forEach((revenue, index) => {
    const operatingProfit = revenue * (capture! / 100) * (margin! / 100) - annualCost!;
    cumulativeOperatingProfit += operatingProfit;
    cumulativeCash += operatingProfit;
    npv += operatingProfit / Math.pow(1 + discount! / 100, index + 1);
    if (paybackYear === null && cumulativeCash >= 0) paybackYear = index + 1;
  });
  return {
    key: mode.key,
    mode: mode.mode,
    status: "ok",
    roiPct: round(((cumulativeOperatingProfit - investment!) / investment!) * 100),
    npv: round(npv),
    paybackYear,
    cumulativeOperatingProfit: round(cumulativeOperatingProfit),
    initialInvestment: investment,
    annualOperatingCost: annualCost,
    revenueCapturePct: capture,
    missingInputs: [],
  };
}

export function evaluateFinancials(
  assumptions: FinancialAssumptions | undefined,
  modeOptions: ModeForFinance[],
  horizonYears: number,
): FinancialResult {
  const provided = assumptions ?? {};
  const missingInputs = missingCoreInputs(provided);
  const market = missingInputs.length ? null : calculateMarket(provided, horizonYears);
  const alternatives = modeOptions.map((mode) => calculateMode(provided, market, horizonYears, mode));
  return {
    status: market ? "ok" : "insufficient_data",
    currency: provided.currency?.trim() || null,
    horizonYears,
    market: market
      ? { tamYearOne: market.tamYearOne, tamAtHorizon: market.tamAtHorizon, samAtHorizon: market.samAtHorizon, somRevenueYearOne: market.somRevenueYearOne, somRevenueAtHorizon: market.somRevenueAtHorizon }
      : { tamYearOne: asNumber(provided.tamYearOne), tamAtHorizon: null, samAtHorizon: null, somRevenueYearOne: null, somRevenueAtHorizon: null },
    alternatives,
    missingInputs,
    methodology: "TAM y SAM se proyectan con el crecimiento anual indicado. El SOM se interpola linealmente entre la cuota de año 1 y la cuota objetivo en el horizonte. ROI simple = (beneficio operativo acumulado − inversión inicial) / inversión inicial; NPV descuenta los beneficios operativos anuales y resta la inversión inicial en t=0.",
  };
}
