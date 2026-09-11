import { DEFAULT_LANG, loc, pick, type Lang, type Localized } from "@shared/i18n";
import { invokeLLM, type InvokeParams, type InvokeResult, type MessageContent } from "../_core/llm";
import { assessmentBlockByKey, assessmentScaleMax, itemPath, itemsOf, type AssessmentBlockKey } from "@shared/domain/countryAssessment";

/**
 * El copiloto trabaja en el idioma de la petición: las etiquetas del marco se resuelven a
 * ese idioma antes de entrar en el prompt, y el prompt pide la respuesta en ese idioma. Los
 * identificadores que viajan en el JSON (`itemPath`, `severity`) son neutros y no cambian.
 */
const label = (value: Localized | string, lang: Lang) => pick(value, lang);

/**
 * Copiloto de caso.
 *
 * Tres reglas que no se negocian, y que están implementadas aquí y no solo pedidas en el
 * prompt, porque un prompt no es un control:
 *
 * 1. Toda afirmación extraída debe traer cita literal y localizador. La que no los traiga
 *    se descarta en el servidor antes de llegar al cliente.
 * 2. Cuando se dispone del texto de origen, la cita se busca en él. Si no aparece, la
 *    evidencia se marca como no verificada y se degrada su fiabilidad.
 * 3. Nada de lo que propone el modelo entra en ningún cálculo: sale con estado `suggested`
 *    y necesita que una persona lo acepte.
 */

export type Invoker = (params: InvokeParams) => Promise<InvokeResult>;

export type CaseSource = {
  /** Texto del caso, cuando se ha pegado o extraído. */
  text?: string | null;
  /** URL firmada del documento, cuando es un PDF. */
  documentUrl?: string | null;
  mimeType?: string | null;
  /** Etiqueta con la que se citará la fuente. */
  label: string;
};

export type ExtractedEvidence = {
  claim: string;
  quote: string;
  locator: string;
  targetPath: string | null;
  reliability: number;
  countryCode: string | null;
  quoteVerified: boolean;
};

export type ExtractionResult = {
  evidence: ExtractedEvidence[];
  /** Motivo por el que se descartó cada propuesta rechazada. */
  discarded: { reason: Localized; claim: string }[];
  model: string | null;
};

export type ProposedRating = {
  itemPath: string;
  value: number;
  rationale: string;
  evidenceQuotes: string[];
};

export type ProposalResult = {
  blockKey: AssessmentBlockKey;
  ratings: ProposedRating[];
  discarded: { reason: Localized; itemPath: string }[];
  unresolved: string[];
  model: string | null;
};

export type Objection = {
  itemPath: string | null;
  objection: string;
  /** Identificador neutro: la etiqueta que se muestra la pone el cliente. */
  severity: "high" | "medium" | "low";
};

const MAX_TEXT_CHARS = 120_000;

/** Normaliza para comparar citas: sin acentos, sin dobles espacios y en minúsculas. */
function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’“”]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Comprueba que una cita literal aparece de verdad en el texto de origen. */
export function verifyQuote(quote: string, sourceText: string | null | undefined) {
  if (!sourceText) return null;
  const normalizedQuote = normalizeForMatch(quote);
  if (normalizedQuote.length < 12) return false;
  return normalizeForMatch(sourceText).includes(normalizedQuote);
}

function sourceParts(source: CaseSource): MessageContent[] {
  const parts: MessageContent[] = [];
  if (source.text?.trim()) {
    const text = source.text.slice(0, MAX_TEXT_CHARS);
    parts.push({ type: "text", text: `Texto del caso (fuente «${source.label}»):\n\n${text}` });
  }
  if (source.documentUrl) {
    parts.push({
      type: "file_url",
      file_url: { url: source.documentUrl, mime_type: (source.mimeType as "application/pdf") ?? "application/pdf" },
    });
  }
  if (!parts.length) throw new Error("El caso no tiene ni texto ni documento del que extraer.");
  return parts;
}

function parseJson<T>(result: InvokeResult): T | null {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    // Algunos modelos envuelven el objeto en un bloque de código pese al esquema estricto.
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

const extractionSchema = {
  name: "case_evidence",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["evidence"],
    properties: {
      evidence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["claim", "quote", "locator", "targetPath", "reliability", "countryCode"],
          properties: {
            claim: { type: "string", description: "The claim in a single sentence, in the language requested in the system prompt." },
            quote: { type: "string", description: "Verbatim quote from the document, copied character by character." },
            locator: { type: "string", description: "Page, section or paragraph where the quote appears." },
            targetPath: { type: ["string", "null"], description: "Framework item it supports, shaped block.group.item, or null." },
            reliability: { type: "integer", minimum: 1, maximum: 5, description: "5 dato oficial verificable, 1 supuesto no contrastado." },
            countryCode: { type: ["string", "null"], description: "ISO alpha-2 code of the country it refers to, or null if general." },
          },
        },
      },
    },
  },
} as const;

const extractionSystemPrompt: Record<Lang, string> = {
  es: `Eres un analista de estrategia internacional preparando un caso.

Tu tarea es extraer del documento las afirmaciones que sirvan para evaluar la entrada en un
mercado, y solo esas. Reglas:

- Cada afirmación debe apoyarse en una CITA LITERAL del documento, copiada exactamente como
  aparece. No parafrasees dentro de "quote".
- Indica siempre dónde aparece la cita en "locator" (página, sección o párrafo).
- Si no puedes citar literalmente, no incluyas la afirmación.
- No infieras, no completes con conocimiento externo y no calcules nada. Si el documento no
  lo dice, no existe.
- Distingue hecho de opinión del autor del caso: una opinión atribuida se extrae como tal,
  con menor fiabilidad.
- Escribe "claim" en español, aunque el documento esté en otro idioma. "quote" va siempre en
  el idioma original.`,
  en: `You are an international strategy analyst preparing a case.

Your task is to extract from the document the claims that help assess entry into a market,
and only those. Rules:

- Every claim must rest on a VERBATIM QUOTE from the document, copied exactly as it appears.
  Do not paraphrase inside "quote".
- Always say where the quote appears, in "locator" (page, section or paragraph).
- If you cannot quote verbatim, leave the claim out.
- Do not infer, do not fill gaps with outside knowledge and do not compute anything. If the
  document does not say it, it does not exist.
- Separate fact from the case author's opinion: an attributed opinion is extracted as such,
  with lower reliability.
- Write "claim" in English, even if the document is in another language. "quote" always stays
  in the original language.`,
};

function frameworkCatalogue(lang: Lang) {
  const blocks: string[] = [];
  for (const key of ["market", "resources", "industry", "cage", "risk"] as AssessmentBlockKey[]) {
    const block = assessmentBlockByKey.get(key);
    if (!block) continue;
    const items = itemsOf(block).map((item) => `${itemPath(key, item.groupKey, item.key)} — ${label(item.label, lang)}`);
    blocks.push(`${label(block.label, lang)}:\n${items.join("\n")}`);
  }
  return blocks.join("\n\n");
}

export async function extractCaseEvidence(
  source: CaseSource,
  options: { context?: string; invoke?: Invoker; lang?: Lang } = {},
): Promise<ExtractionResult> {
  const invoke = options.invoke ?? invokeLLM;
  const lang = options.lang ?? DEFAULT_LANG;
  const result = await invoke({
    messages: [
      { role: "system", content: extractionSystemPrompt[lang] },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: lang === "es"
              ? `${options.context ? `Contexto de la decisión: ${options.context}\n\n` : ""}Cuando una afirmación encaje con uno de estos ítems del marco de análisis, indícalo en "targetPath". Si no encaja con ninguno, deja targetPath en null.\n\n${frameworkCatalogue(lang)}`
              : `${options.context ? `Decision context: ${options.context}\n\n` : ""}When a claim matches one of these framework items, say so in "targetPath". If it matches none, leave targetPath null.\n\n${frameworkCatalogue(lang)}`,
          },
          ...sourceParts(source),
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: extractionSchema as never },
    max_tokens: 8000,
  });

  const parsed = parseJson<{ evidence: Partial<ExtractedEvidence>[] }>(result);
  const discarded: ExtractionResult["discarded"] = [];
  const evidence: ExtractedEvidence[] = [];
  const knownPaths = new Set(
    (["market", "resources", "industry", "cage", "risk"] as AssessmentBlockKey[]).flatMap((key) => {
      const block = assessmentBlockByKey.get(key);
      return block ? itemsOf(block).map((item) => itemPath(key, item.groupKey, item.key)) : [];
    }),
  );

  for (const candidate of parsed?.evidence ?? []) {
    const claim = candidate.claim?.trim() ?? "";
    const quote = candidate.quote?.trim() ?? "";
    const locator = candidate.locator?.trim() ?? "";
    if (!claim) continue;
    // Regla 1: sin cita ni localizador, la afirmación no llega al cliente.
    if (!quote) {
      discarded.push({ reason: loc("Sin cita literal", "No verbatim quote"), claim });
      continue;
    }
    if (!locator) {
      discarded.push({ reason: loc("Sin localizador en la fuente", "No locator in the source"), claim });
      continue;
    }
    // Regla 2: si tenemos el texto, la cita tiene que estar en él.
    const verified = verifyQuote(quote, source.text);
    if (verified === false) {
      discarded.push({ reason: loc("La cita no aparece en el texto de origen", "The quote does not appear in the source text"), claim });
      continue;
    }
    const targetPath = candidate.targetPath && knownPaths.has(candidate.targetPath) ? candidate.targetPath : null;
    const reliability = Math.min(5, Math.max(1, Math.round(Number(candidate.reliability) || 3)));
    evidence.push({
      claim,
      quote,
      locator,
      targetPath,
      // Una cita que no se ha podido comprobar no puede presentarse como dato verificable.
      reliability: verified === true ? reliability : Math.min(reliability, 3),
      countryCode: candidate.countryCode?.trim().toUpperCase().slice(0, 3) || null,
      quoteVerified: verified === true,
    });
  }

  return { evidence, discarded, model: result.model ?? null };
}

const proposalSystemPrompt: Record<Lang, string> = {
  es: `Eres un analista de estrategia internacional puntuando un país
con el marco del capítulo 6 de Lasserre y Monteiro.

Reglas:
- Puntúa de 0 a ${assessmentScaleMax} usando las anclas que se te dan para cada ítem.
- Puntúa SOLO los ítems para los que el material aporta base. Los demás déjalos fuera y
  enuméralos en "unresolved": no evaluado y cero no son lo mismo.
- Cada puntuación necesita un "rationale" de una o dos frases y al menos una cita literal
  del material en "evidenceQuotes".
- No inventes cifras ni completes con conocimiento externo.`,
  en: `You are an international strategy analyst scoring a country with the chapter 6
framework from Lasserre and Monteiro.

Rules:
- Score from 0 to ${assessmentScaleMax} using the anchors given for each item.
- Score ONLY the items the material gives a basis for. Leave the rest out and list them in
  "unresolved": not assessed and zero are not the same thing.
- Every score needs a one- or two-sentence "rationale" and at least one verbatim quote from
  the material in "evidenceQuotes".
- Do not invent figures and do not fill gaps with outside knowledge.`,
};

const proposalSchema = {
  name: "assessment_proposal",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["ratings", "unresolved"],
    properties: {
      ratings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["itemPath", "value", "rationale", "evidenceQuotes"],
          properties: {
            itemPath: { type: "string" },
            value: { type: "integer", minimum: 0, maximum: assessmentScaleMax },
            rationale: { type: "string" },
            evidenceQuotes: { type: "array", items: { type: "string" } },
          },
        },
      },
      unresolved: {
        type: "array",
        items: { type: "string" },
        description: "Items the material does not allow you to score.",
      },
    },
  },
} as const;

export async function proposeAssessmentBlock(
  blockKey: AssessmentBlockKey,
  source: CaseSource,
  options: { countryName: string; context?: string; invoke?: Invoker; lang?: Lang } = { countryName: "—" },
): Promise<ProposalResult> {
  const invoke = options.invoke ?? invokeLLM;
  const lang = options.lang ?? DEFAULT_LANG;
  const block = assessmentBlockByKey.get(blockKey);
  if (!block) throw new Error(`Unknown assessment block: ${blockKey}`);

  const itemBrief = block.groups
    .map((group) => {
      const items = group.items
        .map((item) => `- ${itemPath(blockKey, group.key, item.key)} · ${label(item.label, lang)}. ${label(item.help, lang)}\n  0 = ${label(item.anchorLow, lang)} | ${assessmentScaleMax} = ${label(item.anchorHigh, lang)}`)
        .join("\n");
      return `${label(group.label, lang)} (${label(group.intro, lang)})\n${items}`;
    })
    .join("\n\n");

  const result = await invoke({
    messages: [
      { role: "system", content: proposalSystemPrompt[lang] },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: lang === "es"
              ? `País evaluado: ${options.countryName}.\n${options.context ? `Contexto de la decisión: ${options.context}\n` : ""}\nBloque: ${label(block.label, lang)}. ${label(block.intro, lang)}\nOrientación de la escala: ${block.direction === "adverse" ? `${assessmentScaleMax} es desfavorable` : `${assessmentScaleMax} es favorable`}.\n\nÍtems:\n${itemBrief}`
              : `Country assessed: ${options.countryName}.\n${options.context ? `Decision context: ${options.context}\n` : ""}\nBlock: ${label(block.label, lang)}. ${label(block.intro, lang)}\nScale direction: ${block.direction === "adverse" ? `${assessmentScaleMax} is unfavourable` : `${assessmentScaleMax} is favourable`}.\n\nItems:\n${itemBrief}`,
          },
          ...sourceParts(source),
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: proposalSchema as never },
    max_tokens: 6000,
  });

  const parsed = parseJson<{ ratings: Partial<ProposedRating>[]; unresolved: string[] }>(result);
  const validPaths = new Set(itemsOf(block).map((item) => itemPath(blockKey, item.groupKey, item.key)));
  const discarded: ProposalResult["discarded"] = [];
  const ratings: ProposedRating[] = [];

  for (const candidate of parsed?.ratings ?? []) {
    const path = candidate.itemPath?.trim() ?? "";
    if (!validPaths.has(path)) {
      discarded.push({ reason: loc("Ítem ajeno al bloque solicitado", "Item outside the block requested"), itemPath: path || "—" });
      continue;
    }
    const rationale = candidate.rationale?.trim() ?? "";
    if (!rationale) {
      discarded.push({ reason: loc("Sin justificación", "No rationale"), itemPath: path });
      continue;
    }
    const quotes = (candidate.evidenceQuotes ?? []).map((quote) => quote.trim()).filter(Boolean);
    if (!quotes.length) {
      discarded.push({ reason: loc("Sin cita que la sostenga", "No quote to support it"), itemPath: path });
      continue;
    }
    // Si tenemos el texto, al menos una de las citas tiene que aparecer en él.
    if (source.text && !quotes.some((quote) => verifyQuote(quote, source.text) === true)) {
      discarded.push({ reason: loc("Ninguna cita aparece en el texto de origen", "No quote appears in the source text"), itemPath: path });
      continue;
    }
    const value = Math.min(assessmentScaleMax, Math.max(0, Math.round(Number(candidate.value))));
    if (!Number.isFinite(value)) {
      discarded.push({ reason: loc("Valor no numérico", "Non-numeric value"), itemPath: path });
      continue;
    }
    ratings.push({ itemPath: path, value, rationale, evidenceQuotes: quotes });
  }

  const proposedPaths = new Set(ratings.map((rating) => rating.itemPath));
  const unresolved = Array.from(validPaths).filter((path) => !proposedPaths.has(path));

  return { blockKey, ratings, discarded, unresolved, model: result.model ?? null };
}

const critiqueSchema = {
  name: "assessment_critique",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["objections"],
    properties: {
      objections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["itemPath", "objection", "severity"],
          properties: {
            itemPath: { type: ["string", "null"] },
            objection: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
          },
        },
      },
    },
  },
} as const;

const critiqueSystemPrompt: Record<Lang, string> = {
  es: `Eres un revisor crítico de un análisis de entrada a mercado.

No propones puntuaciones: señalas problemas. Busca contradicciones entre lo que dice el
material y lo que se ha puntuado, juicios sin base, optimismo no justificado y omisiones
relevantes. Sé concreto y cita el material cuando puedas. Si el análisis está bien
sostenido, devuelve una lista vacía en lugar de inventar objeciones.

Escribe "objection" en español. "severity" toma uno de estos valores fijos, en inglés:
high, medium, low.`,
  en: `You are a critical reviewer of a market entry analysis.

You do not propose scores: you point at problems. Look for contradictions between what the
material says and what has been scored, judgements with no basis, unjustified optimism and
relevant omissions. Be concrete and quote the material when you can. If the analysis is well
supported, return an empty list rather than inventing objections.

Write "objection" in English. "severity" takes one of these fixed values: high, medium, low.`,
};

export async function critiqueAssessment(
  blockKey: AssessmentBlockKey,
  ratings: { itemPath: string; value: number; rationale?: string | null }[],
  source: CaseSource,
  options: { countryName?: string; invoke?: Invoker; lang?: Lang } = {},
): Promise<{ objections: Objection[]; model: string | null }> {
  const invoke = options.invoke ?? invokeLLM;
  const lang = options.lang ?? DEFAULT_LANG;
  const block = assessmentBlockByKey.get(blockKey);
  if (!block) throw new Error(`Unknown assessment block: ${blockKey}`);

  const noRationale = lang === "es" ? " · sin justificación" : " · no rationale";
  const summary = ratings
    .map((rating) => `- ${rating.itemPath} = ${rating.value}/${assessmentScaleMax}${rating.rationale ? ` · ${rating.rationale}` : noRationale}`)
    .join("\n");

  const result = await invoke({
    messages: [
      { role: "system", content: critiqueSystemPrompt[lang] },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: lang === "es"
              ? `País: ${options.countryName ?? "—"}.\nBloque: ${label(block.label, lang)}. Orientación: ${block.direction === "adverse" ? `${assessmentScaleMax} es desfavorable` : `${assessmentScaleMax} es favorable`}.\n\nPuntuaciones a revisar:\n${summary || "(ninguna)"}`
              : `Country: ${options.countryName ?? "—"}.\nBlock: ${label(block.label, lang)}. Direction: ${block.direction === "adverse" ? `${assessmentScaleMax} is unfavourable` : `${assessmentScaleMax} is favourable`}.\n\nScores to review:\n${summary || "(none)"}`,
          },
          ...sourceParts(source),
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: critiqueSchema as never },
    max_tokens: 3000,
  });

  const parsed = parseJson<{ objections: Partial<Objection>[] }>(result);
  const validPaths = new Set(itemsOf(block).map((item) => itemPath(blockKey, item.groupKey, item.key)));
  const objections: Objection[] = [];
  for (const candidate of parsed?.objections ?? []) {
    const objection = candidate.objection?.trim();
    if (!objection) continue;
    const path = candidate.itemPath && validPaths.has(candidate.itemPath) ? candidate.itemPath : null;
    const severity = candidate.severity === "high" || candidate.severity === "low" ? candidate.severity : "medium";
    objections.push({ itemPath: path, objection, severity });
  }
  return { objections, model: result.model ?? null };
}
