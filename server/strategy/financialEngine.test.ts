import { describe, expect, it } from "vitest";
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
    expect(alternative.paybackYear).toBe(2);
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
    expect(result.alternatives[0].missingInputs[0]).toContain("tasa de descuento");
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
