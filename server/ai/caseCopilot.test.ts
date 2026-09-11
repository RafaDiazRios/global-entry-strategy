import { describe, expect, it, vi } from "vitest";
import type { InvokeResult } from "../_core/llm";
import { critiqueAssessment, extractCaseEvidence, proposeAssessmentBlock, verifyQuote } from "./caseCopilot";
import { pickAll } from "@shared/i18n";

/** Respuesta simulada del gateway con el JSON que devolvería el modelo. */
function stub(payload: unknown, model = "modelo-simulado") {
  const result = { model, choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }] } as unknown as InvokeResult;
  return vi.fn().mockResolvedValue(result);
}

const caseText = `Chandra Components es un fabricante indio de sensores industriales fundado en 1998.
"El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023", según el informe sectorial citado en el caso.
La dirección reconoce que "no disponemos de ninguna relación previa con distribuidores en Brasil".
Los aranceles de importación sobre componentes electrónicos alcanzan el 18%.`;

describe("verifyQuote", () => {
  it("localiza la cita aunque cambien acentos, comillas y espacios", () => {
    expect(verifyQuote("el mercado brasileno de sensores   crecio un 11% anual", caseText)).toBe(true);
  });

  it("rechaza una cita que no está en el texto", () => {
    expect(verifyQuote("el mercado brasileño se contrajo un 11% anual", caseText)).toBe(false);
  });

  it("rechaza citas demasiado cortas para probar nada", () => {
    expect(verifyQuote("sensores", caseText)).toBe(false);
  });

  it("no puede pronunciarse sin texto de origen", () => {
    expect(verifyQuote("cualquier cosa larga y concreta", null)).toBeNull();
  });
});

describe("extracción de evidencias", () => {
  const source = { text: caseText, label: "Caso Chandra Components" };

  it("acepta solo lo que viene con cita literal verificable y localizador", async () => {
    const invoke = stub({
      evidence: [
        { claim: "El mercado brasileño de sensores crece con fuerza", quote: "El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023", locator: "p. 2", targetPath: "market.demand.growth", reliability: 4, countryCode: "BR" },
        { claim: "Sin relación previa con distribuidores locales", quote: "no disponemos de ninguna relación previa con distribuidores en Brasil", locator: "p. 3", targetPath: "market.segmentation.distributionAccess", reliability: 5, countryCode: "BR" },
        { claim: "Afirmación sin cita", quote: "", locator: "p. 4", targetPath: null, reliability: 3, countryCode: null },
        { claim: "Afirmación sin localizador", quote: "Los aranceles de importación sobre componentes electrónicos alcanzan el 18%", locator: "", targetPath: null, reliability: 4, countryCode: "BR" },
        { claim: "Cita inventada", quote: "El gobierno brasileño anunció una exención arancelaria total para 2026", locator: "p. 5", targetPath: null, reliability: 5, countryCode: "BR" },
      ],
    });

    const result = await extractCaseEvidence(source, { invoke });

    expect(result.evidence).toHaveLength(2);
    expect(result.evidence.every((entry) => entry.quoteVerified)).toBe(true);
    expect(pickAll(result.discarded.map((entry) => entry.reason), "es")).toEqual([
      "Sin cita literal",
      "Sin localizador en la fuente",
      "La cita no aparece en el texto de origen",
    ]);
    expect(pickAll(result.discarded.map((entry) => entry.reason), "en")).toEqual([
      "No verbatim quote",
      "No locator in the source",
      "The quote does not appear in the source text",
    ]);
    expect(result.model).toBe("modelo-simulado");
  });

  it("descarta un targetPath que no existe en el marco", async () => {
    const invoke = stub({
      evidence: [
        { claim: "Crecimiento del mercado", quote: "El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023", locator: "p. 2", targetPath: "market.inventado.noExiste", reliability: 4, countryCode: "BR" },
      ],
    });
    const result = await extractCaseEvidence(source, { invoke });
    expect(result.evidence[0].targetPath).toBeNull();
  });

  it("degrada la fiabilidad cuando no hay texto contra el que verificar la cita", async () => {
    const invoke = stub({
      evidence: [
        { claim: "Dato del PDF", quote: "una cita cualquiera suficientemente larga para pasar el filtro", locator: "p. 7", targetPath: null, reliability: 5, countryCode: null },
      ],
    });
    const result = await extractCaseEvidence({ documentUrl: "https://ejemplo/caso.pdf", mimeType: "application/pdf", label: "Caso en PDF" }, { invoke });
    expect(result.evidence[0].quoteVerified).toBe(false);
    // Sin verificación posible, no puede presentarse como dato oficial contrastado.
    expect(result.evidence[0].reliability).toBe(3);
  });

  it("no acepta una fuente vacía", async () => {
    await expect(extractCaseEvidence({ label: "vacía" }, { invoke: stub({ evidence: [] }) })).rejects.toThrow(/ni texto ni documento/);
  });

  it("devuelve lista vacía si el modelo responde algo que no es JSON", async () => {
    const invoke = vi.fn().mockResolvedValue({ model: "x", choices: [{ message: { role: "assistant", content: "lo siento, no puedo" } }] } as unknown as InvokeResult);
    const result = await extractCaseEvidence(source, { invoke });
    expect(result.evidence).toEqual([]);
  });
});

describe("propuesta de puntuación de un bloque", () => {
  const source = { text: caseText, label: "Caso Chandra Components" };

  it("acepta las puntuaciones sostenidas y descarta el resto con su motivo", async () => {
    const invoke = stub({
      ratings: [
        { itemPath: "market.demand.growth", value: 4, rationale: "Crecimiento del 11% anual sostenido cuatro años.", evidenceQuotes: ["El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023"] },
        { itemPath: "market.segmentation.distributionAccess", value: 0, rationale: "Sin relación previa con canal local.", evidenceQuotes: ["no disponemos de ninguna relación previa con distribuidores en Brasil"] },
        { itemPath: "risk.economic.inflation", value: 3, rationale: "Fuera del bloque solicitado.", evidenceQuotes: ["El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023"] },
        { itemPath: "market.demand.size", value: 3, rationale: "", evidenceQuotes: ["El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023"] },
        { itemPath: "market.demand.quality", value: 3, rationale: "Sin cita.", evidenceQuotes: [] },
        { itemPath: "market.segmentation.willingnessToPay", value: 2, rationale: "Cita que no está en el caso.", evidenceQuotes: ["los clientes brasileños pagan una prima del 30%"] },
      ],
      unresolved: [],
    });

    const result = await proposeAssessmentBlock("market", source, { countryName: "Brasil", invoke });

    expect(result.ratings.map((rating) => rating.itemPath)).toEqual(["market.demand.growth", "market.segmentation.distributionAccess"]);
    expect(pickAll(result.discarded.map((entry) => entry.reason), "es")).toEqual([
      "Ítem ajeno al bloque solicitado",
      "Sin justificación",
      "Sin cita que la sostenga",
      "Ninguna cita aparece en el texto de origen",
    ]);
    // Lo no propuesto se declara sin evaluar, no se rellena con un valor medio.
    expect(result.unresolved).toContain("market.demand.size");
    expect(result.unresolved).toContain("market.demand.quality");
  });

  it("acota los valores al rango de la escala", async () => {
    const invoke = stub({
      ratings: [{ itemPath: "market.demand.growth", value: 9, rationale: "Fuera de escala.", evidenceQuotes: ["El mercado brasileño de sensores creció un 11% anual entre 2019 y 2023"] }],
      unresolved: [],
    });
    const result = await proposeAssessmentBlock("market", source, { countryName: "Brasil", invoke });
    expect(result.ratings[0].value).toBe(4);
  });

  it("rechaza un bloque inexistente", async () => {
    await expect(
      proposeAssessmentBlock("inventado" as never, source, { countryName: "Brasil", invoke: stub({ ratings: [], unresolved: [] }) }),
    ).rejects.toThrow(/Unknown assessment block/);
  });
});

describe("crítica del análisis", () => {
  it("conserva las objeciones y descarta las que apuntan a ítems inexistentes", async () => {
    const invoke = stub({
      objections: [
        { itemPath: "market.demand.quality", objection: "Se puntúa alto sin ninguna referencia a segmentos ni disposición a pagar.", severity: "high" },
        { itemPath: "no.existe.esto", objection: "Objeción sobre un ítem inventado.", severity: "medium" },
        { itemPath: null, objection: "El caso no menciona la competencia local en ningún punto.", severity: "inventada" },
        { itemPath: null, objection: "   ", severity: "low" },
      ],
    });

    const result = await critiqueAssessment("market", [{ itemPath: "market.demand.quality", value: 4 }], { text: caseText, label: "Caso" }, { invoke });

    expect(result.objections).toHaveLength(3);
    expect(result.objections[1].itemPath).toBeNull();
    // Una severidad que no está en la escala se normaliza a la media en lugar de perderse.
    expect(result.objections[2].severity).toBe("medium");
  });
});
