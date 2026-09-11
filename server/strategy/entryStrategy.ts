import { loc, pick, type Localized } from "@shared/i18n";
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
  return cell ? { modes: cell.modes, provenance: loc("Fig. 7.3, p. 272", "Fig. 7.3, p. 272") } : null;
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
  drivers: { id: PaceFactorId; label: Localized; pushes: "faster" | "slower"; value: number }[];
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

export type EntryWarning = { id: string; severity: "block" | "warn"; message: Localized; provenance: Localized };

const HIGH_COMMITMENT: EntryModeKey[] = ["greenfield", "acquisition"];

export function phaseDefinition(phase: WindowPhaseId | null) {
  return phase ? WINDOW_PHASES.find((entry) => entry.id === phase) ?? null : null;
}

export function modeLabel(key: string | null): Localized | null {
  if (!key) return null;
  return entryModes.find((mode) => mode.key === key)?.label ?? loc(key, key);
}

export function entryStrategyWarnings(input: EntryStrategyInput): EntryWarning[] {
  const warnings: EntryWarning[] = [];
  const phase = phaseDefinition(input.phase);

  if (!input.objectives.some((objective) => objective.selected)) {
    warnings.push({
      id: "no_objective",
      severity: "block",
      message: loc(
        "Sin objetivo de entrada no hay estrategia que evaluar: el objetivo condiciona el tipo de país, el momento y el modo.",
        "Without an entry objective there is no strategy to evaluate: the objective drives the type of country, the timing and the mode."
      ),
      provenance: loc("Tabla 7.1, pp. 260-261", "Table 7.1, pp. 260-261"),
    });
  }

  if (phase && input.preferredMode && !phase.appropriateModes.includes(input.preferredMode)) {
    warnings.push({
      id: "mode_out_of_phase",
      severity: "warn",
      message: loc(
        `En fase «${pick(phase.label, "es")}» el libro no considera apropiado el modo «${pick(modeLabel(input.preferredMode), "es")}». ${pick(phase.guidance, "es")}`,
        `In the \u201c${pick(phase.label, "en")}\u201d phase the book does not consider the \u201c${pick(modeLabel(input.preferredMode), "en")}\u201d mode appropriate. ${pick(phase.guidance, "en")}`
      ),
      provenance: loc("pp. 261-262", "pp. 261-262"),
    });
  }

  if (input.phase === "premature" && input.preferredMode && HIGH_COMMITMENT.includes(input.preferredMode as EntryModeKey)) {
    warnings.push({
      id: "premature_commitment",
      severity: "warn",
      message: loc(
        "Una inversión significativa en fase prematura no genera ingresos suficientes a largo plazo: la falta de demanda no se resuelve con más capital.",
        "A significant investment in the premature phase does not generate enough long-term revenue: missing demand is not fixed with more capital."
      ),
      provenance: loc("p. 261", "p. 261"),
    });
  }

  if ((input.phase === "competitive_growth" || input.phase === "mature") && input.timingStance === "first_mover") {
    warnings.push({
      id: "first_mover_too_late",
      severity: "warn",
      message: loc(
        "No se puede ser primer entrante en una fase donde los competidores ya se han llevado esa ventaja. La posición realista es seguidor o adquirente.",
        "You cannot be a first mover in a phase where competitors have already taken that advantage. The realistic stance is follower or acquirer."
      ),
      provenance: loc("p. 262 y p. 277", "p. 262 and p. 277"),
    });
  }

  if (input.timingStance === "first_mover" && !(input.timingRationale ?? "").trim()) {
    warnings.push({
      id: "first_mover_unjustified",
      severity: "warn",
      message: loc(
        "Ser primer entrante significa asumir el riesgo de abrir el mercado para otros. Conviene justificar qué recurso se pre-empta con ello.",
        "Being a first mover means carrying the risk of opening the market for others. It is worth stating which resource that pre-empts."
      ),
      provenance: loc("Tabla 7.2, p. 262", "Table 7.2, p. 262"),
    });
  }

  const pace = paceProfile(input);
  if (pace.recommendation === "gradual" && input.preferredMode && HIGH_COMMITMENT.includes(input.preferredMode as EntryModeKey)) {
    warnings.push({
      id: "pace_against_mode",
      severity: "warn",
      message: loc(
        "Los factores de ritmo apuntan a un compromiso gradual y el modo elegido es de compromiso alto desde el primer día. O se revisa el modo, o se explica qué compensa esa prisa.",
        "The pace factors point to a gradual commitment while the chosen mode is a high commitment from day one. Either revisit the mode, or explain what makes that haste worth it."
      ),
      provenance: loc("p. 262", "p. 262"),
    });
  }

  const shortlist = mappingShortlist(input.marketAttractiveness, input.politicalClimate);
  if (shortlist && input.preferredMode) {
    const label = modeLabel(input.preferredMode);
    // La comparación se hace siempre en español: es el idioma en que están escritas las raíces.
    const compatible = shortlist.modes.some((mode) => similar(pick(mode, "es"), pick(label, "es")));
    if (!compatible) {
      warnings.push({
        id: "mode_off_mapping",
        severity: "warn",
        message: loc(
          `Con ese atractivo de mercado y ese clima de inversión, el mapa apunta a: ${shortlist.modes.map((mode) => pick(mode, "es")).join(", ")}. El modo elegido queda fuera y conviene decir por qué.`,
          `With that market attractiveness and that investment climate, the map points to: ${shortlist.modes.map((mode) => pick(mode, "en")).join(", ")}. The chosen mode falls outside it, and it is worth saying why.`
        ),
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

export type EntryCompleteness = { complete: boolean; missing: Localized[]; answered: number; total: number };

export function entryStrategyCompleteness(input: EntryStrategyInput): EntryCompleteness {
  const pace = paceProfile(input);
  const checks: { label: Localized; done: boolean }[] = [
    { label: loc("País al que se refiere la estrategia", "The country the strategy refers to"), done: Boolean(input.countryCode) },
    { label: loc("Al menos un objetivo de entrada, justificado", "At least one entry objective, justified"), done: input.objectives.some((objective) => objective.selected && (objective.justification ?? "").trim().length > 0) },
    { label: loc("Fase de la ventana, con la evidencia que la sostiene", "The window phase, with the evidence behind it"), done: Boolean(input.phase) && (input.phaseEvidence ?? "").trim().length > 0 },
    { label: loc("Posición ante el momento: primer entrante, seguidor o adquirente", "Timing stance: first mover, follower or acquirer"), done: Boolean(input.timingStance) },
    { label: loc("Los seis factores de ritmo", "The six pace factors"), done: pace.answered === pace.total },
    { label: loc("Atractivo de mercado y clima político para el mapa de modos", "Market attractiveness and political climate for the mode map"), done: Boolean(input.marketAttractiveness && input.politicalClimate) },
    { label: loc("Modo preferido con su razón", "Preferred mode with its rationale"), done: Boolean(input.preferredMode) && (input.modeRationale ?? "").trim().length > 0 },
    { label: loc("Requisitos del gobierno que condicionan el modo", "Government requirements that constrain the mode"), done: (input.governmentRequirements ?? "").trim().length > 0 },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
