import { describe, expect, it } from "vitest";
import { evaluateFinancials } from "./financialEngine";

describe("evaluateFinancials", () => {
  it("calculates TAM/SAM/SOM, simple ROI and NPV for an entry alternative", () => {
    const result = evaluateFinancials({
      currency: "USD",
      tamYearOne: 1000,
      annualMarketGrowthPct: 0,
      samPct: 50,
      somPctYearOne: 10,
      somPctHorizon: 10,
      operatingMarginPct: 20,
      discountRatePct: 10,
      modeProfiles: {
        greenfield: { initialInvestment: 10, annualOperatingCost: 0, revenueCapturePct: 100 },
      },
    }, [{ key: "greenfield", mode: "Filial propia / greenfield" }], 3);

    expect(result.status).toBe("ok");
    expect(result.market.samAtHorizon).toBe(500);
    expect(result.market.somRevenueAtHorizon).toBe(50);
    expect(result.alternatives[0].roiPct).toBe(200);
    expect(result.alternatives[0].npv).toBeCloseTo(14.87, 2);
    expect(result.alternatives[0].paybackYear).toBe(1);
  });

  it("does not replace missing financial inputs with zero", () => {
    const result = evaluateFinancials({ currency: "EUR", tamYearOne: 1000 }, [{ key: "digital", mode: "Entrada digital" }], 3);
    expect(result.status).toBe("insufficient_data");
    expect(result.market.tamAtHorizon).toBeNull();
    expect(result.alternatives[0].status).toBe("insufficient_data");
    expect(result.alternatives[0].roiPct).toBeNull();
  });
});
