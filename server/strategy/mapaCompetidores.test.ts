import { describe, expect, it } from "vitest";
import { LANGUAGES, pick, pickAll } from "@shared/i18n";
import { emptyCompetitiveLandscape, type CompetitiveLandscape } from "@shared/domain/competitiveLandscape";
import { stackTemplate } from "@shared/domain/industries";
import type { RevenueStack } from "@shared/domain/revenueStack";
import { evaluateLandscape } from "./competitiveLandscape";

/**
 * El mapa de competidores, y lo que dice cuando se cruza con la pila.
 *
 * La prueba que importa no es el HHI: es que la herramienta diga de quién tiene que salir la
 * cuota que el plan promete, y qué cuesta captarla. Con la puntuación de rivalidad de 0 a 4
 * ninguna de las dos preguntas se podía siquiera formular.
 */

const HORIZON = 5;

function cardsStack(cardsAtHorizon: number, withAcquisitionItem = false): RevenueStack {
  const stack = stackTemplate("fs_credit_cards")!.build("es");
  const cards = stack.drivers.find((driver) => driver.id === "active_cards")!;
  cards.valueYearOne = 25_000;
  cards.valueAtHorizon = cardsAtHorizon;
  for (const item of stack.lines[0].items) item.rate = 1;
  if (!withAcquisitionItem) {
    // La plantilla trae un coste de servicio sobre las tarjetas; se quita para probar el aviso.
    stack.lines[0].items = stack.lines[0].items.filter((item) => item.id !== "servicing");
  }
  return stack;
}

function landscape(overrides: Partial<CompetitiveLandscape> = {}): CompetitiveLandscape {
  return {
    ...emptyCompetitiveLandscape(),
    marketUnits: 6_000_000,
    unitLabel: "tarjetas",
    driverId: "active_cards",
    acquisitionCost: 180,
    competitors: [
      { id: "c1", name: "ICS", sharePct: 38, holdReason: "Distribución a través de los grandes bancos", note: null },
      { id: "c2", name: "ING", sharePct: 22, holdReason: "Cuenta principal y débito por defecto", note: null },
      { id: "c3", name: "Rabobank", sharePct: 14, holdReason: "Base rural y cooperativa", note: null },
    ],
    ...overrides,
  };
}

describe("mapa de competidores", () => {
  it("no dice nada mientras no haya un competidor con nombre", () => {
    const result = evaluateLandscape(emptyCompetitiveLandscape(), null, HORIZON);
    expect(result.status).toBe("not_declared");
    expect(result.findings).toEqual([]);
  });

  it("suma cuotas, deja ver lo que falta por atribuir y sitúa la concentración", () => {
    const result = evaluateLandscape(landscape(), null, HORIZON);
    expect(result.declaredSharePct).toBe(74);
    expect(result.unattributedSharePct).toBe(26);
    // 38² + 22² + 14² = 1444 + 484 + 196
    expect(result.hhi).toBe(2124);
    expect(result.band).toBe("moderate");
    expect(pick(result.bandReading, "es")).toContain("nombre");
  });

  it("avisa cuando las cuotas suman más de cien", () => {
    const inflado = landscape({
      competitors: [
        { id: "c1", name: "ICS", sharePct: 70, holdReason: "x", note: null },
        { id: "c2", name: "ING", sharePct: 55, holdReason: "x", note: null },
      ],
    });
    const result = evaluateLandscape(inflado, null, HORIZON);
    expect(pickAll(result.findings, "es").join(" ")).toContain("125%");
    expect(pickAll(result.findings, "en").join(" ")).toContain("125%");
  });

  it("señala a los competidores sin razón escrita de por qué retienen", () => {
    const sinRazon = landscape({
      competitors: [
        { id: "c1", name: "ICS", sharePct: 38, holdReason: null, note: null },
        { id: "c2", name: "ING", sharePct: 22, holdReason: "Cuenta principal", note: null },
      ],
    });
    const result = evaluateLandscape(sinRazon, null, HORIZON);
    expect(pickAll(result.findings, "es").join(" ")).toContain("ICS");
    expect(pickAll(result.findings, "es").join(" ")).not.toContain("ING,");
  });

  it("calcula la cuota que implica el plan y de quién tiene que salir", () => {
    // 2.400.000 tarjetas sobre 6.000.000 es el 40%, y solo hay un 26% sin dueño.
    const stack = cardsStack(2_400_000);
    const result = evaluateLandscape(landscape(), stack, HORIZON);
    expect(result.impliedSharePct).toBe(40);
    const es = pickAll(result.findings, "es").join(" ");
    expect(es).toContain("40%");
    expect(es).toContain("26%");
    expect(es).toContain("ICS");
    expect(es).toContain("ING");
    expect(pickAll(result.findings, "en").join(" ")).toContain("ICS and ING");
  });

  it("cuando la cuota cabe en lo no atribuido lo dice, pero no lo da por bueno", () => {
    const stack = cardsStack(600_000); // 10%
    const result = evaluateLandscape(landscape(), stack, HORIZON);
    expect(result.impliedSharePct).toBe(10);
    expect(pickAll(result.findings, "es").join(" ")).toContain("residuo de redondeo");
  });

  it("avisa de que captar esa cuota cuesta dinero que no está presupuestado", () => {
    const stack = cardsStack(600_000, false);
    const result = evaluateLandscape(landscape(), stack, HORIZON);
    expect(result.acquisitionSpend).toBe(108_000_000);
    expect(pickAll(result.findings, "es").join(" ")).toContain("108000000");
  });

  it("y se calla cuando una partida de coste ya usa ese driver", () => {
    const stack = cardsStack(600_000, true);
    const result = evaluateLandscape(landscape(), stack, HORIZON);
    expect(pickAll(result.findings, "es").join(" ")).not.toContain("no presupuest");
    expect(pickAll(result.findings, "es").join(" ")).not.toContain("cuesta 108000000");
  });

  it("pide la correspondencia con el driver cuando falta", () => {
    const stack = cardsStack(600_000);
    const result = evaluateLandscape(landscape({ driverId: null }), stack, HORIZON);
    expect(result.impliedSharePct).toBeNull();
    expect(pickAll(result.findings, "es").join(" ")).toContain("driver");
  });

  it("no escupe objetos en ninguno de los dos idiomas", () => {
    const stack = cardsStack(2_400_000);
    const result = evaluateLandscape(landscape(), stack, HORIZON);
    const texts = [result.bandLabel, result.bandReading, ...result.findings];
    expect(texts.length).toBeGreaterThan(3);
    for (const text of texts) {
      for (const lang of LANGUAGES) {
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("[object Object]");
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("undefined");
      }
    }
  });
});
