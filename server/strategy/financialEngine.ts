import { entryMode, type EconomicModel, type EntryModeKey } from "@shared/domain/entryModes";

export type { EntryModeKey, EconomicModel };

export type ModeFinancialProfile = {
  initialInvestment?: number | null;
  annualOperatingCost?: number | null;
  revenueCapturePct?: number | null;
  /**
   * Sobrescribe el modelo económico por defecto del modo. Solo para casos atípicos:
   * una franquicia que opera sus propias unidades, por ejemplo.
   */
  economicModel?: EconomicModel | null;
  /** Modelo royalty: porcentaje sobre las ventas del licenciatario. */
  royaltyRatePct?: number | null;
  /** Modelo royalty: pago inicial único, en moneda local. */
  upfrontFee?: number | null;
  /** Modelo royalty: margen sobre componentes o producto intermedio vendido al licenciatario. */
  componentMarginPct?: number | null;
  /** Modelo canal: margen que retiene la empresa sobre las ventas que pasan por el distribuidor. */
  channelMarginPct?: number | null;
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
  /**
   * Forma de la rampa de cuota entre el año 1 y el horizonte.
   * `linear` reproduce el comportamiento anterior. `s_curve` refleja las curvas de
   * penetración del capítulo 6 (Figs. 6.4-6.5, p. 230), donde la adopción arranca
   * despacio, acelera y se satura. `manual` usa `somPctByYear`.
   */
  somRampShape?: "linear" | "s_curve" | "manual" | null;
  /** Cuota por año cuando `somRampShape` es `manual`. Un hueco invalida el cálculo. */
  somPctByYear?: (number | null)[] | null;
  operatingMarginPct?: number | null;
  taxRatePct?: number | null;
  /**
   * Reconoce el arrastre de bases imponibles negativas. Por defecto activo: una entrada
   * greenfield con pérdidas iniciales no paga impuestos hasta compensarlas.
   */
  taxLossCarryforward?: boolean | null;
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

export type RoiBasis = "operating_horizon" | "including_terminal";

export type InvestmentThresholds = {
  /** Leave blank to use the reporting currency of each country. */
  currency?: string | null;
  /**
   * Base del ROI que se compara con los umbrales.
   * `operating_horizon`: flujo libre acumulado del horizonte, sin valor terminal.
   * `including_terminal`: valor presente de todos los flujos, incluido el terminal.
   * El NPV siempre incluye el valor terminal; declarar la base evita comparar
   * dos magnitudes distintas contra dos umbrales.
   */
  roiBasis?: RoiBasis | null;
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
  roiBasis: "operating_horizon",
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
  /** Base imponible tras aplicar el arrastre de pérdidas disponible. */
  taxableProfit: number;
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
  /** Modelo económico aplicado: operador, royalty, canal o solo coste. */
  economicModel: EconomicModel;
  roiPct: number | null;
  /** ROI incluyendo el valor presente del valor terminal. Base alternativa de umbral. */
  roiIncludingTerminalPct: number | null;
  /** Valor presente de todas las entradas dividido por la inversión inicial. */
  valueMultiple: number | null;
  npv: number | null;
  /** Año de recuperación con interpolación dentro del año en que se cruza el cero. */
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

export type TornadoLeverKey =
  | "priceRevenue"
  | "somCapture"
  | "operatingMargin"
  | "initialInvestment"
  | "annualOperatingCost"
  | "discountRate"
  | "fxRate"
  | "taxRate";

export type TornadoEntry = {
  key: TornadoLeverKey;
  label: string;
  deltaPct: number;
  lowNpv: number | null;
  highNpv: number | null;
  /** Amplitud del NPV entre el extremo bajo y el alto. Ordena la sensibilidad. */
  swing: number | null;
};

export type FinancialResult = FinancialCaseResult & {
  scenarios: FinancialScenarioResult[];
  /**
   * Sensibilidad de una palanca cada vez sobre la alternativa con mejor NPV.
   * Los tres escenarios fijos mueven precio, margen y divisa a la vez y no permiten
   * saber cuál de ellos manda; el tornado sí.
   */
  tornado: { modeKey: EntryModeKey | null; mode: string | null; baseNpv: number | null; deltaPct: number; levers: TornadoEntry[] };
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

/**
 * Progreso de la rampa de cuota entre el año 1 (0) y el horizonte (1).
 * La curva en S es una logística normalizada para que respete exactamente ambos extremos.
 */
function rampProgress(index: number, horizonYears: number, shape: FinancialAssumptions["somRampShape"]) {
  if (horizonYears <= 1) return 1;
  const t = index / (horizonYears - 1);
  if (shape !== "s_curve") return t;
  const k = 6;
  const logistic = (x: number) => 1 / (1 + Math.exp(-k * (x - 0.5)));
  const low = logistic(0);
  const high = logistic(1);
  return (logistic(t) - low) / (high - low);
}

function somPctForYear(
  index: number,
  horizonYears: number,
  assumptions: FinancialAssumptions,
  somYearOne: number,
  somHorizon: number,
) {
  if (assumptions.somRampShape === "manual") {
    const value = asNumber(assumptions.somPctByYear?.[index]);
    return value;
  }
  return somYearOne + (somHorizon - somYearOne) * rampProgress(index, horizonYears, assumptions.somRampShape);
}

function calculateMarket(assumptions: FinancialAssumptions, horizonYears: number) {
  const tamYearOne = asNumber(assumptions.tamYearOne);
  const growth = asNumber(assumptions.annualMarketGrowthPct);
  const samPct = asNumber(assumptions.samPct);
  const somYearOne = asNumber(assumptions.somPctYearOne);
  const somHorizon = asNumber(assumptions.somPctHorizon);
  if ([tamYearOne, growth, samPct, somYearOne, somHorizon].some((value) => value === null)) return null;
  if (assumptions.somRampShape === "manual") {
    const provided = assumptions.somPctByYear ?? [];
    const complete = Array.from({ length: horizonYears }, (_, index) => asNumber(provided[index]) !== null).every(Boolean);
    if (!complete) return null;
  }

  const tamAtHorizon = tamYearOne! * Math.pow(1 + growth! / 100, Math.max(0, horizonYears - 1));
  const samAtHorizon = tamAtHorizon * (samPct! / 100);
  const samYearOne = tamYearOne! * (samPct! / 100);
  return {
    tamYearOne: round(tamYearOne!),
    tamAtHorizon: round(tamAtHorizon),
    samAtHorizon: round(samAtHorizon),
    somRevenueYearOne: round(samYearOne * ((somPctForYear(0, horizonYears, assumptions, somYearOne!, somHorizon!) ?? somYearOne!) / 100)),
    somRevenueAtHorizon: round(samAtHorizon * ((somPctForYear(horizonYears - 1, horizonYears, assumptions, somYearOne!, somHorizon!) ?? somHorizon!) / 100)),
    annualRevenue: Array.from({ length: horizonYears }, (_, index) => {
      const tam = tamYearOne! * Math.pow(1 + growth! / 100, index);
      const sam = tam * (samPct! / 100);
      const somPct = somPctForYear(index, horizonYears, assumptions, somYearOne!, somHorizon!) ?? 0;
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

function resolveEconomicModel(mode: ModeForFinance, profile: ModeFinancialProfile): EconomicModel {
  if (profile.economicModel) return profile.economicModel;
  try {
    return entryMode(mode.key).economicModel;
  } catch {
    return "operator";
  }
}

function calculateMode(
  assumptions: FinancialAssumptions,
  market: NonNullable<ReturnType<typeof calculateMarket>> | null,
  horizonYears: number,
  mode: ModeForFinance,
  revenueMultiplier = 1,
): FinancialModeResult {
  const profile = assumptions.modeProfiles?.[mode.key] ?? {};
  const economicModel = resolveEconomicModel(mode, profile);
  const isOperator = economicModel === "operator";
  const isRoyalty = economicModel === "royalty";
  const isChannel = economicModel === "channel";
  const isCostOnly = economicModel === "cost_only";

  const investment = asNumber(profile.initialInvestment);
  const annualCost = asNumber(profile.annualOperatingCost);
  const capture = asNumber(profile.revenueCapturePct);
  const royaltyRate = asNumber(profile.royaltyRatePct);
  const componentMargin = asNumber(profile.componentMarginPct) ?? 0;
  const upfrontFee = asNumber(profile.upfrontFee) ?? 0;
  const channelMargin = asNumber(profile.channelMarginPct);
  const margin = asNumber(assumptions.operatingMarginPct);
  const taxRate = asNumber(assumptions.taxRatePct);
  const workingCapitalPctRevenue = asNumber(assumptions.workingCapitalPctRevenue);
  const discount = asNumber(assumptions.discountRatePct);
  const terminalGrowth = asNumber(assumptions.terminalGrowthPct);
  const carryforwardEnabled = assumptions.taxLossCarryforward !== false;
  const { fxRate } = resolveCurrencies(assumptions);

  /**
   * Cada modelo económico exige inputs distintos. Una licencia no tiene margen operativo
   * sobre las ventas del mercado ni capital de trabajo propio; una oficina de representación
   * no tiene ingresos. Pedir los mismos once campos a los siete modos era la razón por la que
   * todos ellos producían el mismo flujo de caja con distinta escala.
   */
  const missing = [
    ...(isCostOnly || market ? [] : ["variables de mercado TAM/SAM/SOM"]),
    ...(investment === null ? ["inversión inicial"] : []),
    ...(annualCost === null ? ["coste operativo anual"] : []),
    ...(!isCostOnly && capture === null ? ["captura de ingresos"] : []),
    ...(isOperator && margin === null ? ["margen operativo"] : []),
    ...(isRoyalty && royaltyRate === null ? ["tasa de royalty"] : []),
    ...(isChannel && channelMargin === null ? ["margen de canal"] : []),
    ...(taxRate === null ? ["tasa fiscal"] : []),
    ...((isOperator || isChannel) && workingCapitalPctRevenue === null ? ["capital de trabajo"] : []),
    ...(discount === null ? ["tasa de descuento"] : []),
    ...(!isCostOnly && terminalGrowth === null ? ["crecimiento terminal"] : []),
    ...(fxRate === null || fxRate <= 0 ? ["tipo de cambio"] : []),
  ];
  const blank = (status: FinancialModeResult["status"], issues: string[]): FinancialModeResult => ({
    key: mode.key, mode: mode.mode, status, economicModel, roiPct: null, roiIncludingTerminalPct: null, valueMultiple: null,
    npv: null, paybackYear: null, cumulativeOperatingProfit: null,
    cumulativeFreeCashFlow: null, initialInvestment: investment === null || fxRate === null ? investment : round(investment * fxRate),
    annualOperatingCost: annualCost === null || fxRate === null ? annualCost : round(annualCost * fxRate), revenueCapturePct: capture,
    terminalValue: null, presentValueTerminal: null, annualProjection: [], missingInputs: issues,
  });
  if (missing.length) return blank("insufficient_data", missing);
  // Un modelo de operador sin inversión no permite hablar de retorno sobre inversión.
  if (isOperator && investment! <= 0) return blank("not_meaningful", ["La inversión inicial debe ser positiva para calcular ROI y recuperación."]);
  if (!isCostOnly && discount! <= terminalGrowth!) return blank("not_meaningful", ["La tasa de descuento debe superar el crecimiento terminal para calcular el valor terminal por perpetuidad."]);

  const investmentReporting = investment! * fxRate!;
  const annualCostReporting = annualCost! * fxRate!;
  const workingCapitalRate = isOperator || isChannel ? workingCapitalPctRevenue! / 100 : 0;

  /** Ingreso que retiene la empresa en cada modelo, a partir de las ventas del mercado. */
  const incomeFor = (localSomRevenue: number, year: number) => {
    if (isCostOnly) return 0;
    const marketSales = localSomRevenue * (capture! / 100) * fxRate! * revenueMultiplier;
    if (isRoyalty) {
      const recurring = marketSales * ((royaltyRate! + componentMargin) / 100);
      return recurring + (year === 1 ? upfrontFee * fxRate! : 0);
    }
    if (isChannel) return marketSales * (channelMargin! / 100);
    return marketSales;
  };

  /** El margen operativo solo aplica al modelo de operador; royalty y canal ya llegan netos. */
  const operatingProfitFor = (income: number) => (isOperator ? income * (margin! / 100) : income) - annualCostReporting;

  let priorWorkingCapital = 0;
  let cumulativeCash = -investmentReporting;
  let cumulativeOperatingProfit = 0;
  let cumulativeFreeCashFlow = 0;
  let npv = -investmentReporting;
  let paybackYear: number | null = null;
  let lossCarryforward = 0;

  const revenueSeries = isCostOnly
    ? Array.from({ length: horizonYears }, () => 0)
    : market!.annualRevenue;

  const annualProjection = revenueSeries.map((localSomRevenue, index) => {
    const revenue = incomeFor(localSomRevenue, index + 1);
    const operatingProfit = operatingProfitFor(revenue);
    // Escudo fiscal: las pérdidas de los primeros años compensan bases positivas posteriores.
    const taxableProfit = carryforwardEnabled
      ? Math.max(0, operatingProfit - lossCarryforward)
      : Math.max(0, operatingProfit);
    if (carryforwardEnabled) {
      lossCarryforward = operatingProfit >= 0
        ? Math.max(0, lossCarryforward - operatingProfit)
        : lossCarryforward + Math.abs(operatingProfit);
    }
    const taxes = taxableProfit * (taxRate! / 100);
    const workingCapitalBalance = revenue * workingCapitalRate;
    const changeInWorkingCapital = workingCapitalBalance - priorWorkingCapital;
    priorWorkingCapital = workingCapitalBalance;
    const freeCashFlow = operatingProfit - taxes - changeInWorkingCapital;
    const discountFactor = 1 / Math.pow(1 + discount! / 100, index + 1);
    const presentValue = freeCashFlow * discountFactor;
    const openingCash = cumulativeCash;
    cumulativeOperatingProfit += operatingProfit;
    cumulativeFreeCashFlow += freeCashFlow;
    cumulativeCash += freeCashFlow;
    npv += presentValue;
    // Recuperación interpolada dentro del año en que el acumulado cruza cero.
    if (paybackYear === null && cumulativeCash >= 0) {
      const fraction = freeCashFlow > 0 ? Math.min(1, Math.max(0, -openingCash / freeCashFlow)) : 1;
      paybackYear = round(index + fraction);
    }
    return {
      year: index + 1,
      revenue: round(revenue),
      operatingProfit: round(operatingProfit),
      taxableProfit: round(taxableProfit),
      taxes: round(taxes),
      changeInWorkingCapital: round(changeInWorkingCapital),
      freeCashFlow: round(freeCashFlow),
      discountFactor: round(discountFactor),
      presentValue: round(presentValue),
    };
  });

  let terminalValue: number | null = null;
  let presentValueTerminal: number | null = null;
  if (!isCostOnly) {
    const finalRevenue = annualProjection.at(-1)?.revenue ?? 0;
    // El pago inicial de una licencia no se perpetúa: el valor terminal solo recoge el flujo recurrente.
    const recurringFinalRevenue = isRoyalty && horizonYears === 1 ? finalRevenue - upfrontFee * fxRate! : finalRevenue;
    const terminalRevenue = recurringFinalRevenue * (1 + terminalGrowth! / 100);
    const terminalOperatingProfit = operatingProfitFor(terminalRevenue);
    const terminalTaxable = carryforwardEnabled
      ? Math.max(0, terminalOperatingProfit - lossCarryforward)
      : Math.max(0, terminalOperatingProfit);
    const terminalTaxes = terminalTaxable * (taxRate! / 100);
    const terminalWorkingCapitalChange = (terminalRevenue - recurringFinalRevenue) * workingCapitalRate;
    const terminalFcf = terminalOperatingProfit - terminalTaxes - terminalWorkingCapitalChange;
    terminalValue = terminalFcf / (discount! / 100 - terminalGrowth! / 100);
    presentValueTerminal = terminalValue / Math.pow(1 + discount! / 100, horizonYears);
    npv += presentValueTerminal;
  }

  const hasInvestment = investmentReporting > 0;
  const valueMultiple = hasInvestment ? (npv + investmentReporting) / investmentReporting : null;

  return {
    key: mode.key,
    mode: mode.mode,
    status: "ok",
    economicModel,
    roiPct: hasInvestment ? round(((cumulativeFreeCashFlow - investmentReporting) / investmentReporting) * 100) : null,
    roiIncludingTerminalPct: valueMultiple === null ? null : round((valueMultiple - 1) * 100),
    valueMultiple: valueMultiple === null ? null : round(valueMultiple),
    npv: round(npv),
    paybackYear,
    cumulativeOperatingProfit: round(cumulativeOperatingProfit),
    cumulativeFreeCashFlow: round(cumulativeFreeCashFlow),
    initialInvestment: round(investmentReporting),
    annualOperatingCost: round(annualCostReporting),
    revenueCapturePct: capture,
    terminalValue: terminalValue === null ? null : round(terminalValue),
    presentValueTerminal: presentValueTerminal === null ? null : round(presentValueTerminal),
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
    methodology: "TAM y SAM se proyectan con el crecimiento anual indicado; el SOM sigue la rampa elegida entre año 1 y horizonte (lineal, curva en S o definida año a año). Cada modo usa su propio modelo económico: operador (margen sobre las ventas capturadas), royalty (pago inicial más porcentaje sobre las ventas del licenciatario y margen en componentes, sin capital de trabajo), canal (margen del distribuidor) y solo coste (oficina de representación, sin ingresos ni valor terminal). Los flujos libres se calculan como EBIT menos impuestos menos el incremento de capital de trabajo, reconociendo el arrastre de bases imponibles negativas salvo que se desactive. Los importes se convierten a moneda de reporte usando el tipo indicado. NPV descuenta los flujos libres y el valor terminal por perpetuidad: TV = FCF del año siguiente / (tasa de descuento − crecimiento terminal), incluido el incremento terminal de capital de trabajo. Se publican dos bases de retorno: ROI sobre flujo libre acumulado del horizonte, sin valor terminal, y ROI incluyendo el valor presente del valor terminal; la política de umbrales declara cuál usa. La recuperación se interpola dentro del año en que el flujo acumulado cruza cero.",
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

const tornadoLevers: {
  key: TornadoLeverKey;
  label: string;
  /** Devuelve los supuestos y el multiplicador de ingreso para un factor dado (1 ± delta). */
  apply: (assumptions: FinancialAssumptions, factor: number, modeKey: EntryModeKey) => { assumptions: FinancialAssumptions; revenueMultiplier: number } | null;
}[] = [
  {
    key: "priceRevenue",
    label: "Precio / ingreso realizado",
    apply: (assumptions, factor) => ({ assumptions, revenueMultiplier: factor }),
  },
  {
    key: "somCapture",
    label: "Cuota alcanzada (SOM)",
    apply: (assumptions, factor) => ({
      assumptions: {
        ...assumptions,
        somPctYearOne: asNumber(assumptions.somPctYearOne) === null ? assumptions.somPctYearOne : assumptions.somPctYearOne! * factor,
        somPctHorizon: asNumber(assumptions.somPctHorizon) === null ? assumptions.somPctHorizon : assumptions.somPctHorizon! * factor,
        somPctByYear: assumptions.somPctByYear?.map((value) => (asNumber(value) === null ? value : value! * factor)) ?? assumptions.somPctByYear,
      },
      revenueMultiplier: 1,
    }),
  },
  {
    key: "operatingMargin",
    label: "Margen operativo",
    apply: (assumptions, factor) => {
      const margin = asNumber(assumptions.operatingMarginPct);
      if (margin === null) return null;
      return { assumptions: { ...assumptions, operatingMarginPct: Math.max(-100, Math.min(100, margin * factor)) }, revenueMultiplier: 1 };
    },
  },
  {
    key: "initialInvestment",
    label: "Inversión inicial",
    apply: (assumptions, factor, modeKey) => {
      const profile = assumptions.modeProfiles?.[modeKey];
      const investment = asNumber(profile?.initialInvestment);
      if (!profile || investment === null) return null;
      return {
        assumptions: { ...assumptions, modeProfiles: { ...assumptions.modeProfiles, [modeKey]: { ...profile, initialInvestment: investment * factor } } },
        revenueMultiplier: 1,
      };
    },
  },
  {
    key: "annualOperatingCost",
    label: "Coste operativo anual",
    apply: (assumptions, factor, modeKey) => {
      const profile = assumptions.modeProfiles?.[modeKey];
      const cost = asNumber(profile?.annualOperatingCost);
      if (!profile || cost === null) return null;
      return {
        assumptions: { ...assumptions, modeProfiles: { ...assumptions.modeProfiles, [modeKey]: { ...profile, annualOperatingCost: cost * factor } } },
        revenueMultiplier: 1,
      };
    },
  },
  {
    key: "discountRate",
    label: "Tasa de descuento",
    apply: (assumptions, factor) => {
      const discount = asNumber(assumptions.discountRatePct);
      const terminalGrowth = asNumber(assumptions.terminalGrowthPct);
      if (discount === null) return null;
      const adjusted = discount * factor;
      // Un descuento por debajo del crecimiento terminal rompe la perpetuidad: se descarta la palanca.
      if (terminalGrowth !== null && adjusted <= terminalGrowth) return null;
      return { assumptions: { ...assumptions, discountRatePct: adjusted }, revenueMultiplier: 1 };
    },
  },
  {
    key: "fxRate",
    label: "Tipo de cambio",
    apply: (assumptions, factor) => {
      const currencies = resolveCurrencies(assumptions);
      if (!currencies.fxRequired || currencies.fxRate === null) return null;
      return { assumptions: { ...assumptions, fxRateToReportingCurrency: currencies.fxRate * factor }, revenueMultiplier: 1 };
    },
  },
  {
    key: "taxRate",
    label: "Tasa fiscal",
    apply: (assumptions, factor) => {
      const taxRate = asNumber(assumptions.taxRatePct);
      if (taxRate === null) return null;
      return { assumptions: { ...assumptions, taxRatePct: Math.max(0, Math.min(100, taxRate * factor)) }, revenueMultiplier: 1 };
    },
  },
];

function buildTornado(
  assumptions: FinancialAssumptions | undefined,
  baseCase: FinancialCaseResult,
  horizonYears: number,
  deltaPct: number,
): FinancialResult["tornado"] {
  const provided = assumptions ?? {};
  const selected = baseCase.alternatives
    .filter((alternative) => alternative.status === "ok" && alternative.npv !== null && alternative.economicModel !== "cost_only")
    .sort((a, b) => (b.npv ?? -Infinity) - (a.npv ?? -Infinity))[0];
  if (!selected) return { modeKey: null, mode: null, baseNpv: null, deltaPct, levers: [] };

  const modeOption: ModeForFinance = { key: selected.key, mode: selected.mode };
  const npvFor = (factor: number, lever: (typeof tornadoLevers)[number]) => {
    const variant = lever.apply(provided, factor, selected.key);
    if (!variant) return null;
    const result = evaluateFinancialCase(variant.assumptions, [modeOption], horizonYears, variant.revenueMultiplier);
    const alternative = result.alternatives[0];
    return alternative?.status === "ok" ? alternative.npv : null;
  };

  const levers = tornadoLevers
    .map((lever): TornadoEntry | null => {
      const down = npvFor(1 - deltaPct / 100, lever);
      const up = npvFor(1 + deltaPct / 100, lever);
      if (down === null || up === null) return null;
      const lowNpv = Math.min(down, up);
      const highNpv = Math.max(down, up);
      return { key: lever.key, label: lever.label, deltaPct, lowNpv: round(lowNpv), highNpv: round(highNpv), swing: round(highNpv - lowNpv) };
    })
    .filter((entry): entry is TornadoEntry => entry !== null)
    .sort((a, b) => (b.swing ?? 0) - (a.swing ?? 0));

  return { modeKey: selected.key, mode: selected.mode, baseNpv: selected.npv, deltaPct, levers };
}

export function evaluateFinancials(
  assumptions: FinancialAssumptions | undefined,
  modeOptions: ModeForFinance[],
  horizonYears: number,
  options?: { tornadoDeltaPct?: number },
): FinancialResult {
  const baseCase = evaluateFinancialCase(assumptions, modeOptions, horizonYears);
  const scenarios = scenarioDefinition.map((definition) => evaluateSensitivityScenario(definition, assumptions, modeOptions, horizonYears));
  const deltaPct = options?.tornadoDeltaPct && options.tornadoDeltaPct > 0 ? options.tornadoDeltaPct : 10;
  const tornado = buildTornado(assumptions, baseCase, horizonYears, deltaPct);
  return { ...baseCase, scenarios, tornado };
}

export function recommendInvestmentAction(
  financial: FinancialResult,
  riskAdjusted: number,
  confidence: number,
  thresholds?: InvestmentThresholds,
): InvestmentRecommendation {
  const policy: InvestmentThresholds = { ...defaultInvestmentThresholds, ...thresholds };
  const roiBasis: RoiBasis = policy.roiBasis ?? "operating_horizon";
  const roiBasisLabel = roiBasis === "including_terminal" ? "ROI incluyendo valor terminal" : "ROI sobre flujo del horizonte";
  const roiOf = (alternative: FinancialModeResult | null) =>
    alternative === null ? null : roiBasis === "including_terminal" ? alternative.roiIncludingTerminalPct : alternative.roiPct;
  // La oficina de representación no compite por NPV: su valor es la opción que abre, no su flujo.
  const validAlternatives = financial.alternatives.filter(
    (alternative) => alternative.status === "ok" && alternative.npv !== null && alternative.economicModel !== "cost_only",
  );
  const selected = validAlternatives.sort((a, b) => (b.npv ?? -Infinity) - (a.npv ?? -Infinity) || ((roiOf(b) ?? -Infinity) - (roiOf(a) ?? -Infinity)))[0] ?? null;
  const base = {
    selectedMode: selected?.mode ?? null,
    selectedModeKey: selected?.key ?? null,
    evaluatedMetrics: {
      riskAdjusted,
      confidence,
      roiPct: roiOf(selected),
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
  /**
   * Una cobertura de evidencia insuficiente no es un veredicto económico negativo: es la
   * ausencia de base para emitir veredicto. Antes degradaba a «Descartar», lo que hacía
   * indistinguible un mercado malo de un mercado sin documentar.
   */
  const minConfidence = policy.minConfidence ?? 60;
  if (confidence < minConfidence) {
    missing.push(`cobertura de evidencia ${confidence}% frente al mínimo exigido ${minConfidence}%: documente los juicios cualitativos y complete los indicadores públicos antes de decidir`);
  }
  if (missing.length) {
    return { ...base, action: "insufficient_data", label: "Completar evidencia", summary: "No se emite una decisión de inversión porque falta evidencia, faltan datos financieros o existe una inconsistencia de moneda.", reasons: missing };
  }

  const metrics = base.evaluatedMetrics;
  const investmentLimitPass = policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined || (metrics.initialInvestment ?? Infinity) <= policy.testMaxInitialInvestment;
  const advancePasses = [
    { pass: riskAdjusted >= (policy.advanceMinRiskAdjusted ?? 65), reason: `Puntuación ajustada por riesgo ${riskAdjusted}/100 frente al mínimo de avanzar ${policy.advanceMinRiskAdjusted}/100.` },
    { pass: confidence >= minConfidence, reason: `Cobertura de evidencia ${confidence}% frente al mínimo ${minConfidence}%.` },
    { pass: (metrics.npv ?? -Infinity) >= (policy.advanceMinNpv ?? 0), reason: `NPV ${metrics.npv} frente al mínimo de avanzar ${policy.advanceMinNpv}.` },
    { pass: (metrics.roiPct ?? -Infinity) >= (policy.advanceMinRoiPct ?? 20), reason: `${roiBasisLabel} ${metrics.roiPct}% frente al mínimo de avanzar ${policy.advanceMinRoiPct}%.` },
    { pass: metrics.paybackYear !== null && metrics.paybackYear <= (policy.advanceMaxPaybackYears ?? 5), reason: `Recuperación ${metrics.paybackYear === null ? "no alcanzada" : `año ${metrics.paybackYear}`} frente al máximo de avanzar año ${policy.advanceMaxPaybackYears}.` },
    { pass: investmentLimitPass, reason: policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined ? "No hay límite de inversión para prueba." : `Inversión inicial ${metrics.initialInvestment} frente al límite ${policy.testMaxInitialInvestment}.` },
  ];
  if (advancePasses.every((criterion) => criterion.pass)) {
    return { ...base, action: "advance", label: "Avanzar", summary: `La alternativa ${selected!.mode} supera todos los umbrales de inversión definidos. Pase a debida diligencia y a aprobación de capital.`, reasons: advancePasses.map((criterion) => criterion.reason) };
  }

  const testPasses = [
    { pass: riskAdjusted >= (policy.testMinRiskAdjusted ?? 50), reason: `Puntuación ajustada por riesgo ${riskAdjusted}/100 frente al mínimo de prueba ${policy.testMinRiskAdjusted}/100.` },
    { pass: confidence >= minConfidence, reason: `Cobertura de evidencia ${confidence}% frente al mínimo ${minConfidence}%.` },
    { pass: (metrics.npv ?? -Infinity) >= (policy.testMinNpv ?? 0), reason: `NPV ${metrics.npv} frente al mínimo de prueba ${policy.testMinNpv}.` },
    { pass: (metrics.roiPct ?? -Infinity) >= (policy.testMinRoiPct ?? 0), reason: `${roiBasisLabel} ${metrics.roiPct}% frente al mínimo de prueba ${policy.testMinRoiPct}%.` },
    { pass: investmentLimitPass, reason: policy.testMaxInitialInvestment === null || policy.testMaxInitialInvestment === undefined ? "No hay límite de inversión para prueba." : `Inversión inicial ${metrics.initialInvestment} frente al límite ${policy.testMaxInitialInvestment}.` },
  ];
  if (testPasses.every((criterion) => criterion.pass)) {
    return { ...base, action: "test", label: "Probar", summary: `La alternativa ${selected!.mode} cumple el umbral de prueba, pero no todos los criterios de avance. Diseñe una entrada reversible con hitos de aprendizaje.`, reasons: testPasses.map((criterion) => criterion.reason) };
  }

  const failed = testPasses.filter((criterion) => !criterion.pass).map((criterion) => criterion.reason);
  return { ...base, action: "discard", label: "Descartar", summary: "La evidencia disponible no supera el umbral mínimo de prueba. No asigne inversión material; reabra el mercado únicamente si cambian los datos o supuestos clave.", reasons: failed };
}
