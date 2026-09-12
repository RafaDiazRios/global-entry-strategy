/**
 * El memo de decisión.
 *
 * La salida de una página que alguien lee diez minutos antes del comité. No es un resumen
 * del análisis: es lo que hay que decidir, lo que lo mata, y lo que todavía no se sabe.
 *
 * Tres decisiones sobre su forma, y las tres son sobre qué NO lleva.
 *
 * No lleva puntuaciones. Un 68/100 no ayuda a decidir nada y sí invita a discutir la
 * ponderación en lugar del negocio. Lo que lleva son afirmaciones con dueño.
 *
 * No lleva recomendación de la herramienta. La recomendación la firma una persona; la
 * herramienta dice de qué depende esa firma y quién puede tumbarla.
 *
 * Y no se calla los huecos. Un memo que dice «esto no lo sé todavía, y lo pregunta finanzas»
 * es más útil que ningún memo, y bastante más honesto que uno que rellena el hueco. Por eso
 * se genera siempre: negarse a generarlo empujaría a rellenar cualquier cosa para desbloquear
 * el botón, y entonces el documento mentiría en vez de callar.
 *
 * El memo se construye aquí, en un solo sitio, y lo pintan dos superficies: la pantalla y el
 * PDF. Si cada una lo compusiera por su cuenta, acabarían diciendo cosas distintas.
 */

import { loc, pick, type Lang, type Localized } from "../i18n";

/* ------------------------------------------------------------------------------------ */
/* Lo que entra                                                                          */
/* ------------------------------------------------------------------------------------ */

export type MemoAssumption = {
  claim: Localized;
  /** Quién lo tumba, ya resuelto a un nombre de papel. */
  owner: Localized | null;
  belief: "holds" | "does_not_hold" | "unknown";
  confidence: number | null;
  evidence: string | null;
  falsifier: string | null;
};

export type MemoInput = {
  company: string | null;
  countryName: string | null;
  product: string | null;
  /** Posición: entrar, no entrar, esperar. Resuelta a texto por quien llama. */
  stance: Localized | null;
  entryKind: Localized | null;
  mode: Localized | null;
  horizonMonths: number | null;
  commitment: { amount: number | null; currency: string | null };
  reasons: string[];
  returnThresholdPct: number | null;

  status: "blocked" | "at_risk" | "clear" | "not_stated";
  headline: Localized;
  /** Los pares supuesto-veto: el corazón del memo. */
  killPairs: { claim: Localized; owner: Localized; falsifier: string | null }[];
  /** Críticos sin contestar, que son los huecos que importan. */
  openCritical: MemoAssumption[];
  /** Críticos contestados, que son el argumento. */
  answeredCritical: MemoAssumption[];
  blindSpots: { severity: "block" | "warn"; title: Localized; detail: Localized }[];
  exclusions: { reason: Localized }[];

  /** Lo que dicen los números, si hay caso económico. */
  economics: Localized | null;
  /** Lo que dice el mercado, si hay mapa de competidores. */
  market: Localized[];
  generatedAt: string;
};

/* ------------------------------------------------------------------------------------ */
/* Lo que sale                                                                           */
/* ------------------------------------------------------------------------------------ */

export type MemoLine = {
  /** Texto principal de la línea. */
  text: string;
  /** Quién responde, cuando la línea tiene dueño. */
  owner?: string;
  /** Segunda línea, más pequeña: el falsador, la evidencia, el detalle. */
  detail?: string;
  tone?: "normal" | "alert";
};

export type MemoSection = {
  id: string;
  title: string;
  /** Cuando la sección está vacía se dice por qué, en lugar de desaparecer. */
  emptyNote?: string;
  lines: MemoLine[];
};

export type DecisionMemo = {
  title: string;
  subtitle: string;
  statusLabel: string;
  headline: string;
  sections: MemoSection[];
  footer: string;
};

/* ------------------------------------------------------------------------------------ */
/* Texto propio del memo                                                                 */
/* ------------------------------------------------------------------------------------ */

/** Se exporta para que el recorrido bilingüe lo cubra como a cualquier otra tabla. */
export const MEMO_TEXT = {
  title: loc("Memo de decisión", "Decision memo"),
  thesis: loc("La tesis", "The thesis"),
  whatKillsIt: loc("Lo que la mata", "What kills it"),
  whatKillsItEmpty: loc(
    "Ningún veto la para con lo declarado. Queda defenderla ante quien decide.",
    "No veto stops it on what has been declared. It remains to defend it before whoever decides."
  ),
  answered: loc("Lo que sostiene el argumento", "What the argument rests on"),
  answeredEmpty: loc(
    "Todavía no hay ningún supuesto crítico contestado con creencia y falsador.",
    "No critical assumption has been answered yet with a belief and a falsifier."
  ),
  open: loc("Lo que no está contestado", "What is not answered"),
  openEmpty: loc("Todos los supuestos críticos están contestados.", "Every critical assumption is answered."),
  numbers: loc("Lo que dicen los números", "What the numbers say"),
  numbersEmpty: loc(
    "No hay caso económico calculado para este mercado.",
    "There is no computed economic case for this market."
  ),
  market: loc("Lo que dice el mercado", "What the market says"),
  marketEmpty: loc(
    "No hay mapa de competidores declarado para este mercado.",
    "There is no competitor map declared for this market."
  ),
  blindSpots: loc("Puntos ciegos", "Blind spots"),
  blindSpotsEmpty: loc("Ninguno detectado.", "None detected."),
  scope: loc("Fuera de alcance, y por qué", "Out of scope, and why"),
  scopeEmpty: loc("Nada queda fuera de alcance.", "Nothing is out of scope."),
  statusBlocked: loc("Un veto la para", "A veto stops it"),
  statusAtRisk: loc("En riesgo", "At risk"),
  statusClear: loc("Sin veto en contra", "No veto against it"),
  statusNotStated: loc("Tesis sin enunciar", "Thesis not stated"),
  falsifier: loc("La falsa", "Falsified by"),
  noFalsifier: loc("sin falsador escrito", "no falsifier written"),
  evidence: loc("Evidencia", "Evidence"),
  noEvidence: loc("sin evidencia registrada", "no evidence recorded"),
  believesHolds: loc("se sostiene", "holds"),
  believesNot: loc("no se sostiene", "does not hold"),
  believesUnknown: loc("sin declarar", "not declared"),
  confidence: loc("confianza", "confidence"),
  months: loc("meses", "months"),
  threshold: loc("umbral de retorno", "return threshold"),
  because: loc("Porque", "Because"),
  owner: loc("Responde", "Answers"),
  footer: loc(
    "Documento de apoyo a decisión. No autoriza gasto ni compromete a la compañía: la decisión formal sigue las políticas corporativas aplicables.",
    "A document to support a decision. It authorises no spending and commits the company to nothing: the formal decision follows the applicable corporate policies."
  ),
  generated: loc("Generado", "Generated"),
} as const;

function beliefLabel(belief: MemoAssumption["belief"], lang: Lang) {
  if (belief === "holds") return pick(MEMO_TEXT.believesHolds, lang);
  if (belief === "does_not_hold") return pick(MEMO_TEXT.believesNot, lang);
  return pick(MEMO_TEXT.believesUnknown, lang);
}

/* ------------------------------------------------------------------------------------ */
/* Construcción                                                                          */
/* ------------------------------------------------------------------------------------ */

/** La tesis en una frase, que es lo primero que se lee y a veces lo único. */
function thesisSentence(input: MemoInput, lang: Lang): string {
  const parts: string[] = [];
  if (input.stance) parts.push(pick(input.stance, lang));
  if (input.countryName) parts.push(input.countryName);
  if (input.product) parts.push(`· ${input.product}`);
  if (input.mode) parts.push(`· ${pick(input.mode, lang)}`);
  if (input.horizonMonths !== null) parts.push(`· ${input.horizonMonths} ${pick(MEMO_TEXT.months, lang)}`);
  if (input.commitment.amount !== null) {
    const amount = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 0 }).format(input.commitment.amount);
    parts.push(`· ${amount}${input.commitment.currency ? ` ${input.commitment.currency}` : ""}`);
  }
  if (input.returnThresholdPct !== null) parts.push(`· ${pick(MEMO_TEXT.threshold, lang)} ${input.returnThresholdPct}%`);
  return parts.join(" ");
}

function assumptionLine(assumption: MemoAssumption, lang: Lang): MemoLine {
  const belief = beliefLabel(assumption.belief, lang);
  const confidence = assumption.confidence === null ? "" : ` · ${pick(MEMO_TEXT.confidence, lang)} ${assumption.confidence}/4`;
  const falsifier = (assumption.falsifier ?? "").trim();
  const evidence = (assumption.evidence ?? "").trim();
  const detailParts = [
    falsifier ? `${pick(MEMO_TEXT.falsifier, lang)}: ${falsifier}` : pick(MEMO_TEXT.noFalsifier, lang),
    evidence ? `${pick(MEMO_TEXT.evidence, lang)}: ${evidence}` : pick(MEMO_TEXT.noEvidence, lang),
  ];
  return {
    text: pick(assumption.claim, lang),
    owner: assumption.owner ? pick(assumption.owner, lang) : undefined,
    detail: `${belief}${confidence} · ${detailParts.join(" · ")}`,
    tone: assumption.belief === "unknown" || !falsifier ? "alert" : "normal",
  };
}

export function buildDecisionMemo(input: MemoInput, lang: Lang): DecisionMemo {
  const statusLabel = pick(
    input.status === "blocked" ? MEMO_TEXT.statusBlocked
      : input.status === "at_risk" ? MEMO_TEXT.statusAtRisk
      : input.status === "clear" ? MEMO_TEXT.statusClear
      : MEMO_TEXT.statusNotStated,
    lang,
  );

  const sections: MemoSection[] = [
    {
      id: "thesis",
      title: pick(MEMO_TEXT.thesis, lang),
      lines: [
        { text: thesisSentence(input, lang) },
        ...input.reasons.filter((reason) => reason.trim()).map((reason, index) => ({
          text: `${index === 0 ? `${pick(MEMO_TEXT.because, lang)}: ` : ""}${reason}`,
        })),
      ],
    },
    {
      id: "kills",
      title: pick(MEMO_TEXT.whatKillsIt, lang),
      emptyNote: pick(MEMO_TEXT.whatKillsItEmpty, lang),
      lines: input.killPairs.map((pair) => ({
        text: pick(pair.claim, lang),
        owner: pick(pair.owner, lang),
        detail: (pair.falsifier ?? "").trim()
          ? `${pick(MEMO_TEXT.falsifier, lang)}: ${pair.falsifier!.trim()}`
          : pick(MEMO_TEXT.noFalsifier, lang),
        tone: "alert" as const,
      })),
    },
    {
      id: "open",
      title: pick(MEMO_TEXT.open, lang),
      emptyNote: pick(MEMO_TEXT.openEmpty, lang),
      lines: input.openCritical.map((assumption) => assumptionLine(assumption, lang)),
    },
    {
      id: "answered",
      title: pick(MEMO_TEXT.answered, lang),
      emptyNote: pick(MEMO_TEXT.answeredEmpty, lang),
      lines: input.answeredCritical.map((assumption) => assumptionLine(assumption, lang)),
    },
    {
      id: "numbers",
      title: pick(MEMO_TEXT.numbers, lang),
      emptyNote: pick(MEMO_TEXT.numbersEmpty, lang),
      lines: input.economics ? [{ text: pick(input.economics, lang) }] : [],
    },
    {
      id: "market",
      title: pick(MEMO_TEXT.market, lang),
      emptyNote: pick(MEMO_TEXT.marketEmpty, lang),
      lines: input.market.map((entry) => ({ text: pick(entry, lang) })),
    },
    {
      id: "blind",
      title: pick(MEMO_TEXT.blindSpots, lang),
      emptyNote: pick(MEMO_TEXT.blindSpotsEmpty, lang),
      lines: input.blindSpots.map((spot) => ({
        text: pick(spot.title, lang),
        detail: pick(spot.detail, lang),
        tone: spot.severity === "block" ? ("alert" as const) : ("normal" as const),
      })),
    },
    {
      id: "scope",
      title: pick(MEMO_TEXT.scope, lang),
      emptyNote: pick(MEMO_TEXT.scopeEmpty, lang),
      lines: input.exclusions.map((exclusion) => ({ text: pick(exclusion.reason, lang) })),
    },
  ];

  const subtitleParts = [input.company, input.countryName].filter((part): part is string => Boolean(part && part.trim()));
  const generated = new Date(input.generatedAt).toLocaleString(lang === "es" ? "es-ES" : "en-GB");

  return {
    title: pick(MEMO_TEXT.title, lang),
    subtitle: subtitleParts.join(" · "),
    statusLabel,
    headline: pick(input.headline, lang),
    sections,
    footer: `${pick(MEMO_TEXT.footer, lang)} ${pick(MEMO_TEXT.generated, lang)}: ${generated}.`,
  };
}
