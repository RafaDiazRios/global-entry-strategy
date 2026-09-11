import { describe, expect, it } from "vitest";
import { LANGUAGES, pick } from "@shared/i18n";
import { readEconomics, type EconomicsInput } from "@shared/domain/economicsReading";

/**
 * La lectura del modelo sobre el caso económico.
 *
 * Lo que se prueba aquí no es que el veredicto sea correcto —eso lo decide el motor— sino
 * que la herramienta no se calle una contradicción. Declarar que el caso se sostiene mientras
 * el NPV es negativo tiene que costar algo.
 */

const base: EconomicsInput = {
  npv: 12_000_000,
  roiPct: 24,
  currency: "EUR",
  returnThresholdPct: 15,
  action: "advance",
  stackDeclared: true,
  belief: "holds",
};

describe("lectura del modelo sobre el caso económico", () => {
  it("calla mientras no haya caso financiero", () => {
    expect(readEconomics({ ...base, action: "insufficient_data" }).verdict).toBe("silent");
    expect(readEconomics({ ...base, npv: null }).verdict).toBe("silent");
    expect(readEconomics({ ...base, action: null }).verdict).toBe("silent");
  });

  it("sostiene el supuesto cuando el retorno supera el umbral declarado", () => {
    const reading = readEconomics(base);
    expect(reading.verdict).toBe("supports");
    expect(reading.conflictsWithBelief).toBe(false);
    expect(pick(reading.note, "es")).toContain("15%");
  });

  it("lo contradice cuando el NPV es negativo, por muy alto que sea el retorno", () => {
    const reading = readEconomics({ ...base, npv: -4_000_000, roiPct: 90 });
    expect(reading.verdict).toBe("contradicts");
    expect(pick(reading.note, "es")).toContain("NPV");
  });

  it("lo contradice cuando el retorno no llega al umbral aunque el NPV sea positivo", () => {
    const reading = readEconomics({ ...base, roiPct: 9 });
    expect(reading.verdict).toBe("contradicts");
    expect(pick(reading.note, "es")).toContain("9%");
    expect(pick(reading.note, "en")).toContain("9%");
  });

  it("sin umbral declarado no inventa uno", () => {
    const reading = readEconomics({ ...base, returnThresholdPct: null, roiPct: 2 });
    expect(reading.verdict).toBe("supports");
    expect(pick(reading.note, "es")).toContain("sin umbral declarado");
    expect(pick(reading.note, "en")).toContain("no declared threshold");
  });

  it("señala la contradicción en los dos sentidos", () => {
    expect(readEconomics({ ...base, npv: -1, belief: "holds" }).conflictsWithBelief).toBe(true);
    expect(readEconomics({ ...base, npv: -1, belief: "does_not_hold" }).conflictsWithBelief).toBe(false);
    expect(readEconomics({ ...base, belief: "does_not_hold" }).conflictsWithBelief).toBe(true);
    expect(readEconomics({ ...base, belief: "unknown" }).conflictsWithBelief).toBe(false);
  });

  it("dice sobre qué está calculado, porque un margen único vale menos que una cuenta", () => {
    expect(pick(readEconomics({ ...base, stackDeclared: true }).note, "es")).toContain("cuenta de resultados por líneas");
    expect(pick(readEconomics({ ...base, stackDeclared: false }).note, "es")).toContain("captura y margen");
    expect(pick(readEconomics({ ...base, stackDeclared: false }).note, "en")).toContain("capture-and-margin");
  });

  it("no escupe objetos en ninguno de los dos idiomas", () => {
    const cases: EconomicsInput[] = [
      base,
      { ...base, npv: -1 },
      { ...base, roiPct: null },
      { ...base, returnThresholdPct: null },
      { ...base, currency: null },
      { ...base, action: "insufficient_data" },
    ];
    for (const input of cases) {
      const note = readEconomics(input).note;
      for (const lang of LANGUAGES) {
        expect(pick(note, lang), JSON.stringify(input)).not.toContain("[object Object]");
        expect(pick(note, lang), JSON.stringify(input)).not.toContain("undefined");
      }
    }
  });
});
