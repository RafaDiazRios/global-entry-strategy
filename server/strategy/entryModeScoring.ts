import {
  entryModeCriteria,
  entryModes,
  type EntryModeCriterionKey,
  type EntryModeDefinition,
  type EntryModeKey,
} from "@shared/domain/entryModes";

/**
 * Puntuación de modos de entrada a partir de la Tabla 7.4 (p. 271).
 *
 * Sustituye a las fórmulas ponderadas anteriores, cuyos coeficientes no procedían de
 * ninguna fuente citable. Aquí cada modo trae un perfil literal del libro y la
 * conveniencia se obtiene cruzando ese perfil con las necesidades del caso, de forma
 * que cada punto de la puntuación puede rastrearse a un criterio, una necesidad y un peso.
 */

export type EntryModeWeights = Partial<Record<EntryModeCriterionKey, number>>;

export type EntryModeSituation = {
  /** Capacidad interna de comprometer capital y dedicación directiva (0-100). */
  investmentCapacity: number;
  /** Urgencia de la ventana de oportunidad (0-100). */
  urgency: number;
  /** Penetración de mercado que exige el objetivo de entrada (0-100). */
  penetrationNeed: number;
  /** Necesidad de controlar cliente, marca, calidad y datos (0-100). */
  controlNeed: number;
  /** Exposición del país (0-100; 100 = riesgo máximo). */
  countryRisk: number;
  /** Sensibilidad estratégica de la propiedad intelectual (0-100). */
  ipSensitivity: number;
  /** Capacidad directiva para gestionar complejidad (0-100). */
  managerialCapacity: number;
};

export type EntryModeCriterionResult = {
  key: EntryModeCriterionKey;
  label: string;
  /** Valor del modo en la Tabla 7.4, normalizado a 0-100. */
  modeValue: number;
  /** Necesidad o restricción del caso frente a la que se contrasta. */
  situationValue: number;
  situationLabel: string;
  /** Conveniencia resultante, 0-100. */
  fit: number;
  weight: number;
  /** Aportación del criterio a la puntuación final. */
  contribution: number;
};

export type EntryModeScore = {
  key: EntryModeKey;
  mode: string;
  score: number;
  commitment: EntryModeDefinition["commitment"];
  rationale: string;
  provenance: string;
  criteria: EntryModeCriterionResult[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** Penetración de mercado que exige cada objetivo de entrada. Tabla 7.1, pp. 260-261. */
const penetrationNeedByObjective = {
  market: 80,
  resources: 45,
  learning: 35,
  coordination: 30,
} as const;

export type EntryObjectiveKey = keyof typeof penetrationNeedByObjective;

export function buildSituation(input: {
  objective: EntryObjectiveKey;
  attractiveness: number;
  safety: number;
  internalReadiness: number;
  timePressure: number;
  controlNeed: number;
  ipSensitivity: number;
}): EntryModeSituation {
  const base = penetrationNeedByObjective[input.objective];
  return {
    investmentCapacity: clamp(input.internalReadiness),
    urgency: clamp(input.timePressure),
    penetrationNeed: clamp(0.7 * base + 0.3 * input.attractiveness),
    controlNeed: clamp(input.controlNeed),
    countryRisk: clamp(100 - input.safety),
    ipSensitivity: clamp(input.ipSensitivity),
    managerialCapacity: clamp(input.internalReadiness),
  };
}

type CriterionEvaluator = (modeValue: number, situation: EntryModeSituation) => {
  fit: number;
  situationValue: number;
  situationLabel: string;
};

/**
 * Dos formas de contrastar perfil y situación:
 *  - «requisito»: el modo penaliza solo cuando queda por debajo de lo que el caso exige.
 *  - «exposición»: la característica del modo hace daño en proporción a un riesgo del caso.
 */
const evaluators: Record<EntryModeCriterionKey, CriterionEvaluator> = {
  upFrontInvestment: (modeValue, s) => ({
    fit: clamp(100 - Math.max(0, modeValue - s.investmentCapacity)),
    situationValue: s.investmentCapacity,
    situationLabel: "Capacidad interna de inversión",
  }),
  speedOfEntry: (modeValue, s) => ({
    fit: clamp(100 - Math.max(0, s.urgency - modeValue)),
    situationValue: s.urgency,
    situationLabel: "Presión temporal",
  }),
  marketPenetration: (modeValue, s) => ({
    fit: clamp(100 - Math.max(0, s.penetrationNeed - modeValue)),
    situationValue: s.penetrationNeed,
    situationLabel: "Penetración exigida por el objetivo",
  }),
  marketControl: (modeValue, s) => ({
    fit: clamp(100 - Math.max(0, s.controlNeed - modeValue)),
    situationValue: s.controlNeed,
    situationLabel: "Necesidad de control",
  }),
  politicalRiskExposure: (modeValue, s) => ({
    fit: clamp(100 - (modeValue / 100) * s.countryRisk),
    situationValue: s.countryRisk,
    situationLabel: "Riesgo país",
  }),
  technologicalLeakage: (modeValue, s) => ({
    fit: clamp(100 - (modeValue / 100) * s.ipSensitivity),
    situationValue: s.ipSensitivity,
    situationLabel: "Sensibilidad de IP",
  }),
  managerialComplexity: (modeValue, s) => ({
    fit: clamp(100 - (modeValue / 100) * (100 - s.managerialCapacity)),
    situationValue: 100 - s.managerialCapacity,
    situationLabel: "Déficit de capacidad directiva",
  }),
  financialReturnPotential: (modeValue) => ({
    fit: clamp(modeValue),
    situationValue: 100,
    situationLabel: "Se prefiere siempre mayor retorno potencial",
  }),
};

export function scoreEntryModes(
  situation: EntryModeSituation,
  options: { includeDigital: boolean; weights?: EntryModeWeights },
): EntryModeScore[] {
  const weights = entryModeCriteria.map((criterion) => ({
    ...criterion,
    weight: Math.max(0, options.weights?.[criterion.key] ?? criterion.defaultWeight),
  }));
  const totalWeight = weights.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;

  return entryModes
    .filter((mode) => (mode.key === "digital" ? options.includeDigital : true))
    .map((mode) => {
      const criteria = weights.map((criterion) => {
        const modeValue = mode.profile[criterion.key];
        const evaluated = evaluators[criterion.key](modeValue, situation);
        return {
          key: criterion.key,
          label: criterion.label,
          modeValue,
          situationValue: round(evaluated.situationValue),
          situationLabel: evaluated.situationLabel,
          fit: round(evaluated.fit),
          weight: criterion.weight,
          contribution: round((evaluated.fit * criterion.weight) / totalWeight),
        } satisfies EntryModeCriterionResult;
      });
      const score = Math.round(criteria.reduce((sum, criterion) => sum + (criterion.fit * criterion.weight) / totalWeight, 0));
      return {
        key: mode.key,
        mode: mode.label,
        score: clamp(score),
        commitment: mode.commitment,
        rationale: mode.rationale,
        provenance: mode.provenance,
        criteria,
      } satisfies EntryModeScore;
    })
    .sort((a, b) => b.score - a.score);
}
