import { describe, expect, it } from "vitest";
import { pick, pickAll } from "@shared/i18n";
import { evaluateFinancials, recommendInvestmentAction } from "./financialEngine";

const completeAssumptions = {
  currency: "USD",
  tamYearOne: 1000,
  annualMarketGrowthPct: 0,
  samPct: 50,
  somPctYearOne: 10,
  somPctHorizon: 10,
  operatingMarginPct: 20,
  taxRatePct: 20,
  workingCapitalPctRevenue: 10,
  discountRatePct: 10,
  terminalGrowthPct: 2,
  modeProfiles: {
    greenfield: { initialInvestment: 10, annualOperatingCost: 0, revenueCapturePct: 100 },
  },
} as const;

describe("evaluateFinancials", () => {
  it("calculates tax, working capital, terminal value, ROI and NPV", () => {
    const result = evaluateFinancials(completeAssumptions, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    const alternative = result.alternatives[0];

    expect(result.status).toBe("ok");
    expect(result.market.samAtHorizon).toBe(500);
    expect(result.market.somRevenueAtHorizon).toBe(50);
    expect(alternative.annualProjection[0]).toMatchObject({ revenue: 50, operatingProfit: 10, taxes: 2, changeInWorkingCapital: 5, freeCashFlow: 3 });
    expect(alternative.annualProjection[1]).toMatchObject({ freeCashFlow: 8, changeInWorkingCapital: 0 });
    expect(alternative.roiPct).toBe(90);
    expect(alternative.terminalValue).toBe(100.75);
    expect(alternative.npv).toBe(81.04);
    expect(alternative.paybackYear).toBe(1.88);
  });

  it("converts local flows to a reporting currency when an FX rate is provided", () => {
    const result = evaluateFinancials({ ...completeAssumptions, currency: "MXN", reportingCurrency: "USD", fxRateToReportingCurrency: 0.05 }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    expect(result.currency).toBe("USD");
    expect(result.market.tamYearOne).toBe(50);
    expect(result.alternatives[0].initialInvestment).toBe(0.5);
  });

  it("does not replace missing financial inputs with zero", () => {
    const result = evaluateFinancials({ currency: "EUR", tamYearOne: 1000 }, [{ key: "digital", mode: "Entrada digital" }], 3);
    expect(result.status).toBe("insufficient_data");
    expect(result.market.tamAtHorizon).toBeNull();
    expect(result.alternatives[0].status).toBe("insufficient_data");
    expect(result.alternatives[0].roiPct).toBeNull();
  });

  it("fails closed when discount rate does not exceed terminal growth", () => {
    const result = evaluateFinancials({ ...completeAssumptions, discountRatePct: 2, terminalGrowthPct: 2 }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    expect(result.alternatives[0].status).toBe("not_meaningful");
    expect(pick(result.alternatives[0].missingInputs[0], "es")).toContain("tasa de descuento");
    expect(pick(result.alternatives[0].missingInputs[0], "en")).toContain("discount rate");
  });

  it("calculates base, optimistic and conservative cases with price, margin and FX sensitivity", () => {
    const result = evaluateFinancials({
      ...completeAssumptions,
      currency: "MXN",
      reportingCurrency: "USD",
      fxRateToReportingCurrency: 0.05,
      sensitivityScenarios: {
        optimistic: { priceRevenuePct: 20, operatingMarginPctPoints: 5, fxRatePct: 10 },
        conservative: { priceRevenuePct: -20, operatingMarginPctPoints: -5, fxRatePct: -10 },
      },
    }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    const base = result.scenarios.find((scenario) => scenario.key === "base")!;
    const optimistic = result.scenarios.find((scenario) => scenario.key === "optimistic")!;
    const conservative = result.scenarios.find((scenario) => scenario.key === "conservative")!;

    expect(result.scenarios).toHaveLength(3);
    expect(base.status).toBe("ok");
    expect(optimistic.status).toBe("ok");
    expect(conservative.status).toBe("ok");
    expect(optimistic.financial?.alternatives[0]?.npv).toBeGreaterThan(base.financial?.alternatives[0]?.npv ?? -Infinity);
    expect(conservative.financial?.alternatives[0]?.npv).toBeLessThan(base.financial?.alternatives[0]?.npv ?? Infinity);
    expect(optimistic.financial?.fxRateToReportingCurrency).toBeCloseTo(0.055);
    expect(conservative.financial?.fxRateToReportingCurrency).toBeCloseTo(0.045);
  });
});

describe("recommendInvestmentAction", () => {
  const financial = evaluateFinancials(completeAssumptions, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);

  it("recommends advance only when strategic and financial thresholds pass", () => {
    const recommendation = recommendInvestmentAction(financial, 75, 80, { advanceMinRiskAdjusted: 65, minConfidence: 60, advanceMinNpv: 0, advanceMinRoiPct: 20, advanceMaxPaybackYears: 3 });
    expect(recommendation.action).toBe("advance");
    expect(recommendation.selectedMode).toBe("Filial propia / greenfield");
  });

  it("downgrades a viable but weaker case to test", () => {
    const recommendation = recommendInvestmentAction(financial, 55, 80, { advanceMinRiskAdjusted: 65, testMinRiskAdjusted: 50, minConfidence: 60, advanceMinNpv: 0, testMinNpv: 0, advanceMinRoiPct: 100, testMinRoiPct: 0, advanceMaxPaybackYears: 3 });
    expect(recommendation.action).toBe("test");
  });

  it("does not issue an investment decision with incomplete financial evidence", () => {
    const incomplete = evaluateFinancials({ currency: "USD", tamYearOne: 1 }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    expect(recommendInvestmentAction(incomplete, 90, 90).action).toBe("insufficient_data");
  });
});

describe("modelos económicos por modo", () => {
  const marketOnly = {
    currency: "USD",
    tamYearOne: 1000,
    annualMarketGrowthPct: 0,
    samPct: 50,
    somPctYearOne: 10,
    somPctHorizon: 10,
    operatingMarginPct: 20,
    taxRatePct: 20,
    workingCapitalPctRevenue: 10,
    discountRatePct: 10,
    terminalGrowthPct: 2,
  } as const;

  it("valora una licencia por royalty y no como una filial propia", () => {
    const assumptions = {
      ...marketOnly,
      modeProfiles: {
        greenfield: { initialInvestment: 10, annualOperatingCost: 0, revenueCapturePct: 100 },
        licensing: { initialInvestment: 10, annualOperatingCost: 0, revenueCapturePct: 100, royaltyRatePct: 7, upfrontFee: 5, componentMarginPct: 1 },
      },
    };
    const result = evaluateFinancials(assumptions, [
      { key: "greenfield", mode: "Filial propia / greenfield" },
      { key: "licensing", mode: "Licencia o franquicia" },
    ], 3);
    const greenfield = result.alternatives.find((alternative) => alternative.key === "greenfield")!;
    const licensing = result.alternatives.find((alternative) => alternative.key === "licensing")!;

    expect(greenfield.economicModel).toBe("operator");
    expect(licensing.economicModel).toBe("royalty");
    // Ventas del licenciatario 50; royalty 7% + margen de componentes 1% = 4, más el pago inicial de 5 en el año 1.
    expect(licensing.annualProjection[0].revenue).toBe(9);
    expect(licensing.annualProjection[1].revenue).toBe(4);
    // Una licencia no inmoviliza capital de trabajo propio.
    expect(licensing.annualProjection.every((year) => year.changeInWorkingCapital === 0)).toBe(true);
    expect(licensing.npv).not.toBe(greenfield.npv);
    // El pago inicial no se perpetúa en el valor terminal.
    expect(licensing.terminalValue).toBeLessThan(greenfield.terminalValue!);
  });

  it("aplica el margen de canal a un distribuidor", () => {
    const result = evaluateFinancials({
      ...marketOnly,
      modeProfiles: { distributor: { initialInvestment: 2, annualOperatingCost: 0, revenueCapturePct: 100, channelMarginPct: 30 } },
    }, [{ key: "distributor", mode: "Agente o distribuidor" }], 3);
    const distributor = result.alternatives[0];
    expect(distributor.economicModel).toBe("channel");
    expect(distributor.annualProjection[0].revenue).toBe(15);
  });

  it("trata la oficina de representación como coste sin valor terminal", () => {
    const result = evaluateFinancials({
      ...marketOnly,
      modeProfiles: { office: { initialInvestment: 3, annualOperatingCost: 4, revenueCapturePct: 0 } },
    }, [{ key: "office", mode: "Oficina de representación / observatorio" }], 3);
    const office = result.alternatives[0];
    expect(office.economicModel).toBe("cost_only");
    expect(office.status).toBe("ok");
    expect(office.terminalValue).toBeNull();
    expect(office.npv).toBeLessThan(0);
    // No compite por NPV: la decisión de inversión no puede seleccionarla.
    expect(recommendInvestmentAction(result, 90, 90).selectedModeKey).not.toBe("office");
  });
});

describe("escudo fiscal, rampa y bases de retorno", () => {
  const lossMaking = {
    currency: "USD",
    tamYearOne: 1000,
    annualMarketGrowthPct: 0,
    samPct: 50,
    somPctYearOne: 2,
    somPctHorizon: 20,
    operatingMarginPct: 20,
    taxRatePct: 25,
    workingCapitalPctRevenue: 0,
    discountRatePct: 10,
    terminalGrowthPct: 2,
    modeProfiles: { greenfield: { initialInvestment: 10, annualOperatingCost: 3, revenueCapturePct: 100 } },
  } as const;

  it("compensa pérdidas iniciales antes de tributar", () => {
    const withShield = evaluateFinancials(lossMaking, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 4).alternatives[0];
    const withoutShield = evaluateFinancials({ ...lossMaking, taxLossCarryforward: false }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 4).alternatives[0];

    expect(withShield.annualProjection[0].operatingProfit).toBeLessThan(0);
    expect(withShield.annualProjection[0].taxes).toBe(0);
    // La base imponible del primer año rentable queda reducida por las pérdidas acumuladas.
    const firstProfitable = withShield.annualProjection.find((year) => year.operatingProfit > 0)!;
    expect(firstProfitable.taxableProfit).toBeLessThan(firstProfitable.operatingProfit);
    expect(withShield.npv!).toBeGreaterThan(withoutShield.npv!);
  });

  it("respeta los extremos de la rampa en curva en S y difiere del reparto lineal", () => {
    const linear = evaluateFinancials(lossMaking, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 5).alternatives[0];
    const sCurve = evaluateFinancials({ ...lossMaking, somRampShape: "s_curve" }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 5).alternatives[0];

    expect(sCurve.annualProjection[0].revenue).toBe(linear.annualProjection[0].revenue);
    expect(sCurve.annualProjection[4].revenue).toBe(linear.annualProjection[4].revenue);
    expect(sCurve.annualProjection[1].revenue).toBeLessThan(linear.annualProjection[1].revenue);
  });

  it("exige la serie completa cuando la rampa es manual", () => {
    const incomplete = evaluateFinancials({ ...lossMaking, somRampShape: "manual", somPctByYear: [2, null, 20] }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);
    expect(incomplete.status).toBe("insufficient_data");
  });

  it("publica las dos bases de retorno y compara contra la declarada", () => {
    const result = evaluateFinancials(lossMaking, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 4);
    const alternative = result.alternatives[0];
    expect(alternative.roiPct).not.toBe(alternative.roiIncludingTerminalPct);
    expect(alternative.valueMultiple).toBeGreaterThan(0);

    const horizonBasis = recommendInvestmentAction(result, 90, 90, { roiBasis: "operating_horizon", advanceMinRoiPct: 20, advanceMaxPaybackYears: 10 });
    const terminalBasis = recommendInvestmentAction(result, 90, 90, { roiBasis: "including_terminal", advanceMinRoiPct: 20, advanceMaxPaybackYears: 10 });
    expect(horizonBasis.evaluatedMetrics.roiPct).toBe(alternative.roiPct);
    expect(terminalBasis.evaluatedMetrics.roiPct).toBe(alternative.roiIncludingTerminalPct);
  });

  it("ordena las palancas del tornado por amplitud de NPV", () => {
    const result = evaluateFinancials(lossMaking, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 4, { tornadoDeltaPct: 15 });
    expect(result.tornado.modeKey).toBe("greenfield");
    expect(result.tornado.deltaPct).toBe(15);
    expect(result.tornado.levers.length).toBeGreaterThan(3);
    const swings = result.tornado.levers.map((lever) => lever.swing ?? 0);
    expect([...swings].sort((a, b) => b - a)).toEqual(swings);
    // La divisa no es palanca cuando moneda local y de reporte coinciden.
    expect(result.tornado.levers.some((lever) => lever.key === "fxRate")).toBe(false);
  });

  it("no emite veredicto cuando la cobertura de evidencia es insuficiente", () => {
    const result = evaluateFinancials(lossMaking, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 4);
    const recommendation = recommendInvestmentAction(result, 90, 30, { minConfidence: 60 });
    expect(recommendation.action).toBe("insufficient_data");
    expect(pick(recommendation.label, "es")).toBe("Completar evidencia");
    expect(pick(recommendation.label, "en")).toBe("Complete the evidence");
    expect(pickAll(recommendation.reasons, "es").join(" ")).toContain("cobertura de evidencia");
  });
});
