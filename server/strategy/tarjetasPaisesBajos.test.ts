import { describe, expect, it } from "vitest";
import { LANGUAGES, pick, pickAll } from "@shared/i18n";
import { industry, stackTemplate } from "@shared/domain/industries";
import type { RevenueStack } from "@shared/domain/revenueStack";
import { evaluateFinancials, type FinancialAssumptions } from "./financialEngine";
import { checkPlausibility, evaluateRevenueStack } from "./revenueStack";

/**
 * Tarjetas de crédito en Países Bajos.
 *
 * El caso que motivó la pila. Un banco internacional se plantea lanzar tarjetas de crédito
 * en un mercado maduro, muy bancarizado y con una cultura de débito: el volumen de compra
 * existe, el saldo revolving es bajo y el coste de riesgo se come la parte del ingreso que
 * el revolving tendría que pagar.
 *
 * Lo que se comprueba aquí no es que las cifras sean las verdaderas —no lo son, y quien
 * defienda el caso tendrá que traer las suyas—, sino que la herramienta permite escribirlas
 * y que el resultado cambia cuando cambian. Con el modelo anterior de captura y margen esto
 * era imposible: el coste de riesgo no cabía en ninguna parte, y un margen operativo sobre
 * el ingreso lo habría hecho desaparecer.
 */

const HORIZON = 5;

/** La plantilla del sector con las cifras del caso puestas encima. */
function cardsStack(overrides: { costOfRiskPct?: number; revolvingBalance?: number } = {}): RevenueStack {
  const template = stackTemplate("fs_credit_cards");
  if (!template) throw new Error("falta la plantilla de tarjetas");
  const stack = template.build("es");

  const driver = (id: string, yearOne: number, atHorizon: number) => {
    const found = stack.drivers.find((entry) => entry.id === id);
    if (!found) throw new Error(`falta el driver ${id}`);
    found.valueYearOne = yearOne;
    found.valueAtHorizon = atHorizon;
    found.ramp = "s_curve";
  };

  const balance = overrides.revolvingBalance ?? 120_000_000;
  driver("active_cards", 25_000, 220_000);
  driver("purchase_volume", 60_000_000, 620_000_000);
  driver("revolving_balance", 12_000_000, balance);

  const rate = (id: string, value: number) => {
    const found = stack.lines[0].items.find((entry) => entry.id === id);
    if (!found) throw new Error(`falta la partida ${id}`);
    found.rate = value;
  };

  rate("interchange", 0.9);
  rate("nii", 14);
  rate("annual_fee", 35);
  rate("cost_of_risk", overrides.costOfRiskPct ?? 3.2);
  rate("cost_of_funds", 3.4);
  rate("servicing", 22);

  return stack;
}

function assumptions(stack: RevenueStack): FinancialAssumptions {
  return {
    currency: "EUR",
    tamYearOne: 2_400_000_000,
    annualMarketGrowthPct: 3,
    samPct: 40,
    somPctYearOne: 0.6,
    somPctHorizon: 6,
    somRampShape: "s_curve",
    taxRatePct: 25.8,
    workingCapitalPctRevenue: 0,
    discountRatePct: 11,
    terminalGrowthPct: 1.5,
    revenueStack: stack,
    modeProfiles: {
      greenfield: { initialInvestment: 25_000_000, annualOperatingCost: 9_000_000, revenueCapturePct: 100 },
    },
  };
}

const greenfield = [{ key: "greenfield" as const, mode: { es: "Filial local con licencia propia", en: "Local subsidiary with its own licence" } }];

describe("tarjetas de crédito en Países Bajos", () => {
  it("la plantilla del sector trae las seis partidas sobre tres drivers distintos", () => {
    const stack = stackTemplate("fs_credit_cards")!.build("es");
    expect(stack.drivers.map((driver) => driver.id)).toEqual(["active_cards", "purchase_volume", "revolving_balance"]);
    const items = stack.lines[0].items;
    expect(items.filter((item) => item.kind === "revenue")).toHaveLength(3);
    expect(items.filter((item) => item.kind === "direct_cost")).toHaveLength(3);
    // El coste de riesgo va sobre el saldo, no sobre el ingreso. Es todo el asunto.
    expect(items.find((item) => item.id === "cost_of_risk")?.driverId).toBe("revolving_balance");
    // Y nada de esto viene del libro.
    expect(items.every((item) => item.origin === "sector")).toBe(true);
  });

  it("la plantilla vive en servicios financieros y no en la genérica", () => {
    expect(industry("financial_services").stackTemplates.map((template) => template.id)).toContain("fs_credit_cards");
    expect(industry("generic").stackTemplates.map((template) => template.id)).not.toContain("fs_credit_cards");
  });

  it("reparte el coste fijo y produce una cuenta por línea con contribución y resultado", () => {
    const result = evaluateRevenueStack(cardsStack(), HORIZON, 9_000_000);
    expect(result.status).toBe("ok");
    expect(result.fixedCostShareTotal).toBe(100);

    const last = result.years.at(-1)!;
    expect(last.lines).toHaveLength(1);
    expect(last.revenue).toBeGreaterThan(0);
    expect(last.directCost).toBeGreaterThan(0);
    expect(last.contribution).toBe(last.revenue - last.directCost);
    expect(last.allocatedFixedCost).toBe(9_000_000);
    expect(last.operatingProfit).toBe(last.contribution - last.allocatedFixedCost);

    // Cada partida aparece nombrada: el comité pregunta por líneas, no por totales.
    expect(last.lines[0].items.map((item) => item.itemId)).toEqual([
      "interchange", "nii", "annual_fee", "cost_of_risk", "cost_of_funds", "servicing",
    ]);
  });

  it("el coste de riesgo puede hundir la contribución sin tocar el ingreso", () => {
    const benigno = evaluateRevenueStack(cardsStack({ costOfRiskPct: 1.5 }), HORIZON, 9_000_000);
    const adverso = evaluateRevenueStack(cardsStack({ costOfRiskPct: 9 }), HORIZON, 9_000_000);

    const ingresoIgual = benigno.years.at(-1)!.revenue === adverso.years.at(-1)!.revenue;
    expect(ingresoIgual).toBe(true);
    expect(adverso.years.at(-1)!.contribution).toBeLessThan(benigno.years.at(-1)!.contribution);

    // Y el resultado acumulado del horizonte cambia de signo sin que el ingreso se mueva.
    const acumulado = (result: typeof benigno) => result.years.reduce((sum, year) => sum + year.operatingProfit, 0);
    expect(acumulado(benigno)).toBeGreaterThan(0);
    expect(acumulado(adverso)).toBeLessThan(0);
  });

  it("el NPV cambia de signo con el coste de riesgo, que es lo que el modelo anterior no podía ver", () => {
    const benigno = evaluateFinancials(assumptions(cardsStack({ costOfRiskPct: 1.5 })), greenfield, HORIZON);
    const adverso = evaluateFinancials(assumptions(cardsStack({ costOfRiskPct: 9 })), greenfield, HORIZON);
    expect(benigno.alternatives[0].status).toBe("ok");
    expect(adverso.alternatives[0].status).toBe("ok");
    expect(benigno.alternatives[0].npv!).toBeGreaterThan(0);
    expect(adverso.alternatives[0].npv!).toBeLessThan(0);
  });

  it("avisa cuando la pila implica más ingreso del que cabe en el SOM declarado", () => {
    const exagerada = cardsStack({ revolvingBalance: 3_000_000_000 });
    const result = evaluateFinancials(assumptions(exagerada), greenfield, HORIZON);
    expect(result.plausibility.status).toBe("above_som");
    expect(result.plausibility.sharePct).toBeGreaterThan(105);
    for (const lang of LANGUAGES) {
      expect(pick(result.plausibility.note, lang)).not.toContain("[object Object]");
      expect(pick(result.plausibility.note, lang)).not.toContain("undefined");
    }
  });

  it("con una pila declarada deja de exigir un margen operativo único", () => {
    const conPila = evaluateFinancials(assumptions(cardsStack()), greenfield, HORIZON);
    expect(conPila.status).toBe("ok");
    expect(pickAll(conPila.missingInputs, "es")).not.toContain("margen operativo");

    const { revenueStack, ...sinPila } = assumptions(cardsStack());
    expect(pickAll(evaluateFinancials(sinPila, greenfield, HORIZON).missingInputs, "es")).toContain("margen operativo");
  });

  it("nombra lo que falta en lugar de tratarlo como cero", () => {
    const incompleta = cardsStack();
    incompleta.lines[0].items.find((item) => item.id === "cost_of_risk")!.rate = null;
    const result = evaluateRevenueStack(incompleta, HORIZON, 9_000_000);
    expect(result.status).toBe("insufficient_data");
    expect(pickAll(result.missingInputs, "es").join(" ")).toContain("Coste de riesgo");
    expect(pickAll(result.missingInputs, "en").join(" ")).toContain("Coste de riesgo");
  });

  it("avisa de un reparto de coste fijo que no suma cien", () => {
    const descuadrada = cardsStack();
    descuadrada.lines[0].fixedCostSharePct = 60;
    const result = evaluateRevenueStack(descuadrada, HORIZON, 9_000_000);
    expect(result.fixedCostShareTotal).toBe(60);
    expect(pickAll(result.warnings, "es").join(" ")).toContain("60%");
    expect(pickAll(result.warnings, "en").join(" ")).toContain("60%");
  });

  it("sin pila declarada el caso económico se comporta como antes", () => {
    const empty = checkPlausibility(evaluateRevenueStack(null, HORIZON, 0), 1_000_000);
    expect(empty.status).toBe("no_market");
  });
});
