import { evaluateFinancials, recommendInvestmentAction, type EntryModeKey, type FinancialAssumptions, type FinancialResult, type InvestmentRecommendation, type InvestmentThresholds } from "./financialEngine";
import { buildSituation, scoreEntryModes, type EntryModeScore, type EntryModeWeights } from "./entryModeScoring";
import {
  classifyCountryProfile,
  deriveCalibration,
  growthVariability,
  positionOnOpportunityRiskMatrix,
  summarizeAssessment,
  variabilityRating,
  type AssessmentSummary,
  type CountryAssessment,
  type CountryProfileClassification,
  type DerivedCalibrationField,
  type GrowthVariability,
  type OpportunityRiskPosition,
} from "./countryAssessment";
import { itemPath } from "@shared/domain/countryAssessment";
import type { EntryDeliveryModel } from "@shared/domain/entryModes";
import type { GovernanceData } from "./wgi";

export type EntryObjective = "market" | "resources" | "learning" | "coordination";

/**
 * Justificación documental de un juicio cualitativo.
 *
 * La cobertura de evidencia se calcula sobre estas notas, no sobre cuántos deslizadores
 * se han movido: un factor evaluado en 50 tras estudiar el caso está tan documentado
 * como uno evaluado en 80, y uno movido sin justificación no lo está en absoluto.
 */
export type CalibrationNote = {
  rationale?: string | null;
  sourceLabel?: string | null;
};

export type CalibrationNotes = Partial<Record<keyof QualitativeCalibration, CalibrationNote>>;

/**
 * Criterios eliminatorios. El libro plantea la aceptabilidad del riesgo como una pregunta
 * de sí o no —«¿son los riesgos aceptables para accionistas y empleados?», p. 227—, no como
 * un sumando más que un PIB grande pueda compensar.
 */
export type KnockOutPolicy = {
  maxPoliticalRisk?: number | null;
  maxEconomicRisk?: number | null;
  maxCompetitiveRisk?: number | null;
  maxOperationalRisk?: number | null;
  maxCageDistance?: number | null;
  minSafety?: number | null;
  /** Exige gobernanza WGI disponible para admitir el país. */
  requireGovernanceEvidence?: boolean | null;
};

export type EligibilityBreach = {
  rule: string;
  label: string;
  value: number | null;
  limit: number | null;
};

export type CountryEligibility = {
  eligible: boolean;
  breaches: EligibilityBreach[];
};

export type QualitativeCalibration = {
  demandQuality: number;
  resourceFit: number;
  competitionAttractiveness: number;
  governmentOpenness: number;
  cageDistance: number;
  politicalRisk: number;
  economicRisk: number;
  competitiveRisk: number;
  operationalRisk: number;
  internalReadiness: number;
  timePressure: number;
  controlNeed: number;
  ipSensitivity: number;
};

export type MarketData = {
  gdpUsd?: number | null;
  gdpPerCapita?: number | null;
  gdpGrowth?: number | null;
  population?: number | null;
  urbanization?: number | null;
  internetUse?: number | null;
  tradeOpenness?: number | null;
  investmentRate?: number | null;
  fdiInflowUsd?: number | null;
  fdiInflowPctGdp?: number | null;
  // Indicadores añadidos para cubrir la Tabla 6.1 (p. 231).
  gdpPpp?: number | null;
  gdpPerCapitaPpp?: number | null;
  incomeDistributionGini?: number | null;
  householdConsumptionPctGdp?: number | null;
  savingsRate?: number | null;
  populationGrowth?: number | null;
  workingAgeSharePct?: number | null;
  governmentSpendingPctGdp?: number | null;
  tertiaryEnrolmentPct?: number | null;
  researchersPerMillion?: number | null;
  researchSpendingPctGdp?: number | null;
  electricityAccessPct?: number | null;
  /** Serie de crecimiento real, para medir la variabilidad económica (Fig. 6.13, p. 245). */
  gdpGrowthSeries?: { year: number; value: number }[] | null;
  governance?: GovernanceData;
  sourceYear?: number | null;
  /** Timestamp of the most recent public-data refresh for this country. */
  lastUpdatedAt?: string | null;
  /** Market fields deliberately overwritten by the analyst in the active scenario. */
  manualFields?: string[];
  sourceStatus: "live" | "partial" | "unavailable";
};

export type CountryInput = {
  code: string;
  name?: string;
  calibration?: Partial<QualitativeCalibration>;
  /** Justificación por factor. Alimenta la cobertura de evidencia. */
  calibrationNotes?: CalibrationNotes;
  /**
   * Evaluación detallada del capítulo 6. Cuando existe, los factores de país de la
   * calibración se derivan de ella; los que no estén evaluados conservan el valor manual.
   */
  assessment?: CountryAssessment;
  /** Criterios eliminatorios específicos de este país; si falta, se aplica la política general. */
  knockOuts?: KnockOutPolicy;
};

export type EvaluationInput = {
  companyName: string;
  homeCountry: string;
  industry: string;
  businessModel: string;
  valueProposition: string;
  objective: EntryObjective;
  horizonYears: number;
  countryInputs: CountryInput[];
  marketData: Record<string, MarketData>;
  financialByCountry?: Record<string, FinancialAssumptions>;
  investmentThresholds?: InvestmentThresholds;
  weights?: Partial<ScoreWeights>;
  /**
   * Modelo de entrega de la oferta (Tabla 7.5, p. 272). Sustituye a la inferencia por
   * expresión regular sobre el texto libre del modelo de negocio.
   */
  entryDeliveryModel?: EntryDeliveryModel;
  /** Pesos de los ocho criterios de la Tabla 7.4 usados para ordenar los modos. */
  entryModeWeights?: EntryModeWeights;
  /** Criterios eliminatorios aplicables a todos los países salvo anulación por país. */
  knockOuts?: KnockOutPolicy;
  /** Variación aplicada a cada palanca del tornado de sensibilidad. Por defecto 10%. */
  tornadoDeltaPct?: number;
};

export type ScoreWeights = {
  market: number;
  resources: number;
  competition: number;
  government: number;
  distance: number;
  risk: number;
};

export type CountryResult = {
  code: string;
  name: string;
  data: MarketData;
  calibration: QualitativeCalibration;
  scores: {
    market: number;
    resources: number;
    competition: number;
    government: number;
    distanceFit: number;
    safety: number;
    attractiveness: number;
    riskAdjusted: number;
    confidence: number;
  };
  /** Desglose de la cobertura de evidencia que sustenta `scores.confidence`. */
  evidence: {
    publicIndicatorsAvailable: number;
    publicIndicatorsTotal: number;
    documentedJudgements: number;
    totalJudgements: number;
    recencyFactor: number;
    /** Proporción de ítems del capítulo 6 evaluados, 0-1. */
    assessmentCoverage: number;
  };
  /** Resultado de la evaluación detallada del capítulo 6. */
  assessment: {
    summary: AssessmentSummary;
    /** Factores de la calibración que provienen de la evaluación en lugar del deslizador. */
    derivedFields: DerivedCalibrationField[];
    profile: CountryProfileClassification;
    opportunityRisk: OpportunityRiskPosition;
    growthVariability: GrowthVariability;
  };
  eligibility: CountryEligibility;
  entryModes: EntryModeRecommendation[];
  financial: FinancialResult;
  investmentRecommendation: InvestmentRecommendation;
  timing: TimingRecommendation;
  flags: string[];
};

export type EntryModeRecommendation = EntryModeScore;

export type TimingRecommendation = {
  label: string;
  description: string;
};

export type EvaluationResult = {
  generatedAt: string;
  methodology: string;
  countries: CountryResult[];
  portfolio: {
    leadingCountry?: string;
    recommendation: string;
    caveats: string[];
  };
};

const defaults: QualitativeCalibration = {
  demandQuality: 50,
  resourceFit: 50,
  competitionAttractiveness: 50,
  governmentOpenness: 50,
  cageDistance: 50,
  politicalRisk: 50,
  economicRisk: 50,
  competitiveRisk: 50,
  operationalRisk: 50,
  internalReadiness: 50,
  timePressure: 50,
  controlNeed: 50,
  ipSensitivity: 50,
};

const defaultWeights: ScoreWeights = {
  market: 28,
  resources: 16,
  competition: 16,
  government: 10,
  distance: 10,
  risk: 20,
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mean(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 50;
}

function normalize(value: number | null | undefined, low: number, high: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 50;
  if (high === low) return 50;
  return clamp(((value - low) / (high - low)) * 100);
}

function logNormalize(value: number | null | undefined, low: number, high: number) {
  if (!value || value <= 0) return 50;
  return normalize(Math.log10(value), Math.log10(low), Math.log10(high));
}

function labelForObjective(objective: EntryObjective) {
  return {
    market: "desarrollo de mercado",
    resources: "acceso a recursos",
    learning: "aprendizaje y capacidades",
    coordination: "coordinación regional",
  }[objective];
}

const calibrationKeys = Object.keys(defaults) as (keyof QualitativeCalibration)[];

/**
 * Cobertura de evidencia.
 *
 * La versión anterior contaba cuántos deslizadores se habían separado de 50, de modo que
 * un factor evaluado deliberadamente en 50 tras leer el caso contaba como «no especificado»
 * y uno movido al azar contaba como evidencia. Ahora se mide lo que de verdad sostiene un
 * juicio: cuántos indicadores públicos hay, con qué antigüedad, y cuántos juicios
 * cualitativos llevan una justificación o una fuente escrita.
 */
function calculateEvidence(
  data: MarketData,
  notes: CalibrationNotes | undefined,
  derived: DerivedCalibrationField[],
  assessmentCoverage: number,
) {
  const dataPoints = [
    data.gdpUsd,
    data.gdpPerCapita,
    data.gdpGrowth,
    data.population,
    data.urbanization,
    data.internetUse,
    data.tradeOpenness,
    data.investmentRate,
    data.fdiInflowUsd,
    data.fdiInflowPctGdp,
    data.governance?.politicalStability,
    data.governance?.governmentEffectiveness,
    data.governance?.regulatoryQuality,
    data.governance?.ruleOfLaw,
    data.governance?.controlOfCorruption,
  ];
  const publicIndicatorsTotal = dataPoints.length;
  const publicIndicatorsAvailable = dataPoints.filter((value) => value !== null && value !== undefined).length;

  const currentYear = new Date().getUTCFullYear();
  const sourceYear = data.sourceYear ?? null;
  const age = sourceYear === null ? null : currentYear - sourceYear;
  const recencyFactor = age === null ? 0.7 : age <= 2 ? 1 : age <= 5 ? 0.85 : 0.7;

  /**
   * Un factor cuenta como documentado si lleva justificación escrita **o** si procede de
   * una evaluación detallada suficientemente cubierta: trece dimensiones CAGE puntuadas
   * son mejor evidencia que una frase suelta.
   */
  const derivedEnough = new Set(derived.filter((field) => field.coverage >= 0.5).map((field) => field.key));
  const documentedJudgements = calibrationKeys.filter((key) => {
    const note = notes?.[key];
    return Boolean(note?.rationale?.trim() || note?.sourceLabel?.trim()) || derivedEnough.has(key);
  }).length;

  return {
    publicIndicatorsAvailable,
    publicIndicatorsTotal,
    documentedJudgements,
    totalJudgements: calibrationKeys.length,
    recencyFactor,
    assessmentCoverage: Math.round(assessmentCoverage * 100) / 100,
  };
}

function confidenceFromEvidence(evidence: ReturnType<typeof calculateEvidence>) {
  const publicCoverage = (evidence.publicIndicatorsAvailable / evidence.publicIndicatorsTotal) * evidence.recencyFactor;
  const judgementCoverage = evidence.documentedJudgements / evidence.totalJudgements;
  return clamp(Math.round(100 * (0.45 * publicCoverage + 0.55 * judgementCoverage)));
}

/**
 * Peso del dato público de gobernanza frente al juicio del analista.
 * Antes era una constante 0,65/0,35 aunque el dato fuera antiguo o no existiera.
 */
function governanceEvidenceWeight(governance: GovernanceData | undefined) {
  if (!governance || governance.sourceStatus === "unavailable") return 0;
  const currentYear = new Date().getUTCFullYear();
  const age = governance.sourceYear === null ? null : currentYear - governance.sourceYear;
  const recency = age === null ? 0.7 : age <= 3 ? 1 : age <= 6 ? 0.8 : 0.6;
  const completeness = governance.sourceStatus === "live" ? 1 : 0.6;
  return 0.45 * recency * completeness;
}

function evaluateEligibility(
  calibration: QualitativeCalibration,
  safety: number,
  governance: GovernanceData | undefined,
  policy: KnockOutPolicy | undefined,
): CountryEligibility {
  if (!policy) return { eligible: true, breaches: [] };
  const breaches: EligibilityBreach[] = [];
  const maxRule = (limit: number | null | undefined, value: number, rule: string, label: string) => {
    if (limit === null || limit === undefined) return;
    if (value > limit) breaches.push({ rule, label, value, limit });
  };
  maxRule(policy.maxPoliticalRisk, calibration.politicalRisk, "maxPoliticalRisk", "Riesgo político por encima del máximo admitido");
  maxRule(policy.maxEconomicRisk, calibration.economicRisk, "maxEconomicRisk", "Riesgo económico por encima del máximo admitido");
  maxRule(policy.maxCompetitiveRisk, calibration.competitiveRisk, "maxCompetitiveRisk", "Riesgo competitivo por encima del máximo admitido");
  maxRule(policy.maxOperationalRisk, calibration.operationalRisk, "maxOperationalRisk", "Riesgo operativo por encima del máximo admitido");
  maxRule(policy.maxCageDistance, calibration.cageDistance, "maxCageDistance", "Distancia CAGE por encima del máximo admitido");
  if (policy.minSafety !== null && policy.minSafety !== undefined && safety < policy.minSafety) {
    breaches.push({ rule: "minSafety", label: "Seguridad agregada por debajo del mínimo admitido", value: safety, limit: policy.minSafety });
  }
  if (policy.requireGovernanceEvidence && (!governance || governance.sourceStatus === "unavailable")) {
    breaches.push({ rule: "requireGovernanceEvidence", label: "Se exige evidencia de gobernanza y no hay datos WGI disponibles", value: null, limit: null });
  }
  return { eligible: breaches.length === 0, breaches };
}

function recommendTiming(attractiveness: number, safety: number, calibration: QualitativeCalibration): TimingRecommendation {
  if (attractiveness >= 72 && safety >= 60 && calibration.timePressure >= 60) {
    return {
      label: "Ventana de entrada: actuar",
      description: "La combinación de oportunidad, riesgo tolerable y urgencia justifica preparar una entrada con hitos de ejecución y validación financiera.",
    };
  }
  if (attractiveness >= 58 && safety >= 45) {
    return {
      label: "Entrada gradual / opción real",
      description: "Existe interés estratégico, pero conviene comenzar con un compromiso reversible y definir criterios explícitos para ampliar, mantener o abandonar.",
    };
  }
  return {
    label: "Observar y aprender",
    description: "La evidencia actual no justifica una inversión material. Priorice inteligencia local, relaciones y señales que reabran la decisión.",
  };
}

export function evaluateStrategy(input: EvaluationInput): EvaluationResult {
  const weights = { ...defaultWeights, ...input.weights };
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const countries = input.countryInputs.map((country) => {
    const data = input.marketData[country.code] ?? { sourceStatus: "unavailable" as const };
    const manualCalibration = { ...defaults, ...country.calibration };

    /**
     * Variabilidad económica a partir de la serie pública de crecimiento. Si el analista
     * no ha puntuado ese ítem a mano, se rellena con el dato; si lo ha puntuado, manda él.
     */
    const variability = growthVariability(data.gdpGrowthSeries?.map((point) => point.value));
    const variabilityPath = itemPath("risk", "economic", "variability");
    const derivedVariability = variabilityRating(variability.coefficientOfVariation);
    const assessmentInput: CountryAssessment | undefined =
      country.assessment && derivedVariability !== null && country.assessment.ratings?.[variabilityPath] == null
        ? { ...country.assessment, ratings: { ...country.assessment.ratings, [variabilityPath]: derivedVariability } }
        : country.assessment;

    const { calibration, derived: derivedFields } = deriveCalibration(assessmentInput, manualCalibration);
    const assessmentSummary = summarizeAssessment(assessmentInput);

    const macroMarket = mean([
      logNormalize(data.gdpUsd, 20_000_000_000, 25_000_000_000_000),
      logNormalize(data.population, 500_000, 1_500_000_000),
      normalize(data.gdpPerCapita, 1_000, 80_000),
      normalize(data.gdpGrowth, -5, 12),
      normalize(data.urbanization, 20, 95),
    ]);
    const market = clamp(0.65 * macroMarket + 0.35 * calibration.demandQuality);
    const macroResources = mean([
      normalize(data.internetUse, 10, 100),
      normalize(data.investmentRate, 10, 40),
      normalize(data.tradeOpenness, 20, 220),
      normalize(data.urbanization, 20, 95),
    ]);
    const resources = clamp(0.52 * macroResources + 0.48 * calibration.resourceFit);
    const competition = clamp(calibration.competitionAttractiveness);
    const governance = data.governance;
    const governmentEvidence = governance?.sourceStatus === "unavailable"
      ? null
      : mean([governance?.governmentEffectiveness ?? Number.NaN, governance?.regulatoryQuality ?? Number.NaN, governance?.ruleOfLaw ?? Number.NaN, governance?.controlOfCorruption ?? Number.NaN]);
    // El dato objetivo pesa más cuanto más reciente y completo sea, en lugar de un 0,35 fijo.
    const evidenceWeight = governanceEvidenceWeight(governance);
    const blend = (judgement: number, evidenceValue: number | null) =>
      evidenceValue === null || evidenceWeight === 0 ? judgement : (1 - evidenceWeight) * judgement + evidenceWeight * evidenceValue;
    const government = clamp(blend(calibration.governmentOpenness, governmentEvidence));
    const distanceFit = clamp(100 - calibration.cageDistance);
    const politicalExposure = blend(
      calibration.politicalRisk,
      governance?.politicalStability === null || governance?.politicalStability === undefined ? null : 100 - governance.politicalStability,
    );
    const operationalExposure = blend(
      calibration.operationalRisk,
      governance?.governmentEffectiveness === null || governance?.governmentEffectiveness === undefined ? null : 100 - governance.governmentEffectiveness,
    );
    const competitiveExposure = blend(
      calibration.competitiveRisk,
      governance?.controlOfCorruption === null || governance?.controlOfCorruption === undefined ? null : 100 - governance.controlOfCorruption,
    );
    const safety = clamp(
      100 - mean([politicalExposure, calibration.economicRisk, competitiveExposure, operationalExposure]),
    );
    const attractiveness = clamp(
      (market * weights.market +
        resources * weights.resources +
        competition * weights.competition +
        government * weights.government +
        distanceFit * weights.distance) /
        (weights.market + weights.resources + weights.competition + weights.government + weights.distance),
    );
    const riskAdjusted = clamp(
      (attractiveness * (totalWeight - weights.risk) + safety * weights.risk) / totalWeight,
    );
    const flags: string[] = [];
    if (calibration.politicalRisk >= 70) flags.push("Riesgo político alto: limite activos hundidos y considere cobertura contractual/financiera.");
    if (calibration.cageDistance >= 70) flags.push("Distancia CAGE alta: exija evidencia local y una ruta de aprendizaje antes de escalar.");
    if (calibration.ipSensitivity >= 70) flags.push("Sensibilidad alta de IP: extreme controles antes de licenciar o compartir tecnología.");
    if (calibration.competitionAttractiveness <= 35) flags.push("Contexto competitivo desfavorable: valide rivalidad, barreras y poder de canal antes de comprometer inversión.");
    if (data.sourceStatus !== "live") flags.push("Datos macroeconómicos incompletos o no disponibles: la puntuación se apoya más en calibración cualitativa.");
    if (governance?.sourceStatus === "unavailable") flags.push("Gobernanza WGI no disponible: el componente de gobierno y riesgo se apoya solo en la calibración cualitativa.");

    const evidence = calculateEvidence(data, country.calibrationNotes, derivedFields, assessmentSummary.coverage);
    const confidence = confidenceFromEvidence(evidence);
    if (evidence.documentedJudgements < evidence.totalJudgements) {
      flags.push(`Juicios cualitativos sin justificación documentada: ${evidence.totalJudgements - evidence.documentedJudgements} de ${evidence.totalJudgements}. Complete la evaluación detallada del país o registre la fuente que sostiene cada factor.`);
    }
    if (assessmentSummary.sustainabilityConcerns.length) {
      flags.push(`Cuestiones ambientales o sociales señaladas: ${assessmentSummary.sustainabilityConcerns.length}. El libro las plantea como filtro previo a la inversión, no como matiz (p. 242).`);
    }
    if (variability.coefficientOfVariation !== null && variability.coefficientOfVariation >= 1.1) {
      flags.push(`Crecimiento muy volátil: coeficiente de variación ${variability.coefficientOfVariation} sobre ${variability.observations} años. Dos países con el mismo crecimiento medio y distinta dispersión no tienen el mismo riesgo económico (p. 245).`);
    }

    const eligibility = evaluateEligibility(calibration, safety, governance, country.knockOuts ?? input.knockOuts);
    for (const breach of eligibility.breaches) {
      flags.push(breach.limit === null ? `Criterio eliminatorio: ${breach.label}.` : `Criterio eliminatorio: ${breach.label} (${breach.value} frente al límite ${breach.limit}).`);
    }

    const includeDigital = input.entryDeliveryModel
      ? input.entryDeliveryModel !== "relational"
      : /(digital|saas|software|plataforma|marketplace|e-commerce|ecommerce)/i.test(input.businessModel);
    const modeRanking = scoreEntryModes(
      buildSituation({
        objective: input.objective,
        attractiveness,
        safety,
        internalReadiness: calibration.internalReadiness,
        timePressure: calibration.timePressure,
        controlNeed: calibration.controlNeed,
        ipSensitivity: calibration.ipSensitivity,
      }),
      { includeDigital, weights: input.entryModeWeights },
    );
    const entryModes = modeRanking.slice(0, 3);
    const financial = evaluateFinancials(
      input.financialByCountry?.[country.code],
      modeRanking.map(({ key, mode }) => ({ key, mode })),
      input.horizonYears,
      { tornadoDeltaPct: input.tornadoDeltaPct },
    );
    const evaluatedRecommendation = recommendInvestmentAction(financial, riskAdjusted, confidence, input.investmentThresholds);
    // Un criterio eliminatorio no se pondera con el resto: cierra el mercado.
    const investmentRecommendation: InvestmentRecommendation = eligibility.eligible
      ? evaluatedRecommendation
      : {
          ...evaluatedRecommendation,
          action: "discard",
          label: "Descartar (criterio eliminatorio)",
          summary: "El mercado incumple al menos un criterio eliminatorio de la política de inversión. La puntuación agregada no compensa un umbral declarado como no negociable.",
          reasons: eligibility.breaches.map((breach) =>
            breach.limit === null ? breach.label : `${breach.label}: ${breach.value} frente al límite ${breach.limit}.`,
          ),
        };

    return {
      code: country.code,
      name: country.name ?? country.code,
      data,
      calibration,
      scores: {
        market,
        resources,
        competition,
        government,
        distanceFit,
        safety,
        attractiveness,
        riskAdjusted,
        confidence,
      },
      evidence,
      assessment: {
        summary: assessmentSummary,
        derivedFields,
        profile: classifyCountryProfile(data, assessmentInput),
        // La matriz de síntesis del libro cruza oportunidad de mercado y competitiva con riesgo.
        opportunityRisk: positionOnOpportunityRiskMatrix(attractiveness, 100 - safety),
        growthVariability: variability,
      },
      eligibility,
      entryModes,
      financial,
      investmentRecommendation,
      timing: recommendTiming(attractiveness, safety, calibration),
      flags,
    } satisfies CountryResult;
  });

  // Un país excluido por criterio eliminatorio nunca encabeza la comparación.
  countries.sort((a, b) => {
    if (a.eligibility.eligible !== b.eligibility.eligible) return a.eligibility.eligible ? -1 : 1;
    return b.scores.riskAdjusted - a.scores.riskAdjusted;
  });
  const leader = countries.find((country) => country.eligibility.eligible);
  const excluded = countries.filter((country) => !country.eligibility.eligible);
  const caveats = [
    "La comparación no sustituye el análisis específico de industria, validación de clientes, regulación ni debida diligencia.",
    "Los indicadores públicos son señales de contexto; la decisión debe comprobarse con evidencia local y un caso financiero ajustado al riesgo.",
    "Los pesos de atractividad dependen del tipo de industria y de la ambición global declarada; el libro no fija una ponderación universal (pp. 228 y 248).",
  ];
  if (excluded.length) {
    caveats.push(`${excluded.length} mercado(s) quedan fuera por criterio eliminatorio: ${excluded.map((country) => country.name).join(", ")}.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    methodology: `Evaluación multicriterio basada en ambición, atractividad, riesgo, distancia y modo de entrada para el objetivo de ${labelForObjective(input.objective)}. Los modos se ordenan cruzando el perfil de la Tabla 7.4 (Lasserre y Monteiro, 5.ª ed., p. 271) con las necesidades y restricciones del caso; los criterios eliminatorios se aplican antes de cualquier ponderación.`,
    countries,
    portfolio: {
      leadingCountry: leader?.name,
      recommendation: leader
        ? `${leader.name} lidera la comparación actual con una puntuación ajustada por riesgo de ${leader.scores.riskAdjusted}/100. La política de inversión indica: ${leader.investmentRecommendation.label}. ${leader.investmentRecommendation.summary}`
        : countries.length
          ? "Ningún mercado supera los criterios eliminatorios definidos. Revise la política o amplíe el universo de países."
          : "Añada al menos un país para construir una comparación.",
      caveats,
    },
  };
}
