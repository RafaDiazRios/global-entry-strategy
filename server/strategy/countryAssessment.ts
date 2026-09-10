import {
  assessmentBlockByKey,
  assessmentBlocks,
  assessmentScaleMax,
  countryProfiles,
  incentiveFamilies,
  itemPath,
  itemsOf,
  opportunityRiskQuadrants,
  type AssessmentBlock,
  type AssessmentBlockKey,
  type AssessmentValue,
  type CountryProfileKey,
  type LifeCycleCluster,
  type OpportunityRiskQuadrant,
  type ProfileTrait,
} from "@shared/domain/countryAssessment";
import type { MarketData, QualitativeCalibration } from "./engine";

/**
 * Evaluación detallada de un país según el capítulo 6.
 *
 * La calibración de trece factores que consume el motor no desaparece: se **deriva** de
 * esta evaluación cuando existe, y se conserva como entrada manual para los bloques que
 * el analista no haya trabajado todavía. Así la herramienta admite tanto un caso
 * exhaustivo como una primera pasada rápida, sin dos motores distintos.
 */
export type CountryAssessment = {
  /** Valor 0-4 por ítem, indexado por `bloque.grupo.item`. Ausente o null = no evaluado. */
  ratings?: Record<string, AssessmentValue>;
  /** Justificación por ítem, con la misma clave. */
  notes?: Record<string, string>;
  /** Instrumentos de incentivo disponibles, como `familia.instrumento`. */
  incentives?: string[];
  /** Cuestiones ESG marcadas como problemáticas. */
  sustainabilityConcerns?: string[];
  lifeCycleCluster?: LifeCycleCluster | null;
  /** Puntuación pública de facilidad para hacer negocios, 0-100. */
  easeOfDoingBusinessScore?: number | null;
  /** Perfil de país fijado a mano en lugar del clasificado automáticamente. */
  profileOverride?: CountryProfileKey | null;
};

export type DerivedCalibrationField = {
  key: keyof QualitativeCalibration;
  /** Bloque del capítulo 6 del que sale el valor. */
  source: string;
  /** Proporción de ítems evaluados en ese bloque, 0-1. */
  coverage: number;
};

export type ScoreBreakdown = {
  /** Media de los ítems evaluados en la orientación propia del bloque, 0-100. */
  raw: number | null;
  /** La misma media leída siempre como «más es mejor», 0-100. */
  favourable: number | null;
  assessed: number;
  total: number;
  /** Proporción de ítems evaluados, 0-1. */
  coverage: number;
};

export type AssessmentSummary = {
  blocks: Record<AssessmentBlockKey, ScoreBreakdown>;
  groups: Record<string, ScoreBreakdown>;
  incentives: { available: number; total: number; score: number };
  sustainabilityConcerns: string[];
  /** Proporción de ítems evaluados sobre el total del capítulo 6. */
  coverage: number;
  assessedItems: number;
  totalItems: number;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

function readRating(assessment: CountryAssessment | undefined, path: string): number | null {
  const value = assessment?.ratings?.[path];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(assessmentScaleMax, value)) : null;
}

function summarize(values: (number | null)[], total: number, direction: AssessmentBlock["direction"]): ScoreBreakdown {
  const assessedValues = values.filter((value): value is number => value !== null);
  if (!assessedValues.length) return { raw: null, favourable: null, assessed: 0, total, coverage: 0 };
  const mean = assessedValues.reduce((sum, value) => sum + value, 0) / assessedValues.length;
  const raw = clamp((mean / assessmentScaleMax) * 100);
  return {
    raw: round(raw),
    favourable: round(direction === "adverse" ? 100 - raw : raw),
    assessed: assessedValues.length,
    total,
    coverage: total === 0 ? 0 : assessedValues.length / total,
  };
}

export function scoreGroup(assessment: CountryAssessment | undefined, blockKey: AssessmentBlockKey, groupKey: string): ScoreBreakdown {
  const block = assessmentBlockByKey.get(blockKey);
  const group = block?.groups.find((candidate) => candidate.key === groupKey);
  if (!block || !group) return { raw: null, favourable: null, assessed: 0, total: 0, coverage: 0 };
  const values = group.items.map((item) => readRating(assessment, itemPath(blockKey, groupKey, item.key)));
  return summarize(values, group.items.length, block.direction);
}

export function scoreBlock(assessment: CountryAssessment | undefined, blockKey: AssessmentBlockKey): ScoreBreakdown {
  const block = assessmentBlockByKey.get(blockKey);
  if (!block) return { raw: null, favourable: null, assessed: 0, total: 0, coverage: 0 };
  const items = itemsOf(block);
  const values = items.map((item) => readRating(assessment, itemPath(blockKey, item.groupKey, item.key)));
  return summarize(values, items.length, block.direction);
}

const totalIncentiveInstruments = incentiveFamilies.reduce((sum, family) => sum + family.instruments.length, 0);

export function summarizeAssessment(assessment: CountryAssessment | undefined): AssessmentSummary {
  const blocks = {} as Record<AssessmentBlockKey, ScoreBreakdown>;
  const groups: Record<string, ScoreBreakdown> = {};
  let assessedItems = 0;
  let totalItems = 0;
  for (const block of assessmentBlocks) {
    const breakdown = scoreBlock(assessment, block.key);
    blocks[block.key] = breakdown;
    assessedItems += breakdown.assessed;
    totalItems += breakdown.total;
    for (const group of block.groups) {
      groups[`${block.key}.${group.key}`] = scoreGroup(assessment, block.key, group.key);
    }
  }
  const available = assessment?.incentives?.length ?? 0;
  return {
    blocks,
    groups,
    // El libro advierte de que los incentivos solo desempatan: la escala se mantiene modesta a propósito.
    incentives: { available, total: totalIncentiveInstruments, score: round((available / totalIncentiveInstruments) * 100) },
    sustainabilityConcerns: assessment?.sustainabilityConcerns ?? [],
    coverage: totalItems === 0 ? 0 : assessedItems / totalItems,
    assessedItems,
    totalItems,
  };
}

/**
 * Deriva los trece factores del motor a partir de la evaluación detallada.
 *
 * Los cuatro factores de la empresa —capacidad interna, presión temporal, necesidad de
 * control y sensibilidad de IP— no salen del capítulo 6: describen a la empresa, no al
 * país, y se conservan tal cual desde la calibración manual.
 */
export function deriveCalibration(
  assessment: CountryAssessment | undefined,
  fallback: QualitativeCalibration,
): { calibration: QualitativeCalibration; derived: DerivedCalibrationField[] } {
  const summary = summarizeAssessment(assessment);
  const derived: DerivedCalibrationField[] = [];
  const calibration = { ...fallback };

  const take = (key: keyof QualitativeCalibration, value: number | null, source: string, coverage: number) => {
    if (value === null) return;
    calibration[key] = Math.round(clamp(value));
    derived.push({ key, source, coverage: Math.round(coverage * 100) / 100 });
  };

  // Calidad de la demanda: el juicio directo pesa más que la accesibilidad del segmento.
  const demand = scoreGroup(assessment, "market", "demand");
  const segmentation = scoreGroup(assessment, "market", "segmentation");
  if (demand.favourable !== null || segmentation.favourable !== null) {
    const parts = [
      demand.favourable === null ? null : { value: demand.favourable, weight: 0.65 },
      segmentation.favourable === null ? null : { value: segmentation.favourable, weight: 0.35 },
    ].filter((part): part is { value: number; weight: number } => part !== null);
    const weight = parts.reduce((sum, part) => sum + part.weight, 0);
    take(
      "demandQuality",
      parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weight,
      "Oportunidades de mercado · demanda y segmentación",
      Math.max(demand.coverage, segmentation.coverage),
    );
  }

  take("resourceFit", summary.blocks.resources.favourable, "Oportunidades de recursos", summary.blocks.resources.coverage);

  // Contexto competitivo: las fuerzas mandan; el diamante matiza.
  const forces = scoreGroup(assessment, "industry", "forces");
  const diamond = scoreGroup(assessment, "industry", "diamond");
  if (forces.favourable !== null || diamond.favourable !== null) {
    const parts = [
      forces.favourable === null ? null : { value: forces.favourable, weight: 0.7 },
      diamond.favourable === null ? null : { value: diamond.favourable, weight: 0.3 },
    ].filter((part): part is { value: number; weight: number } => part !== null);
    const weight = parts.reduce((sum, part) => sum + part.weight, 0);
    take(
      "competitionAttractiveness",
      parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weight,
      "Seis fuerzas y diamante del país",
      Math.max(forces.coverage, diamond.coverage),
    );
  }

  /**
   * Apertura e incentivos: la política gubernamental como fuerza competitiva es el
   * componente principal; la facilidad para hacer negocios y los incentivos disponibles
   * solo desplazan el resultado de forma limitada, siguiendo la conclusión de la p. 242.
   */
  const governmentPressure = readRating(assessment, itemPath("industry", "forces", "governmentPolicy"));
  const ease = assessment?.easeOfDoingBusinessScore ?? null;
  const governmentParts: { value: number; weight: number }[] = [];
  if (governmentPressure !== null) governmentParts.push({ value: 100 - (governmentPressure / assessmentScaleMax) * 100, weight: 0.6 });
  if (ease !== null) governmentParts.push({ value: clamp(ease), weight: 0.3 });
  if (assessment?.incentives?.length) governmentParts.push({ value: Math.min(100, summary.incentives.score * 2), weight: 0.1 });
  if (governmentParts.length) {
    const weight = governmentParts.reduce((sum, part) => sum + part.weight, 0);
    take(
      "governmentOpenness",
      governmentParts.reduce((sum, part) => sum + part.value * part.weight, 0) / weight,
      "Política gubernamental, facilidad para hacer negocios e incentivos",
      governmentPressure === null ? 0.4 : 1,
    );
  }

  take("cageDistance", summary.blocks.cage.raw, "Distancia CAGE", summary.blocks.cage.coverage);

  // Riesgo político: media de las tres exposiciones que el libro separa.
  const politicalGroups = ["politicalShareholder", "politicalEmployee", "politicalOperational"]
    .map((groupKey) => scoreGroup(assessment, "risk", groupKey))
    .filter((group) => group.raw !== null);
  if (politicalGroups.length) {
    take(
      "politicalRisk",
      politicalGroups.reduce((sum, group) => sum + (group.raw ?? 0), 0) / politicalGroups.length,
      "Riesgo político · exposición de accionista, empleado y operación",
      politicalGroups.reduce((sum, group) => sum + group.coverage, 0) / politicalGroups.length,
    );
  }
  const economic = scoreGroup(assessment, "risk", "economic");
  take("economicRisk", economic.raw, "Riesgo económico", economic.coverage);
  const competitive = scoreGroup(assessment, "risk", "competitive");
  take("competitiveRisk", competitive.raw, "Riesgo competitivo", competitive.coverage);
  const operational = scoreGroup(assessment, "risk", "operational");
  take("operationalRisk", operational.raw, "Riesgo operativo", operational.coverage);

  return { calibration, derived };
}

// ---------------------------------------------------------------------------
// Coeficiente de variación del crecimiento — Figura 6.13, p. 245
// ---------------------------------------------------------------------------

export type GrowthVariability = {
  mean: number | null;
  standardDeviation: number | null;
  /** Desviación típica sobre media, en valor absoluto. Mayor = más riesgo económico. */
  coefficientOfVariation: number | null;
  observations: number;
};

export function growthVariability(series: (number | null | undefined)[] | undefined): GrowthVariability {
  const values = (series ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (values.length < 3) return { mean: null, standardDeviation: null, coefficientOfVariation: null, observations: values.length };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = Math.abs(mean) < 1e-9 ? null : Math.abs(standardDeviation / mean);
  return {
    mean: round(mean),
    standardDeviation: round(standardDeviation),
    coefficientOfVariation: coefficientOfVariation === null ? null : Math.round(coefficientOfVariation * 100) / 100,
    observations: values.length,
  };
}

/**
 * Traduce el coeficiente de variación a la escala 0-4 del ítem de variabilidad.
 * Referencia del libro: Hungría 1,04 frente a Chequia 0,89 en 2000-2019, y de ahí que
 * Hungría exhiba mayor riesgo económico con un crecimiento medio parecido (p. 245).
 */
export function variabilityRating(coefficientOfVariation: number | null): number | null {
  if (coefficientOfVariation === null) return null;
  if (coefficientOfVariation < 0.5) return 0;
  if (coefficientOfVariation < 0.8) return 1;
  if (coefficientOfVariation < 1.1) return 2;
  if (coefficientOfVariation < 1.6) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Perfil estratégico de país — Tabla 6.6, p. 249
// ---------------------------------------------------------------------------

const traitOrder: Record<Exclude<ProfileTrait, "Variable">, number> = { L: 0, "M/L": 1, M: 2, "M/H": 3, H: 4 };

type TraitKey = keyof (typeof countryProfiles)[number]["traits"];

function bandFor(value: number | null | undefined, thresholds: [number, number, number, number]): ProfileTrait | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value < thresholds[0]) return "L";
  if (value < thresholds[1]) return "M/L";
  if (value < thresholds[2]) return "M";
  if (value < thresholds[3]) return "M/H";
  return "H";
}

export type CountryProfileMatch = {
  key: CountryProfileKey;
  label: string;
  description: string;
  examples: string;
  /** Grado de coincidencia con los rasgos observables, 0-1. */
  match: number;
  /** Rasgos que se pudieron comparar. */
  comparedTraits: number;
};

export type CountryProfileClassification = {
  best: CountryProfileMatch | null;
  ranking: CountryProfileMatch[];
  observedTraits: Partial<Record<TraitKey, ProfileTrait>>;
  source: string;
};

export function classifyCountryProfile(data: MarketData, assessment?: CountryAssessment): CountryProfileClassification {
  const governanceValues = [
    data.governance?.governmentEffectiveness,
    data.governance?.regulatoryQuality,
    data.governance?.ruleOfLaw,
    data.governance?.controlOfCorruption,
    data.governance?.politicalStability,
  ].filter((value): value is number => typeof value === "number");
  const governanceMean = governanceValues.length ? governanceValues.reduce((sum, value) => sum + value, 0) / governanceValues.length : null;

  const observedTraits: Partial<Record<TraitKey, ProfileTrait>> = {};
  const population = bandFor(data.population, [10_000_000, 30_000_000, 60_000_000, 100_000_000]);
  if (population) observedTraits.population = population;
  const gdp = bandFor(data.gdpUsd, [50e9, 200e9, 600e9, 1_500e9]);
  if (gdp) observedTraits.gdp = gdp;
  const gdpPerCapita = bandFor(data.gdpPerCapita, [3_000, 8_000, 16_000, 28_000]);
  if (gdpPerCapita) observedTraits.gdpPerCapita = gdpPerCapita;
  const infrastructure = bandFor(data.internetUse, [25, 45, 65, 82]);
  if (infrastructure) observedTraits.infrastructure = infrastructure;
  // El riesgo se lee al revés que la gobernanza: buena gobernanza es riesgo bajo.
  const risk = governanceMean === null ? null : bandFor(100 - governanceMean, [25, 40, 55, 70]);
  if (risk) observedTraits.risk = risk;
  const ease = assessment?.easeOfDoingBusinessScore ?? data.governance?.regulatoryQuality ?? null;
  const easeBand = bandFor(ease, [35, 50, 65, 78]);
  if (easeBand) observedTraits.easeOfDoingBusiness = easeBand;
  const naturalResources = scoreGroup(assessment, "resources", "natural").favourable;
  const naturalBand = bandFor(naturalResources, [25, 45, 60, 78]);
  if (naturalBand) observedTraits.naturalResources = naturalBand;
  const skills = scoreGroup(assessment, "resources", "human").favourable;
  const skillsBand = bandFor(skills, [25, 45, 60, 78]);
  if (skillsBand) observedTraits.skills = skillsBand;

  const ranking = countryProfiles
    .map((profile) => {
      let total = 0;
      let compared = 0;
      for (const [traitKey, observed] of Object.entries(observedTraits) as [TraitKey, ProfileTrait][]) {
        const expected = profile.traits[traitKey];
        if (expected === "Variable" || observed === "Variable") continue;
        compared += 1;
        total += 1 - Math.abs(traitOrder[expected] - traitOrder[observed]) / 4;
      }
      return {
        key: profile.key,
        label: profile.label,
        description: profile.description,
        examples: profile.examples,
        match: compared === 0 ? 0 : Math.round((total / compared) * 100) / 100,
        comparedTraits: compared,
      } satisfies CountryProfileMatch;
    })
    .sort((a, b) => b.match - a.match || b.comparedTraits - a.comparedTraits);

  const override = assessment?.profileOverride
    ? ranking.find((profile) => profile.key === assessment.profileOverride) ?? null
    : null;

  return {
    best: override ?? (ranking[0]?.comparedTraits ? ranking[0] : null),
    ranking,
    observedTraits,
    source: "Tabla 6.6, p. 249",
  };
}

// ---------------------------------------------------------------------------
// Matriz oportunidades × riesgos — Figura 6.2, p. 227
// ---------------------------------------------------------------------------

export type OpportunityRiskPosition = {
  opportunity: number;
  risk: number;
  quadrant: OpportunityRiskQuadrant;
  label: string;
  reading: string;
  midpoints: { opportunity: number; risk: number };
  source: string;
};

export function positionOnOpportunityRiskMatrix(
  opportunity: number,
  risk: number,
  midpoints: { opportunity?: number; risk?: number } = {},
): OpportunityRiskPosition {
  const opportunityMid = midpoints.opportunity ?? 55;
  const riskMid = midpoints.risk ?? 45;
  const highOpportunity = opportunity >= opportunityMid;
  const highRisk = risk >= riskMid;
  const quadrant: OpportunityRiskQuadrant = highOpportunity
    ? highRisk
      ? "highRiskHighReturn"
      : "highAttractiveness"
    : highRisk
      ? "lowAttractiveness"
      : "lowRiskLowReturn";
  return {
    opportunity: Math.round(opportunity),
    risk: Math.round(risk),
    quadrant,
    label: opportunityRiskQuadrants[quadrant].label,
    reading: opportunityRiskQuadrants[quadrant].reading,
    midpoints: { opportunity: opportunityMid, risk: riskMid },
    source: "Figura 6.2, p. 227",
  };
}
