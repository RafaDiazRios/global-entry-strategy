import { loc, type Localized } from "@shared/i18n";
import {
  CONFIGURATIONS,
  ConfigurationId,
  ErrcAction,
  POSITIONINGS,
  Positioning,
  PositioningInput,
  TacEntry,
  VALUE_CHAIN_FUNCTIONS,
  ValueChainLevel,
  ValueCurveAttribute,
} from "@shared/domain/globalPositioning";

/**
 * Motor del módulo 2. Nada aquí puntúa ni recomienda por su cuenta: traduce las elecciones
 * del analista a las categorías del capítulo 5 y saca a la luz las consecuencias que el
 * libro deja implícitas, sobre todo la lista de capacidades a crear, que es lo que abre la
 * decisión de build-borrow-buy del módulo 5.
 */

/* ------------------------------------------------------------------------------------ */
/* Los ocho posicionamientos                                                             */
/* ------------------------------------------------------------------------------------ */

export function resolvePositioning(input: Pick<PositioningInput, "scope" | "advantage" | "standardization">): Positioning | null {
  if (!input.scope || !input.advantage || !input.standardization) return null;
  return (
    POSITIONINGS.find(
      (option) => option.scope === input.scope && option.advantage === input.advantage && option.standardization === input.standardization
    ) ?? null
  );
}

/* ------------------------------------------------------------------------------------ */
/* Curva de valor y rejilla ERRC                                                         */
/* ------------------------------------------------------------------------------------ */

export type ErrcEntry = { attributeId: string; label: string; action: ErrcAction; from: number | null; to: number | null };

/**
 * La rejilla no se rellena a mano: se deduce comparando la curva actual con la propuesta.
 * Así no puede haber contradicción entre el dibujo y la rejilla, que es el error típico
 * cuando se llevan por separado.
 */
export function deriveErrc(attributes: ValueCurveAttribute[]): ErrcEntry[] {
  return attributes
    .map((attribute): ErrcEntry | null => {
      const { asIs, toBe } = attribute;
      if (toBe === null) return null;
      let action: ErrcAction;
      if (asIs === null) action = "create";
      else if (toBe === 0 && asIs > 0) action = "eliminate";
      else if (toBe < asIs) action = "reduce";
      else if (toBe > asIs) action = "raise";
      else action = "keep";
      return { attributeId: attribute.id, label: attribute.label, action, from: asIs, to: toBe };
    })
    .filter((entry): entry is ErrcEntry => entry !== null);
}

export type ValueCurveDiagnosis = {
  errc: ErrcEntry[];
  /** Atributos donde la curva propuesta no se separa de ningún competidor. */
  undifferentiated: string[];
  divergence: number | null;
  note: Localized | null;
};

/**
 * Divergencia: distancia media entre la curva propuesta y la del competidor más parecido,
 * en la escala 0-5. Una curva que no diverge de nadie no es una curva nueva, es la del
 * sector con otro nombre.
 */
export function diagnoseValueCurve(input: PositioningInput): ValueCurveDiagnosis {
  const errc = deriveErrc(input.valueCurve);
  const competitorIds = input.competitors.map((competitor) => competitor.id);
  const undifferentiated: string[] = [];
  let comparable = 0;
  let totalDistance = 0;

  for (const attribute of input.valueCurve) {
    const own = attribute.toBe ?? attribute.asIs;
    if (own === null) continue;
    const distances = competitorIds
      .map((id) => attribute.competitors[id])
      .filter((value): value is number => value !== null && value !== undefined)
      .map((value) => Math.abs(own - value));
    if (!distances.length) continue;
    const closest = Math.min(...distances);
    comparable += 1;
    totalDistance += closest;
    if (closest === 0) undifferentiated.push(attribute.label);
  }

  const divergence = comparable ? Number((totalDistance / comparable).toFixed(2)) : null;
  let note: Localized | null = null;
  if (!input.valueCurve.length) {
    note = loc(
      "Sin atributos de valor no hay curva que comparar.",
      "With no value attributes there is no curve to compare."
    );
  } else if (!competitorIds.length) {
    note = loc(
      "Sin competidores en la curva, la comparación es contra nada: añade al menos uno.",
      "With no competitors on the curve there is nothing to compare against: add at least one."
    );
  } else if (divergence !== null && divergence < 0.5) {
    note = loc(
      "La curva propuesta se solapa con la del competidor más cercano: no hay espacio nuevo, solo el mismo con otro nombre.",
      "The to-be curve overlaps the closest competitor's: there is no new space, only the same one under another name."
    );
  }

  return { errc, undifferentiated, divergence, note };
}

/* ------------------------------------------------------------------------------------ */
/* Configuración de la cadena de valor                                                   */
/* ------------------------------------------------------------------------------------ */

/** La dirección es un identificador, no una palabra: quien la pinta elige el idioma. */
export type ChainMoveDirection = "centralize" | "decentralize";

export type ValueChainDiagnosis = {
  currentConfiguration: ConfigurationId | null;
  targetConfiguration: ConfigurationId | null;
  /** Funciones que hay que subir o bajar de nivel para alcanzar la configuración objetivo. */
  moves: { functionId: string; label: Localized; from: ValueChainLevel; to: ValueChainLevel; direction: ChainMoveDirection }[];
  answered: number;
  total: number;
};

const LEVEL_ORDER: ValueChainLevel[] = ["local", "regional", "global"];

function dominantConfiguration(levels: (ValueChainLevel | null)[]): ConfigurationId | null {
  const present = levels.filter((level): level is ValueChainLevel => level !== null);
  if (!present.length) return null;
  const counts: Record<ValueChainLevel, number> = { global: 0, regional: 0, local: 0 };
  for (const level of present) counts[level] += 1;
  if (counts.global >= counts.regional && counts.global >= counts.local) return "global";
  if (counts.regional >= counts.local) return "regional";
  return "multinational";
}

export function diagnoseValueChain(input: PositioningInput): ValueChainDiagnosis {
  const current: (ValueChainLevel | null)[] = [];
  const target: (ValueChainLevel | null)[] = [];
  const moves: ValueChainDiagnosis["moves"] = [];

  for (const fn of VALUE_CHAIN_FUNCTIONS) {
    const cell = input.valueChain[fn.id] ?? { current: null, target: null };
    current.push(cell.current);
    target.push(cell.target);
    if (cell.current && cell.target && cell.current !== cell.target) {
      const direction: ChainMoveDirection = LEVEL_ORDER.indexOf(cell.target) > LEVEL_ORDER.indexOf(cell.current) ? "centralize" : "decentralize";
      moves.push({ functionId: fn.id, label: fn.label, from: cell.current, to: cell.target, direction });
    }
  }

  const answered = current.filter(Boolean).length;
  return {
    currentConfiguration: dominantConfiguration(current),
    targetConfiguration: dominantConfiguration(target),
    moves,
    answered,
    total: VALUE_CHAIN_FUNCTIONS.length,
  };
}

export function configurationLabel(id: ConfigurationId | null): Localized | null {
  if (!id) return null;
  return CONFIGURATIONS.find((configuration) => configuration.id === id)?.label ?? loc(id, id);
}

/* ------------------------------------------------------------------------------------ */
/* Transfer, Adapt, Create y la brecha de recursos                                       */
/* ------------------------------------------------------------------------------------ */

export type ResourceGap = {
  /** Lo que hay que construir o conseguir de un socio: entrada directa del módulo 5. */
  toCreate: TacEntry[];
  toAdapt: TacEntry[];
  transferable: TacEntry[];
  untagged: TacEntry[];
  /** Proporción de capacidades que no viajan tal cual. Cuanto mayor, más pesa la entrada. */
  creationLoad: number | null;
};

export function resourceGap(input: PositioningInput): ResourceGap {
  const tagged = input.tac.filter((entry) => entry.tag !== null);
  const toCreate = input.tac.filter((entry) => entry.tag === "create");
  const toAdapt = input.tac.filter((entry) => entry.tag === "adapt");
  const transferable = input.tac.filter((entry) => entry.tag === "transfer");
  const untagged = input.tac.filter((entry) => entry.tag === null);
  const creationLoad = tagged.length ? Number(((toCreate.length + 0.5 * toAdapt.length) / tagged.length).toFixed(3)) : null;
  return { toCreate, toAdapt, transferable, untagged, creationLoad };
}

/* ------------------------------------------------------------------------------------ */
/* Coherencia interna del módulo                                                         */
/* ------------------------------------------------------------------------------------ */

export type PositioningWarning = { id: string; severity: "block" | "warn"; message: Localized; provenance: Localized };

/**
 * Tres incoherencias que el capítulo 5 hace evidentes en cuanto se leen juntas las piezas,
 * y que en un análisis a mano se cuelan siempre.
 */
export function positioningWarnings(input: PositioningInput): PositioningWarning[] {
  const warnings: PositioningWarning[] = [];
  const positioning = resolvePositioning(input);
  const chain = diagnoseValueChain(input);

  if (positioning?.standardization === "standardized" && chain.targetConfiguration === "multinational") {
    warnings.push({
      id: "standardized_but_multilocal",
      severity: "warn",
      message: loc(
        "La propuesta de valor es estandarizada pero la cadena de valor se quiere gestionar país a país. Una posición estandarizada con liderazgo en costes pide una organización integrada, no una confederación de filiales.",
        "The value proposition is standardized but the value chain is to be run country by country. A standardized position with cost leadership calls for an integrated organization, not a confederation of subsidiaries."
      ),
      provenance: loc("p. 202", "p. 202"),
    });
  }

  if (positioning?.advantage === "cost" && chain.targetConfiguration === "multinational") {
    warnings.push({
      id: "cost_without_integration",
      severity: "warn",
      message: loc(
        "Se compite en coste con una configuración multinacional: sin integración no hay economías de escala que sostengan esa ventaja.",
        "You are competing on cost with a multinational configuration: without integration there are no economies of scale to sustain that advantage."
      ),
      provenance: loc("pp. 197-198 y p. 202", "pp. 197-198 and p. 202"),
    });
  }

  const hasHandicap = (input.liabilityOfForeignness.handicap ?? "").trim().length > 0;
  const hasCompensation = (input.liabilityOfForeignness.compensatingAdvantage ?? "").trim().length > 0;
  if (!hasHandicap || !hasCompensation) {
    warnings.push({
      id: "liability_of_foreignness",
      severity: "block",
      message: loc(
        "Falta declarar la desventaja concreta por ser extranjero en este mercado y la ventaja superior con la que se compensa. El libro lo plantea como condición, no como comentario.",
        "The concrete handicap of being foreign in this market, and the superior advantage that offsets it, are still undeclared. The book states this as a condition, not as a remark."
      ),
      provenance: loc("p. 198", "p. 198"),
    });
  }

  const advantages = input.capabilities.filter((capability) => capability.isAdvantage);
  if (advantages.length && !input.sustainability.some((entry) => (entry.how ?? "").trim().length > 0)) {
    warnings.push({
      id: "advantage_without_sustainability",
      severity: "warn",
      message: loc(
        "Hay ventajas competitivas declaradas y ninguna vía de sostenibilidad explicada. Una ventaja que se imita de inmediato no es una ventaja.",
        "Competitive advantages have been declared and no route to sustainability explained. An advantage that is imitated immediately is not an advantage."
      ),
      provenance: loc("Tabla 5.7, p. 197", "Table 5.7, p. 197"),
    });
  }

  return warnings;
}

export type PositioningCompleteness = { complete: boolean; missing: Localized[]; answered: number; total: number };

export function positioningCompleteness(input: PositioningInput): PositioningCompleteness {
  const chain = diagnoseValueChain(input);
  const checks: { label: Localized; done: boolean }[] = [
    { label: loc("Las tres dimensiones de la propuesta de valor", "The three dimensions of the value proposition"), done: Boolean(resolvePositioning(input)) },
    { label: loc("Justificación del posicionamiento elegido", "Rationale for the chosen positioning"), done: (input.positioningRationale ?? "").trim().length > 0 },
    { label: loc("Curva de valor con al menos un competidor", "Value curve with at least one competitor"), done: input.valueCurve.length > 0 && input.competitors.length > 0 },
    { label: loc("Curva propuesta, para poder derivar la rejilla ERRC", "A to-be curve, so the ERRC grid can be derived"), done: input.valueCurve.some((attribute) => attribute.toBe !== null) },
    { label: loc("Configuración actual de las seis funciones", "Current configuration of the six functions"), done: chain.answered === chain.total },
    { label: loc("Configuración objetivo", "Target configuration"), done: Boolean(chain.targetConfiguration) },
    { label: loc("Capacidades etiquetadas como ventaja competitiva", "Capabilities tagged as competitive advantage"), done: input.capabilities.some((capability) => capability.isAdvantage) },
    { label: loc("Al menos una vía de sostenibilidad explicada", "At least one route to sustainability explained"), done: input.sustainability.some((entry) => (entry.how ?? "").trim().length > 0) },
    { label: loc("Transfer-Adapt-Create sin capacidades sin etiquetar", "Transfer-Adapt-Create with no untagged capabilities"), done: input.tac.length > 0 && input.tac.every((entry) => entry.tag !== null) },
    { label: loc("Liability of foreignness y su compensación", "Liability of foreignness and how it is offset"), done: (input.liabilityOfForeignness.handicap ?? "").trim().length > 0 && (input.liabilityOfForeignness.compensatingAdvantage ?? "").trim().length > 0 },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
