import { loc, pick, type Localized } from "@shared/i18n";
import {
  ASSUMPTION_RULES,
  emptyAnswer,
  type AssumptionAnswer,
  type AssumptionSlot,
  type Consequence,
} from "@shared/domain/assumptionMap";
import { type Approver, type ApproverTest, type ModelArea } from "@shared/domain/approvalChain";
import { resolveChain, sectorMode } from "@shared/domain/industries";
import { PRESENCE_SUPPRESSES_COUNTRY_BLOCKS, thesisIsStated, type ThesisInput } from "@shared/domain/thesis";
import type { CoherenceFinding, ModuleKey } from "@shared/domain/coherence";

/**
 * Motor del modo trabajo.
 *
 * Tres cosas, y ninguna de ellas puntúa nada:
 *
 * 1. Deriva de la tesis los supuestos de los que depende.
 * 2. Los enfrenta a la cadena de aprobación y dice qué veto los tumba.
 * 3. Declara qué queda fuera de alcance y por qué, para que nada se esconda en silencio.
 *
 * Lo que el motor no hace es decidir si un supuesto es cierto. Eso lo declara quien analiza.
 * La herramienta solo exige que diga qué lo falsaría.
 */

/* ------------------------------------------------------------------------------------ */
/* Derivación                                                                            */
/* ------------------------------------------------------------------------------------ */

export function deriveAssumptions(thesis: ThesisInput): AssumptionSlot[] {
  if (!thesisIsStated(thesis)) return [];
  return ASSUMPTION_RULES.filter((rule) => rule.when(thesis)).map((rule) => rule.slot);
}

export type ResolvedAssumption = {
  slot: AssumptionSlot;
  answer: AssumptionAnswer;
  /** Contestado significa creencia declarada y falsador escrito. Sin falsador es una apuesta. */
  answered: boolean;
};

export function resolveAssumptions(thesis: ThesisInput, answers: AssumptionAnswer[]): ResolvedAssumption[] {
  return deriveAssumptions(thesis).map((slot) => {
    const answer = answers.find((entry) => entry.slotId === slot.id) ?? emptyAnswer(slot.id);
    const answered = answer.belief !== "unknown" && Boolean((answer.falsifier ?? "").trim());
    return { slot, answer, answered };
  });
}

/* ------------------------------------------------------------------------------------ */
/* Vetos                                                                                 */
/* ------------------------------------------------------------------------------------ */

export type VetoStatus = "fails" | "at_risk" | "clear" | "not_tested";

export type ApproverVerdict = {
  approver: Approver;
  status: VetoStatus;
  /** Los supuestos que contestan a la prueba de este aprobador. */
  assumptions: ResolvedAssumption[];
  /** Los que lo hacen fallar o lo ponen en riesgo. */
  offending: ResolvedAssumption[];
};

const LOW_CONFIDENCE = 1;

function statusFor(assumptions: ResolvedAssumption[]): { status: VetoStatus; offending: ResolvedAssumption[] } {
  if (!assumptions.length) return { status: "not_tested", offending: [] };

  const broken = assumptions.filter((entry) => entry.answer.belief === "does_not_hold");
  if (broken.length) return { status: "fails", offending: broken };

  // Un supuesto que mata la tesis y sigue sin averiguar no es un aprobado: es una bomba.
  const shaky = assumptions.filter(
    (entry) =>
      entry.slot.consequence === "dies" &&
      (!entry.answered || (entry.answer.confidence !== null && entry.answer.confidence <= LOW_CONFIDENCE)),
  );
  if (shaky.length) return { status: "at_risk", offending: shaky };

  return { status: "clear", offending: [] };
}

export function evaluateChain(thesis: ThesisInput, answers: AssumptionAnswer[]): ApproverVerdict[] {
  const chain = resolveChain(thesis.industryId);
  const resolved = resolveAssumptions(thesis, answers);
  return chain.map((approver) => {
    const assumptions = resolved.filter((entry) => entry.slot.test === approver.test);
    const { status, offending } = statusFor(assumptions);
    return { approver, status, assumptions, offending };
  });
}

/**
 * Los supuestos se parten en dos niveles, y la distinción no es cosmética: un supuesto que
 * mira un veto puede parar la tesis, y uno que solo mira un asesor la moldea. La lista corta
 * —la que se lleva a la reunión— es la primera.
 */
export function splitByAuthority(thesis: ThesisInput, answers: AssumptionAnswer[]) {
  const chain = resolveChain(thesis.industryId);
  const owners = new Map(chain.map((approver) => [approver.test, approver.authority]));
  const resolved = resolveAssumptions(thesis, answers);
  const isCritical = (test: ApproverTest) => {
    const authority = owners.get(test);
    return authority === "veto" || authority === "decides";
  };
  return {
    critical: resolved.filter((entry) => isCritical(entry.slot.test)),
    shaping: resolved.filter((entry) => !isCritical(entry.slot.test)),
  };
}

/**
 * Supuestos cuya prueba no tiene dueño en esta cadena. No es un error del modelo: es un hueco
 * de gobierno, y merece decirse.
 */
export function unownedAssumptions(thesis: ThesisInput, answers: AssumptionAnswer[]): ResolvedAssumption[] {
  const tests = new Set<ApproverTest>(resolveChain(thesis.industryId).map((approver) => approver.test));
  return resolveAssumptions(thesis, answers).filter((entry) => !tests.has(entry.slot.test));
}

/* ------------------------------------------------------------------------------------ */
/* Lo que queda fuera de alcance                                                         */
/* ------------------------------------------------------------------------------------ */

export type ScopeExclusion = { area: ModelArea; reason: Localized };

/**
 * Nada se esconde en silencio. Si la tesis no depende de un bloque, el bloque se declara fuera
 * de alcance con su motivo, que es lo contrario de dejarlo a medias sin decirlo.
 */
export function outOfScope(thesis: ThesisInput): ScopeExclusion[] {
  const exclusions: ScopeExclusion[] = [];

  if (thesis.entryKind === "product" || PRESENCE_SUPPRESSES_COUNTRY_BLOCKS.includes(thesis.presence ?? "none")) {
    exclusions.push({
      area: "assessment",
      reason: loc(
        "El grupo ya opera en el país: el riesgo país, la distancia CAGE y la legitimidad ya están pagados y no se vuelven a litigar.",
        "The group already operates in the country: country risk, CAGE distance and legitimacy are already paid for and are not re-litigated."
      ),
    });
  }

  if (thesis.modeKey && sectorMode(thesis.industryId, thesis.modeKey)?.requiresPartner === false) {
    exclusions.push({
      area: "partnering",
      reason: loc(
        "El modo elegido no exige socio: el análisis de encaje no aplica mientras no cambie.",
        "The chosen mode requires no partner: the fit analysis does not apply unless that changes."
      ),
    });
  }

  return exclusions;
}

/* ------------------------------------------------------------------------------------ */
/* El veredicto                                                                          */
/* ------------------------------------------------------------------------------------ */

export type ThesisStatus = "blocked" | "at_risk" | "clear" | "not_stated";

export type KillPair = {
  assumption: ResolvedAssumption;
  approver: Approver;
  consequence: Consequence;
};

export type ThesisVerdict = {
  status: ThesisStatus;
  /** «Qué supuesto, si es falso, hace que quién te lo tumbe». */
  killPairs: KillPair[];
  verdicts: ApproverVerdict[];
  unowned: ResolvedAssumption[];
  exclusions: ScopeExclusion[];
  /** Los que puede parar un veto: la lista que se lleva a la reunión. */
  critical: ResolvedAssumption[];
  /** Los que moldean la tesis pero no la paran. */
  shaping: ResolvedAssumption[];
  /** Supuestos que matan la tesis y siguen sin contestar. */
  openCriticalCount: number;
  headline: Localized;
};

export function evaluateThesis(thesis: ThesisInput, answers: AssumptionAnswer[]): ThesisVerdict {
  const verdicts = evaluateChain(thesis, answers);
  const resolved = resolveAssumptions(thesis, answers);
  const exclusions = outOfScope(thesis);
  const unowned = unownedAssumptions(thesis, answers);
  const { critical, shaping } = splitByAuthority(thesis, answers);

  if (!thesisIsStated(thesis)) {
    return {
      status: "not_stated",
      killPairs: [],
      verdicts,
      unowned,
      exclusions,
      critical,
      shaping,
      openCriticalCount: 0,
      headline: loc(
        "Falta enunciar la tesis: posición, país, tipo de entrada y al menos una razón.",
        "The thesis is not stated yet: stance, country, kind of entry and at least one reason."
      ),
    };
  }

  // Solo los vetos matan. Un asesor en rojo cambia la tesis, no la para.
  const blocking = verdicts.filter((verdict) => verdict.approver.authority === "veto" && verdict.status === "fails");
  const shaky = verdicts.filter((verdict) => verdict.approver.authority === "veto" && verdict.status === "at_risk");

  const killPairs: KillPair[] = verdicts
    .filter((verdict) => verdict.approver.authority === "veto")
    .flatMap((verdict) =>
      verdict.offending.map((assumption) => ({
        assumption,
        approver: verdict.approver,
        consequence: assumption.slot.consequence,
      })),
    );

  const openCriticalCount = critical.filter((entry) => entry.slot.consequence === "dies" && !entry.answered).length;

  let headline: Localized;
  if (blocking.length) {
    const roles = blocking.map((verdict) => verdict.approver.role);
    headline = loc(
      `La tesis no llega a la mesa: la tumban ${roles.map((role) => pick(role, "es")).join(", ")}.`,
      `The thesis does not reach the table: it is blocked by ${roles.map((role) => pick(role, "en")).join(", ")}.`
    );
  } else if (shaky.length) {
    const roles = shaky.map((verdict) => verdict.approver.role);
    headline = loc(
      `Nada la tumba todavía, pero ${roles.map((role) => pick(role, "es")).join(", ")} no puede aprobarla con lo que hay: ${openCriticalCount} supuesto(s) crítico(s) sin averiguar.`,
      `Nothing blocks it yet, but ${roles.map((role) => pick(role, "en")).join(", ")} cannot approve it on what is here: ${openCriticalCount} critical assumption(s) still unestablished.`
    );
  } else {
    headline = loc(
      "Ningún veto la para con lo declarado. Queda defenderla ante quien decide.",
      "No veto stops it on what has been declared. What remains is defending it before whoever decides."
    );
  }

  return {
    status: blocking.length ? "blocked" : shaky.length ? "at_risk" : "clear",
    killPairs,
    verdicts,
    unowned,
    exclusions,
    critical,
    shaping,
    openCriticalCount,
    headline,
  };
}

/* ------------------------------------------------------------------------------------ */
/* El motor de coherencia, al revés                                                      */
/* ------------------------------------------------------------------------------------ */

/**
 * El riesgo de trabajar desde una tesis es que solo miras donde apunta la hipótesis, y así
 * cualquier tesis mala se confirma sola. El antídoto es correr la comprobación al revés: en
 * lugar de decir «llevas el 62%», decir qué señala el marco que la tesis no menciona.
 */
export type BlindSpot = {
  id: string;
  severity: "block" | "warn";
  title: Localized;
  detail: Localized;
};

const MODULE_TO_AREA: Record<ModuleKey, ModelArea> = {
  ambition: "ambition",
  positioning: "positioning",
  entry: "entry",
  partnering: "partnering",
};

export function blindSpots(
  thesis: ThesisInput,
  answers: AssumptionAnswer[],
  findings: CoherenceFinding[] = [],
): BlindSpot[] {
  if (!thesisIsStated(thesis)) return [];

  const spots: BlindSpot[] = [];
  const resolved = resolveAssumptions(thesis, answers);
  const exclusions = outOfScope(thesis);
  const excluded = new Set(exclusions.map((exclusion) => exclusion.area));
  const covered = new Set(resolved.map((entry) => entry.slot.area));

  // 1. Un supuesto que mata la tesis y sigue sin averiguar.
  const unestablished = resolved.filter((entry) => entry.slot.consequence === "dies" && !entry.answered);
  if (unestablished.length) {
    spots.push({
      id: "critical_unestablished",
      severity: "block",
      title: loc("Supuestos mortales sin averiguar", "Fatal assumptions not yet established"),
      detail: loc(
        `${unestablished.length} supuesto(s) pueden matar la tesis y todavía no tienen creencia declarada con su falsador. Mientras sigan así, la tesis no se puede defender: solo se puede repetir.`,
        `${unestablished.length} assumption(s) can kill the thesis and still have no stated belief with a falsifier. While that holds, the thesis cannot be defended: it can only be repeated.`
      ),
    });
  }

  // 2. Declarado como cierto sin nada detrás. Es lo que separa una creencia de una apuesta.
  const unevidenced = resolved.filter(
    (entry) => entry.answer.belief === "holds" && !(entry.answer.evidence ?? "").trim(),
  );
  if (unevidenced.length) {
    spots.push({
      id: "held_without_evidence",
      severity: "warn",
      title: loc("Supuestos que se dan por ciertos sin evidencia", "Assumptions taken as true with no evidence"),
      detail: loc(
        `${unevidenced.length} supuesto(s) se declaran sostenidos sin una sola fuente. En la sala, esa es la pregunta que llega primero.`,
        `${unevidenced.length} assumption(s) are declared to hold without a single source. In the room, that is the first question you get.`
      ),
    });
  }

  // 3. Algo que se declaró fuera de alcance y que un supuesto mortal sigue mirando.
  for (const entry of resolved) {
    if (entry.slot.consequence !== "dies" || !excluded.has(entry.slot.area)) continue;
    spots.push({
      id: `excluded_but_load_bearing_${entry.slot.id}`,
      severity: "block",
      title: loc("Fuera de alcance y sosteniendo la tesis a la vez", "Out of scope and load-bearing at the same time"),
      detail: loc(
        `«${pick(entry.slot.claim, "es")}» puede matar la tesis, y su bloque se ha declarado fuera de alcance. Una de las dos cosas está mal.`,
        `“${pick(entry.slot.claim, "en")}” can kill the thesis, and its block has been declared out of scope. One of the two is wrong.`
      ),
    });
  }

  // 4. Lo que el marco señala en un módulo que la tesis nunca toca.
  for (const finding of findings) {
    const areas = finding.modules.map((module) => MODULE_TO_AREA[module]);
    if (areas.some((area) => covered.has(area))) continue;
    spots.push({
      id: `framework_unmentioned_${finding.id}`,
      severity: finding.severity === "block" ? "block" : "warn",
      title: loc(
        `El marco lo señala y la tesis no lo menciona: ${pick(finding.title, "es").toLowerCase()}`,
        `The framework flags it and the thesis does not mention it: ${pick(finding.title, "en").toLowerCase()}`
      ),
      detail: finding.detail,
    });
  }

  return spots;
}
