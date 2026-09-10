import { entryModes, type EntryModeKey } from "@shared/domain/entryModes";
import {
  Band,
  ClimateBand,
  EntryStrategyInput,
  MODE_MAPPING,
  PACE_FACTORS,
  PaceFactorId,
  WINDOW_PHASES,
  WindowPhaseId,
} from "@shared/domain/entryStrategy";

/**
 * Motor del capítulo 7, primera parte.
 *
 * No elige el modo: el modo lo elige el analista. Lo que hace es enfrentar esa elección con
 * lo que el capítulo dice de la fase de la ventana y del mapa de la Fig. 7.3, y señalar las
 * contradicciones. Un aviso siempre lleva la página de la que sale.
 */

/* ------------------------------------------------------------------------------------ */
/* Modos apropiados según el mapa de la Fig. 7.3                                         */
/* ------------------------------------------------------------------------------------ */

export function mappingShortlist(attractiveness: Band | null, climate: ClimateBand | null) {
  if (!attractiveness || !climate) return null;
  const cell = MODE_MAPPING.find((entry) => entry.attractiveness === attractiveness && entry.climate === climate);
  return cell ? { modes: cell.modes, provenance: "Fig. 7.3, p. 272" } : null;
}

/* ------------------------------------------------------------------------------------ */
/* Ritmo de entrada                                                                      */
/* ------------------------------------------------------------------------------------ */

export type PaceProfile = {
  /** 0 = compromiso gradual; 1 = compromiso rápido. Null si no hay factores contestados. */
  index: number | null;
  answered: number;
  total: number;
  recommendation: "gradual" | "equilibrado" | "rapido" | null;
  drivers: { id: PaceFactorId; label: string; pushes: "faster" | "slower"; value: number }[];
};

/**
 * El ritmo no sale de una fórmula del libro: el libro enumera seis factores y advierte de
 * que entrar deprisa en muchos países a la vez perjudica (p. 262, caso de Whirlpool). Aquí
 * se promedian esos seis factores según la dirección en que empuja cada uno, y el resultado
 * se presenta como lo que es, una síntesis de los factores contestados.
 */
export function paceProfile(input: EntryStrategyInput): PaceProfile {
  const drivers: PaceProfile["drivers"] = [];
  let sum = 0;
  let answered = 0;

  for (const factor of PACE_FACTORS) {
    const value = input.paceFactors[factor.id];
    if (value === null || value === undefined) continue;
    answered += 1;
    const normalized = Math.min(4, Math.max(0, value)) / 4;
    sum += factor.direction === "faster" ? normalized : 1 - normalized;
    drivers.push({ id: factor.id, label: factor.label, pushes: factor.direction, value });
  }

  if (!answered) return { index: null, answered: 0, total: PACE_FACTORS.length, recommendation: null, drivers };

  const index = Number((sum / answered).toFixed(3));
  const recommendation = index < 0.4 ? "gradual" : index > 0.6 ? "rapido" : "equilibrado";
  return { index, answered, total: PACE_FACTORS.length, recommendation, drivers };
}

/* ------------------------------------------------------------------------------------ */
/* Coherencia                                                                            */
/* ------------------------------------------------------------------------------------ */

export type EntryWarning = { id: string; severity: "block" | "warn"; message: string; provenance: string };

const HIGH_COMMITMENT: EntryModeKey[] = ["greenfield", "acquisition"];

export function phaseDefinition(phase: WindowPhaseId | null) {
  return phase ? WINDOW_PHASES.find((entry) => entry.id === phase) ?? null : null;
}

export function modeLabel(key: string | null) {
  return key ? entryModes.find((mode) => mode.key === key)?.label ?? key : null;
}

export function entryStrategyWarnings(input: EntryStrategyInput): EntryWarning[] {
  const warnings: EntryWarning[] = [];
  const phase = phaseDefinition(input.phase);

  if (!input.objectives.some((objective) => objective.selected)) {
    warnings.push({
      id: "no_objective",
      severity: "block",
      message: "Sin objetivo de entrada no hay estrategia que evaluar: el objetivo condiciona el tipo de país, el momento y el modo.",
      provenance: "Tabla 7.1, pp. 260-261",
    });
  }

  if (phase && input.preferredMode && !phase.appropriateModes.includes(input.preferredMode)) {
    warnings.push({
      id: "mode_out_of_phase",
      severity: "warn",
      message: `En fase «${phase.label}» el libro no considera apropiado el modo «${modeLabel(input.preferredMode)}». ${phase.guidance}`,
      provenance: "pp. 261-262",
    });
  }

  if (input.phase === "premature" && input.preferredMode && HIGH_COMMITMENT.includes(input.preferredMode as EntryModeKey)) {
    warnings.push({
      id: "premature_commitment",
      severity: "warn",
      message: "Una inversión significativa en fase prematura no genera ingresos suficientes a largo plazo: la falta de demanda no se resuelve con más capital.",
      provenance: "p. 261",
    });
  }

  if ((input.phase === "competitive_growth" || input.phase === "mature") && input.timingStance === "first_mover") {
    warnings.push({
      id: "first_mover_too_late",
      severity: "warn",
      message: "No se puede ser primer entrante en una fase donde los competidores ya se han llevado esa ventaja. La posición realista es seguidor o adquirente.",
      provenance: "p. 262 y p. 277",
    });
  }

  if (input.timingStance === "first_mover" && !(input.timingRationale ?? "").trim()) {
    warnings.push({
      id: "first_mover_unjustified",
      severity: "warn",
      message: "Ser primer entrante significa asumir el riesgo de abrir el mercado para otros. Conviene justificar qué recurso se pre-empta con ello.",
      provenance: "Tabla 7.2, p. 262",
    });
  }

  const pace = paceProfile(input);
  if (pace.recommendation === "gradual" && input.preferredMode && HIGH_COMMITMENT.includes(input.preferredMode as EntryModeKey)) {
    warnings.push({
      id: "pace_against_mode",
      severity: "warn",
      message: "Los factores de ritmo apuntan a un compromiso gradual y el modo elegido es de compromiso alto desde el primer día. O se revisa el modo, o se explica qué compensa esa prisa.",
      provenance: "p. 262",
    });
  }

  const shortlist = mappingShortlist(input.marketAttractiveness, input.politicalClimate);
  if (shortlist && input.preferredMode) {
    const label = modeLabel(input.preferredMode) ?? "";
    const compatible = shortlist.modes.some((mode) => similar(mode, label));
    if (!compatible) {
      warnings.push({
        id: "mode_off_mapping",
        severity: "warn",
        message: `Con ese atractivo de mercado y ese clima de inversión, el mapa apunta a: ${shortlist.modes.join(", ")}. El modo elegido queda fuera y conviene decir por qué.`,
        provenance: shortlist.provenance,
      });
    }
  }

  return warnings;
}

/** Comparación laxa: el mapa nombra los modos en prosa y el catálogo con etiquetas propias. */
function similar(a: string, b: string) {
  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const left = normalize(a);
  const right = normalize(b);
  const roots = ["filial", "adquisic", "conjunta", "licenc", "distribuidor", "agente", "oficina", "represent", "export", "franquic", "empresa conjunta"];
  return roots.some((root) => left.includes(root) && right.includes(root));
}

/* ------------------------------------------------------------------------------------ */
/* Exhaustividad                                                                         */
/* ------------------------------------------------------------------------------------ */

export type EntryCompleteness = { complete: boolean; missing: string[]; answered: number; total: number };

export function entryStrategyCompleteness(input: EntryStrategyInput): EntryCompleteness {
  const pace = paceProfile(input);
  const checks: { label: string; done: boolean }[] = [
    { label: "País al que se refiere la estrategia", done: Boolean(input.countryCode) },
    { label: "Al menos un objetivo de entrada, justificado", done: input.objectives.some((objective) => objective.selected && (objective.justification ?? "").trim().length > 0) },
    { label: "Fase de la ventana, con la evidencia que la sostiene", done: Boolean(input.phase) && (input.phaseEvidence ?? "").trim().length > 0 },
    { label: "Posición ante el momento: primer entrante, seguidor o adquirente", done: Boolean(input.timingStance) },
    { label: "Los seis factores de ritmo", done: pace.answered === pace.total },
    { label: "Atractivo de mercado y clima político para el mapa de modos", done: Boolean(input.marketAttractiveness && input.politicalClimate) },
    { label: "Modo preferido con su razón", done: Boolean(input.preferredMode) && (input.modeRationale ?? "").trim().length > 0 },
    { label: "Requisitos del gobierno que condicionan el modo", done: (input.governmentRequirements ?? "").trim().length > 0 },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
