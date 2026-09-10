import { invokeLLM, type InvokeParams, type InvokeResult, type MessageContent } from "../_core/llm";
import { assessmentBlockByKey, assessmentScaleMax, itemPath, itemsOf, type AssessmentBlockKey } from "@shared/domain/countryAssessment";

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
  discarded: { reason: string; claim: string }[];
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
  discarded: { reason: string; itemPath: string }[];
  unresolved: string[];
  model: string | null;
};

export type Objection = {
  itemPath: string | null;
  objection: string;
  severity: "alta" | "media" | "baja";
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
            claim: { type: "string", description: "La afirmación en una frase, en español." },
            quote: { type: "string", description: "Cita literal del documento, copiada carácter a carácter." },
            locator: { type: "string", description: "Página, sección o párrafo donde aparece la cita." },
            targetPath: { type: ["string", "null"], description: "Ítem del marco al que da soporte, con la forma bloque.grupo.item, o null." },
            reliability: { type: "integer", minimum: 1, maximum: 5, description: "5 dato oficial verificable, 1 supuesto no contrastado." },
            countryCode: { type: ["string", "null"], description: "Código ISO alfa-2 del país al que se refiere, o null si es general." },
          },
        },
      },
    },
  },
} as const;

const extractionSystemPrompt = `Eres un analista de estrategia internacional preparando un caso.

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
  el idioma original.`;

function frameworkCatalogue() {
  const blocks: string[] = [];
  for (const key of ["market", "resources", "industry", "cage", "risk"] as AssessmentBlockKey[]) {
    const block = assessmentBlockByKey.get(key);
    if (!block) continue;
    const items = itemsOf(block).map((item) => `${itemPath(key, item.groupKey, item.key)} — ${item.label}`);
    blocks.push(`${block.label}:\n${items.join("\n")}`);
  }
  return blocks.join("\n\n");
}

export async function extractCaseEvidence(
  source: CaseSource,
  options: { context?: string; invoke?: Invoker } = {},
): Promise<ExtractionResult> {
  const invoke = options.invoke ?? invokeLLM;
  const result = await invoke({
    messages: [
      { role: "system", content: extractionSystemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${options.context ? `Contexto de la decisión: ${options.context}\n\n` : ""}Cuando una afirmación encaje con uno de estos ítems del marco de análisis, indícalo en "targetPath". Si no encaja con ninguno, deja targetPath en null.\n\n${frameworkCatalogue()}`,
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
      discarded.push({ reason: "Sin cita literal", claim });
      continue;
    }
    if (!locator) {
      discarded.push({ reason: "Sin localizador en la fuente", claim });
      continue;
    }
    // Regla 2: si tenemos el texto, la cita tiene que estar en él.
    const verified = verifyQuote(quote, source.text);
    if (verified === false) {
      discarded.push({ reason: "La cita no aparece en el texto de origen", claim });
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

const proposalSystemPrompt = `Eres un analista de estrategia internacional puntuando un país
con el marco del capítulo 6 de Lasserre y Monteiro.

Reglas:
- Puntúa de 0 a ${assessmentScaleMax} usando las anclas que se te dan para cada ítem.
- Puntúa SOLO los ítems para los que el material aporta base. Los demás déjalos fuera y
  enuméralos en "unresolved": no evaluado y cero no son lo mismo.
- Cada puntuación necesita un "rationale" de una o dos frases y al menos una cita literal
  del material en "evidenceQuotes".
- No inventes cifras ni completes con conocimiento externo.`;

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
        description: "Ítems que el material no permite puntuar.",
      },
    },
  },
} as const;

export async function proposeAssessmentBlock(
  blockKey: AssessmentBlockKey,
  source: CaseSource,
  options: { countryName: string; context?: string; invoke?: Invoker } = { countryName: "el país" },
): Promise<ProposalResult> {
  const invoke = options.invoke ?? invokeLLM;
  const block = assessmentBlockByKey.get(blockKey);
  if (!block) throw new Error(`Bloque de evaluación desconocido: ${blockKey}`);

  const itemBrief = block.groups
    .map((group) => {
      const items = group.items
        .map((item) => `- ${itemPath(blockKey, group.key, item.key)} · ${item.label}. ${item.help}\n  0 = ${item.anchorLow} | ${assessmentScaleMax} = ${item.anchorHigh}`)
        .join("\n");
      return `${group.label} (${group.intro})\n${items}`;
    })
    .join("\n\n");

  const result = await invoke({
    messages: [
      { role: "system", content: proposalSystemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `País evaluado: ${options.countryName}.\n${options.context ? `Contexto de la decisión: ${options.context}\n` : ""}\nBloque: ${block.label}. ${block.intro}\nOrientación de la escala: ${block.direction === "adverse" ? `${assessmentScaleMax} es desfavorable` : `${assessmentScaleMax} es favorable`}.\n\nÍtems:\n${itemBrief}`,
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
      discarded.push({ reason: "Ítem ajeno al bloque solicitado", itemPath: path || "(vacío)" });
      continue;
    }
    const rationale = candidate.rationale?.trim() ?? "";
    if (!rationale) {
      discarded.push({ reason: "Sin justificación", itemPath: path });
      continue;
    }
    const quotes = (candidate.evidenceQuotes ?? []).map((quote) => quote.trim()).filter(Boolean);
    if (!quotes.length) {
      discarded.push({ reason: "Sin cita que la sostenga", itemPath: path });
      continue;
    }
    // Si tenemos el texto, al menos una de las citas tiene que aparecer en él.
    if (source.text && !quotes.some((quote) => verifyQuote(quote, source.text) === true)) {
      discarded.push({ reason: "Ninguna cita aparece en el texto de origen", itemPath: path });
      continue;
    }
    const value = Math.min(assessmentScaleMax, Math.max(0, Math.round(Number(candidate.value))));
    if (!Number.isFinite(value)) {
      discarded.push({ reason: "Valor no numérico", itemPath: path });
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
            severity: { type: "string", enum: ["alta", "media", "baja"] },
          },
        },
      },
    },
  },
} as const;

const critiqueSystemPrompt = `Eres un revisor crítico de un análisis de entrada a mercado.

No propones puntuaciones: señalas problemas. Busca contradicciones entre lo que dice el
material y lo que se ha puntuado, juicios sin base, optimismo no justificado y omisiones
relevantes. Sé concreto y cita el material cuando puedas. Si el análisis está bien
sostenido, devuelve una lista vacía en lugar de inventar objeciones.`;

export async function critiqueAssessment(
  blockKey: AssessmentBlockKey,
  ratings: { itemPath: string; value: number; rationale?: string | null }[],
  source: CaseSource,
  options: { countryName?: string; invoke?: Invoker } = {},
): Promise<{ objections: Objection[]; model: string | null }> {
  const invoke = options.invoke ?? invokeLLM;
  const block = assessmentBlockByKey.get(blockKey);
  if (!block) throw new Error(`Bloque de evaluación desconocido: ${blockKey}`);

  const summary = ratings
    .map((rating) => `- ${rating.itemPath} = ${rating.value}/${assessmentScaleMax}${rating.rationale ? ` · ${rating.rationale}` : " · sin justificación"}`)
    .join("\n");

  const result = await invoke({
    messages: [
      { role: "system", content: critiqueSystemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `País: ${options.countryName ?? "el país evaluado"}.\nBloque: ${block.label}. Orientación: ${block.direction === "adverse" ? `${assessmentScaleMax} es desfavorable` : `${assessmentScaleMax} es favorable`}.\n\nPuntuaciones a revisar:\n${summary || "(ninguna)"}`,
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
    const severity = candidate.severity === "alta" || candidate.severity === "baja" ? candidate.severity : "media";
    objections.push({ itemPath: path, objection, severity });
  }
  return { objections, model: result.model ?? null };
}
