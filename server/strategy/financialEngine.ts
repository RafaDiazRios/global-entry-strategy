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

export type SensitivityScenarioKey = "base" | "optimistic" | "conservative";

export type SensitivityScenario = {
  /** Variation in price / revenue realization versus the base case, in percentage points. */
  priceRevenuePct?: number | null;
  /** Variation in operating margin, in percentage points rather than a percent change. */
  operatingMarginPctPoints?: number | null;
  /** Variation in reporting-currency units received per local-currency unit, in percentage points. */
  fxRatePct?: number | null;
};

export type FinancialDataProvenance = {
  sourceStatus: "live" | "partial" | "unavailable";
  sourceName: string;
  sourceUrl: string;
  sourceYear?: number | null;
  observedAt?: string | null;
  retrievedAt: string;
  note: string;
};

export type FinancialAssumptions = {
  /** Currency in which TAM, operating assumptions and investment are entered. */
  currency?: string | null;
  /** Optional output currency. Omit it when it equals the local currency. */
  reportingCurrency?: string | null;
  /** Units of reporting currency per 1 unit of local currency. */
  fxRateToReportingCurrency?: number | null;
  tamYearOne?: number | null;
  annualMarketGrowthPct?: number | null;
  samPct?: number | null;
  somPctYearOne?: number | null;
  somPctHorizon?: number | null;
  operatingMarginPct?: number | null;
  taxRatePct?: number | null;
  taxRateDataMode?: "public" | "manual";
  taxReference?: FinancialDataProvenance | null;
  workingCapitalPctRevenue?: number | null;
  discountRatePct?: number | null;
  terminalGrowthPct?: number | null;
  fxRateDataMode?: "public" | "manual";
  fxReference?: FinancialDataProvenance | null;
  sensitivityScenarios?: Partial<Record<Exclude<SensitivityScenarioKey, "base">, SensitivityScenario>>;
  modeProfiles?: Partial<Record<EntryModeKey, ModeFinancialProfile>>;
};

export type InvestmentThresholds = {
  /** Leave blank to use the reporting currency of each country. */
  currency?: string | null;
  advanceMinRiskAdjusted?: number | null;
  testMinRiskAdjusted?: number | null;
  minConfidence?: number | null;
  advanceMinNpv?: number | null;
  testMinNpv?: number | null;
  advanceMinRoiPct?: number | null;
  testMinRoiPct?: number | null;
  advanceMaxPaybackYears?: number | null;
  testMaxInitialInvestment?: number | null;
};

export const defaultInvestmentThresholds: Required<Omit<InvestmentThresholds, "currency" | "testMaxInitialInvestment">> & Pick<InvestmentThresholds, "currency" | "testMaxInitialInvestment"> = {
  currency: null,
  advanceMinRiskAdjusted: 65,
  testMinRiskAdjusted: 50,
  minConfidence: 60,
  advanceMinNpv: 0,
  testMinNpv: 0,
  advanceMinRoiPct: 20,
  testMinRoiPct: 0,
  advanceMaxPaybackYears: 5,
  testMaxInitialInvestment: null,
};

export type AnnualProjection = {
  year: number;
  revenue: number;
  operatingProfit: number;
  taxes: number;
  changeInWorkingCapital: number;
  freeCashFlow: number;
  discountFactor: number;
  presentValue: number;
};

export type FinancialModeResult = {
  key: EntryModeKey;
  mode: string;
  status: "ok" | "insufficient_data" | "not_meaningful";
  roiPct: number | null;
  npv: number | null;
  paybackYear: number | null;
  cumulativeOperatingProfit: number | null;
  cumulativeFreeCashFlow: number | null;
  initialInvestment: number | null;
  annualOperatingCost: number | null;
  revenueCapturePct: number | null;
  terminalValue: number | null;
  presentValueTerminal: number | null;
  annualProjection: AnnualProjection[];
  missingInputs: string[];
};

export type FinancialCaseResult = {
  status: "ok" | "insufficient_data";
  /** Output currency retained for backward compatibility in the interface. */
  currency: string | null;
  localCurrency: string | null;
  reportingCurrency: string | null;
  fxRateToReportingCurrency: number | null;
  horizonYears: number;
  assumptions: {
    taxRatePct: number | null;
    workingCapitalPctRevenue: number | null;
    discountRatePct: number | null;
    terminalGrowthPct: number | null;
  };
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

export type FinancialScenarioResult = {
  key: SensitivityScenarioKey;
  label: string;
  priceRevenuePct: number | null;
  operatingMarginPctPoints: number | null;
  fxRatePct: number | null;
  status: "ok" | "insufficient_data" | "not_meaningful";
  financial: FinancialCaseResult | null;
  missingInputs: string[];
  note: string;
};

export type FinancialResult = FinancialCaseResult & {
  scenarios: FinancialScenarioResult[];
};

export type InvestmentRecommendation = {
  action: "advance" | "test" | "discard" | "insufficient_data";
  label: string;
  summary: string;
  selectedMode: string | null;
  selectedModeKey: EntryModeKey | null;
  evaluatedMetrics: {
    riskAdjusted: number;
    confidence: number;
    roiPct: number | null;
    npv: number | null;
    paybackYear: number | null;
    initialInvestment: number | null;
    currency: string | null;
  };
  thresholds: InvestmentThresholds;
  reasons: string[];
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
  if ([tamYearOne, growth, samPct, somYearOne, somHorizon].some((value) => value === null)) return null;

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
      const tam = tamYearOne! * Math.pow(1 + growth! / 100, index);
      const sam = tam * (samPct! / 100);
      const progress = horizonYears === 1 ? 1 : index / (horizonYears - 1);
      const somPct = somYearOne! + (somHorizon! - somYearOne!) * progress;
      return sam * (somPct / 100);
    }),
  };
}

function resolveCurrencies(assumptions: FinancialAssumptions) {
  const localCurrency = assumptions.currency?.trim().toUpperCase() || null;
  const requestedReporting = assumptions.reportingCurrency?.trim().toUpperCase() || null;
  const reportingCurrency = requestedReporting || localCurrency;
  const rawFxRate = asNumber(assumptions.fxRateToReportingCurrency);
  const sameCurrency = !requestedReporting || requestedReporting === localCurrency;
  const fxRate = sameCurrency ? 1 : rawFxRate;
  return { localCurrency, reportingCurrency, fxRate, fxRequired: !sameCurrency };
}

function missingCoreInputs(assumptions: FinancialAssumptions) {
  const checks: [keyof FinancialAssumptions, string][] = [
    ["currency", "moneda local"],
    ["tamYearOne", "TAM anual del año 1"],
    ["annualMarketGrowthPct", "crecimiento anual del mercado"],
    ["samPct", "% de SAM"],
    ["somPctYearOne", "% de SOM en año 1"],
    ["somPctHorizon", "% de SOM en horizonte"],
    ["operatingMarginPct", "margen operativo"],
    ["taxRatePct", "tasa fiscal"],
    ["workingCapitalPctRevenue", "% de capital de trabajo"],
    ["discountRatePct", "tasa de descuento"],
    ["terminalGrowthPct", "crecimiento terminal"],
  ];
  const missing = checks
    .filter(([key]) => assumptions[key] === null || assumptions[key] === undefined || assumptions[key] === "")
    .map(([, label]) => label);
  const currencies = resolveCurrencies(assumptions);
  if (currencies.fxRequired && (currencies.fxRate === null || currencies.fxRate <= 0)) missing.push("tipo de cambio a moneda de reporte");
  return missing;
}

function calculateMode(
  assumptions: FinancialAssumptions,
  market: NonNullable<ReturnType<typeof calculateMarket>> | null,
  horizonYears: number,
  mode: ModeForFinance,
  revenueMultiplier = 1,
): FinancialModeResult {
  const profile = assumptions.modeProfiles?.[mode.key] ?? {};
  const investment = asNumber(profile.initialInvestment);
  const annualCost = asNumber(profile.annualOperatingCost);
  const capture = asNumber(profile.revenueCapturePct);
  const margin = asNumber(assumptions.operatingMarginPct);
  const taxRate = asNumber(assumptions.taxRatePct);
  const workingCapitalPctRevenue = asNumber(assumptions.workingCapitalPctRevenue);
  const discount = asNumber(assumptions.discountRatePct);
  const terminalGrowth = asNumber(assumptions.terminalGrowthPct);
  const { fxRate } = resolveCurrencies(assumptions);
  const missing = [
    ...(market ? [] : ["variables de mercado TAM/SAM/SOM"]),
    ...(investment === null ? ["inversión inicial"] : []),
    ...(annualCost === null ? ["coste operativo anual"] : []),
    ...(capture === null ? ["captura de ingresos"] : []),
    ...(margin === null ? ["margen operativo"] : []),
    ...(taxRate === null ? ["tasa fiscal"] : []),
    ...(workingCapitalPctRevenue === null ? ["capital de trabajo"] : []),
    ...(discount === null ? ["tasa de descuento"] : []),
    ...(terminalGrowth === null ? ["crecimiento terminal"] : []),
    ...(fxRate === null || fxRate <= 0 ? ["tipo de cambio"] : []),
  ];
  const blank = (status: FinancialModeResult["status"], issues: string[]): FinancialModeResult => ({
    key: mode.key, mode: mode.mode, status, roiPct: null, npv: null, paybackYear: null, cumulativeOperatingProfit: null,
    cumulativeFreeCashFlow: null, initialInvestment: investment === null || fxRate === null ? investment : round(investment * fxRate),
    annualOperatingCost: annualCost === null || fxRate === null ? annualCost : round(annualCost * fxRate), revenueCapturePct: capture,
    terminalValue: null, presentValueTerminal: null, annualProjection: [], missingInputs: issues,
  });
  if (missing.length) return blank("insufficient_data", missing);
  if (investment! <= 0) return blank("not_meaningful", ["La inversión inicial debe ser positiva para calcular ROI y recuperación."]);
  if (discount! <= terminalGrowth!) return blank("not_meaningful", ["La tasa de descuento debe superar el crecimiento terminal para calcular el valor terminal por perpetuidad."]);

  const investmentReporting = investment! * fxRate!;
  const annualCostReporting = annualCost! * fxRate!;
  let priorWorkingCapital = 0;
  let cumulativeCash = -investmentReporting;
  let cumulativeOperatingProfit = 0;
  let cumulativeFreeCashFlow = 0;
  let npv = -investmentReporting;
  let paybackYear: number | null = null;

  const annualProjection = market!.annualRevenue.map((localSomRevenue, index) => {
    const revenue = localSomRevenue * (capture! / 100) * fxRate! * revenueMultiplier;
    const operatingProfit = revenue * (margin! / 100) - annualCostReporting;
    const taxes = Math.max(operatingProfit, 0) * (taxRate! / 100);
    const workingCapitalBalance = revenue * (workingCapitalPctRevenue! / 100);
    const changeInWorkingCapital = workingCapitalBalance - priorWorkingCapital;
    priorWorkingCapital = workingCapitalBalance;
    const freeCashFlow = operatingProfit - taxes - changeInWorkingCapital;
    const discountFactor = 1 / Math.pow(1 + discount! / 100, index + 1);
    const presentValue = freeCashFlow * discountFactor;
    cumulativeOperatingProfit += operatingProfit;
    cumulativeFreeCashFlow += freeCashFlow;
    cumulativeCash += freeCashFlow;
    npv += presentValue;
    if (paybackYear === null && cumulativeCash >= 0) paybackYear = index + 1;
    return {
      year: index + 1,
      revenue: round(revenue),
      operatingProfit: round(operatingProfit),
      taxes: round(taxes),
      changeInWorkingCapital: round(changeInWorkingCapital),
      freeCashFlow: round(freeCashFlow),
      discountFactor: round(discountFactor),
      presentValue: round(presentValue),
    };
  });

  const finalRevenue = annualProjection.at(-1)?.revenue ?? 0;
  const terminalRevenue = finalRevenue * (1 + terminalGrowth! / 100);
  const terminalOperatingProfit = terminalRevenue * (margin! / 100) - annualCostReporting;
  const terminalTaxes = Math.max(terminalOperatingProfit, 0) * (taxRate! / 100);
  const terminalWorkingCapitalChange = terminalRevenue * (workingCapitalPctRevenue! / 100) - finalRevenue * (workingCapitalPctRevenue! / 100);
  const terminalFcf = terminalOperatingProfit - terminalTaxes - terminalWorkingCapitalChange;
  const terminalValue = terminalFcf / (discount! / 100 - terminalGrowth! / 100);
  const presentValueTerminal = terminalValue / Math.pow(1 + discount! / 100, horizonYears);
  npv += presentValueTerminal;

  return {
    key: mode.key,
    mode: mode.mode,
    status: "ok",
    roiPct: round(((cumulativeFreeCashFlow - investmentReporting) / investmentReporting) * 100),
    npv: round(npv),
    paybackYear,
    cumulativeOperatingProfit: round(cumulativeOperatingProfit),
    cumulativeFreeCashFlow: round(cumulativeFreeCashFlow),
    initialInvestment: round(investmentReporting),
    annualOperatingCost: round(annualCostReporting),
    revenueCapturePct: capture,
    terminalValue: round(terminalValue),
    presentValueTerminal: round(presentValueTerminal),
    annualProjection,
    missingInputs: [],
  };
}

function evaluateFinancialCase(
  assumptions: FinancialAssumptions | undefined,
  modeOptions: ModeForFinance[],
  horizonYears: number,
  revenueMultiplier = 1,
): FinancialCaseResult {
  const provided = assumptions ?? {};
  const missingInputs = missingCoreInputs(provided);
  const market = missingInputs.length ? null : calculateMarket(provided, horizonYears);
  const currencies = resolveCurrencies(provided);
  const alternatives = modeOptions.map((mode) => calculateMode(provided, market, horizonYears, mode, revenueMultiplier));
  return {
    status: market ? "ok" : "insufficient_data",
    currency: currencies.reportingCurrency,
    localCurrency: currencies.localCurrency,
    reportingCurrency: currencies.reportingCurrency,
    fxRateToReportingCurrency: currencies.fxRate,
    horizonYears,
    assumptions: {
      taxRatePct: asNumber(provided.taxRatePct),
      workingCapitalPctRevenue: asNumber(provided.workingCapitalPctRevenue),
      discountRatePct: asNumber(provided.discountRatePct),
      terminalGrowthPct: asNumber(provided.terminalGrowthPct),
    },
    market: market
      ? { tamYearOne: round(market.tamYearOne * (currencies.fxRate ?? 1)), tamAtHorizon: round(market.tamAtHorizon * (currencies.fxRate ?? 1)), samAtHorizon: round(market.samAtHorizon * (currencies.fxRate ?? 1)), somRevenueYearOne: round(market.somRevenueYearOne * (currencies.fxRate ?? 1)), somRevenueAtHorizon: round(market.somRevenueAtHorizon * (currencies.fxRate ?? 1)) }
      : { tamYearOne: asNumber(provided.tamYearOne), tamAtHorizon: null, samAtHorizon: null, somRevenueYearOne: null, somRevenueAtHorizon: null },
    alternatives,
    missingInputs,
    methodology: "TAM y SAM se proyectan con el crecimiento anual indicado; el SOM se interpola linealmente entre año 1 y el horizonte. Los flujos libres se calculan como EBIT después de impuestos menos el incremento de capital de trabajo; no se reconoce un activo fiscal por pérdidas. Los importes se convierten a moneda de reporte usando el tipo indicado. NPV descuenta los flujos libres y el valor terminal por perpetuidad: TV = FCF del año siguiente / (tasa de descuento − crecimiento terminal), incluido el incremento terminal de capital de trabajo. ROI usa flujo libre acumulado sin valor terminal.",
  };
}

const scenarioDefinition: { key: SensitivityScenarioKey; label: string; note: string }[] = [
  { key: "base", label: "Base", note: "Caso sin variaciones respecto a los supuestos financieros de referencia." },
  { key: "optimistic", label: "Optimista", note: "Caso hipotético: aplica las mejoras explícitas de precio/ingreso, margen y divisa." },
  { key: "conservative", label: "Conservador", note: "Caso hipotético: aplica las variaciones adversas explícitas de precio/ingreso, margen y divisa." },
];

function scenarioStatus(financial: FinancialCaseResult): FinancialScenarioResult["status"] {
  if (financial.status === "insufficient_data") return "insufficient_data";
  if (financial.alternatives.some((alternative) => alternative.status === "ok")) return "ok";
  if (financial.alternatives.some((alternative) => alternative.status === "not_meaningful")) return "not_meaningful";
  return "insufficient_data";
}

function evaluateSensitivityScenario(
  definition: { key: SensitivityScenarioKey; label: string; note: string },
  assumptions: FinancialAssumptions | undefined,
  modeOptions: ModeForFinance[],
  horizonYears: number,
): FinancialScenarioResult {
  const provided = assumptions ?? {};
  const adjustment = definition.key === "base" ? {} : (provided.sensitivityScenarios?.[definition.key] ?? {});
  const priceRevenuePct = definition.key === "base" ? 0 : asNumber(adjustment.priceRevenuePct);
  const operatingMarginPctPoints = definition.key === "base" ? 0 : asNumber(adjustment.operatingMarginPctPoints);
  const fxRatePct = definition.key === "base" ? 0 : asNumber(adjustment.fxRatePct);
  const missingInputs: string[] = [];
  if (priceRevenuePct === null) missingInputs.push("variación de precio/ingreso");
  if (operatingMarginPctPoints === null) missingInputs.push("variación de margen operativo");
  if (fxRatePct === null) missingInputs.push("variación del tipo de cambio");
  if (missingInputs.length) {
    return { key: definition.key, label: definition.label, priceRevenuePct, operatingMarginPctPoints, fxRatePct, status: "insufficient_data", financial: null, missingInputs, note: `${definition.note} Complete las tres sensibilidades para calcular este escenario.` };
  }
  const currencies = resolveCurrencies(provided);
  const baseMargin = asNumber(provided.operatingMarginPct);
  const baseFx = currencies.fxRate;
  const scenarioMargin = baseMargin === null ? null : baseMargin + operatingMarginPctPoints!;
  const scenarioFx = baseFx === null ? null : (currencies.fxRequired ? baseFx * (1 + fxRatePct! / 100) : baseFx);
  if (scenarioMargin !== null && (scenarioMargin < -100 || scenarioMargin > 100)) {
    return { key: definition.key, label: definition.label, priceRevenuePct, operatingMarginPctPoints, fxRatePct, status: "not_meaningful", financial: null, missingInputs: ["El margen operativo resultante debe permanecer entre −100% y 100%."], note: definition.note };
  }
  if (scenarioFx !== null && scenarioFx <= 0) {
    return { key: definition.key, label: definition.label, priceRevenuePct, operatingMarginPctPoints, fxRatePct, status: "not_meaningful", financial: null, missingInputs: ["El tipo de cambio resultante debe ser positivo."], note: definition.note };
  }
  const financial = evaluateFinancialCase(
    { ...provided, operatingMarginPct: scenarioMargin, fxRateToReportingCurrency: scenarioFx },
    modeOptions,
    horizonYears,
    1 + priceRevenuePct! / 100,
  );
  const noFxNote = !currencies.fxRequired && fxRatePct !== 0 ? " La sensibilidad FX no altera el resultado porque la moneda local y de reporte coinciden." : "";
  return { key: definition.key, label: definition.label, priceRevenuePct, operatingMarginPctPoints, fxRatePct, status: scenarioStatus(financial), financial, missingInputs: financial.missingInputs, note: `${definition.note}${noFxNote}` };
}

export function evaluateFinancials(
  assumptions: FinancialAssumptions | undefined,
  modeOptions: ModeForFinance[],
  horizonYears: number,
): FinancialResult {
  const baseCase = evaluateFinancialCase(assumptions, modeOptions, horizonYears);
  const scenarios = scenarioDefinition.map((definition) => evaluateSensitivityScenario(definition, assumptions, modeOptions, horizonYears));
  return { ...baseCase, scenarios };
}

export function recommendInvestmentAction(
  financial: FinancialResult,
  riskAdjusted: number,
  confidence: number,
  thresholds?: InvestmentThresholds,
): InvestmentRecommendation {
  const policy: InvestmentThresholds = { ...defaultInvestmentThresholds, ...thresholds };
  const validAlternatives = financial.alternatives.filter((alternative) => alternative.status === "ok" && alternative.npv !== null);
  const selected = validAlternatives.sort((a, b) => (b.npv ?? -Infinity) - (a.npv ?? -Infinity) || (b.roiPct ?? -Infinity) - (a.roiPct ?? -Infinity))[0] ?? null;
  const base = {
    selectedMode: selected?.mode ?? null,
    selectedModeKey: selected?.key ?? null,
    evaluatedMetrics: {
      riskAdjusted,
      confidence,
      roiPct: selected?.roiPct ?? null,
      npv: selected?.npv ?? null,
      paybackYear: selected?.paybackYear ?? null,
      initialInvestment: selected?.initialInvestment ?? null,
      currency: financial.reportingCurrency,
    },
    thresholds: policy,
  };

  const missing: string[] = [];
  if (financial.status !== "ok") missing.push(...financial.missingInputs);
  if (!selected) missing.push("una alternativa de entrada con flujo de caja completo y valor terminal válido");
  const policyCurrency = policy.currency?.trim().toUpperCase();
  if (policyCurrency && financial.reportingCurrency && policyCurrency !== financial.reportingCurrency) missing.push(`la moneda de umbrales (${policyCurrency}) debe coincidir con la moneda de reporte (${financial.reportingCurrency})`);
  if (missing.length) {
    return { ...base, action: "insufficient_data", label: "Completar evidencia", summary: "No se emite una decisión de inversión porque faltan datos financieros o existe una inconsistencia de moneda.", reasons: missing };
  }

  const metrics = base.evaluatedMetrics;
  const investmentLimitPass = policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined || (metrics.initialInvestment ?? Infinity) <= policy.testMaxInitialInvestment;
  const advancePasses = [
    { pass: riskAdjusted >= (policy.advanceMinRiskAdjusted ?? 65), reason: `Puntuación ajustada por riesgo ${riskAdjusted}/100 frente al mínimo de avanzar ${policy.advanceMinRiskAdjusted}/100.` },
    { pass: confidence >= (policy.minConfidence ?? 60), reason: `Confianza de evidencia ${confidence}% frente al mínimo ${policy.minConfidence}%.` },
    { pass: (metrics.npv ?? -Infinity) >= (policy.advanceMinNpv ?? 0), reason: `NPV ${metrics.npv} frente al mínimo de avanzar ${policy.advanceMinNpv}.` },
    { pass: (metrics.roiPct ?? -Infinity) >= (policy.advanceMinRoiPct ?? 20), reason: `ROI ${metrics.roiPct}% frente al mínimo de avanzar ${policy.advanceMinRoiPct}%.` },
    { pass: metrics.paybackYear !== null && metrics.paybackYear <= (policy.advanceMaxPaybackYears ?? 5), reason: `Recuperación ${metrics.paybackYear === null ? "no alcanzada" : `año ${metrics.paybackYear}`} frente al máximo de avanzar año ${policy.advanceMaxPaybackYears}.` },
    { pass: investmentLimitPass, reason: policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined ? "No hay límite de inversión para prueba." : `Inversión inicial ${metrics.initialInvestment} frente al límite ${policy.testMaxInitialInvestment}.` },
  ];
  if (advancePasses.every((criterion) => criterion.pass)) {
    return { ...base, action: "advance", label: "Avanzar", summary: `La alternativa ${selected!.mode} supera todos los umbrales de inversión definidos. Pase a debida diligencia y a aprobación de capital.`, reasons: advancePasses.map((criterion) => criterion.reason) };
  }

  const testPasses = [
    { pass: riskAdjusted >= (policy.testMinRiskAdjusted ?? 50), reason: `Puntuación ajustada por riesgo ${riskAdjusted}/100 frente al mínimo de prueba ${policy.testMinRiskAdjusted}/100.` },
    { pass: confidence >= (policy.minConfidence ?? 60), reason: `Confianza de evidencia ${confidence}% frente al mínimo ${policy.minConfidence}%.` },
    { pass: (metrics.npv ?? -Infinity) >= (policy.testMinNpv ?? 0), reason: `NPV ${metrics.npv} frente al mínimo de prueba ${policy.testMinNpv}.` },
    { pass: (metrics.roiPct ?? -Infinity) >= (policy.testMinRoiPct ?? 0), reason: `ROI ${metrics.roiPct}% frente al mínimo de prueba ${policy.testMinRoiPct}%.` },
    { pass: investmentLimitPass, reason: policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined ? "No hay límite de inversión para prueba." : `Inversión inicial ${metrics.initialInvestment} frente al límite ${policy.testMaxInitialInvestment}.` },
  ];
  if (testPasses.every((criterion) => criterion.pass)) {
    return { ...base, action: "test", label: "Probar", summary: `La alternativa ${selected!.mode} cumple el umbral de prueba, pero no todos los criterios de avance. Diseñe una entrada reversible con hitos de aprendizaje.`, reasons: testPasses.map((criterion) => criterion.reason) };
  }

  const failed = testPasses.filter((criterion) => !criterion.pass).map((criterion) => criterion.reason);
  return { ...base, action: "discard", label: "Descartar", summary: "La evidencia disponible no supera el umbral mínimo de prueba. No asigne inversión material; reabra el mercado únicamente si cambian los datos o supuestos clave.", reasons: failed };
}
