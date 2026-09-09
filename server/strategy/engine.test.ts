import { describe, expect, it } from "vitest";
import { evaluateStrategy } from "./engine";

describe("evaluateStrategy", () => {
  it("prioritizes a more attractive and safer market", () => {
    const result = evaluateStrategy({
      companyName: "Prueba",
      homeCountry: "España",
      industry: "Software B2B",
      businessModel: "SaaS",
      valueProposition: "Automatización de gestión de operaciones.",
      objective: "market",
      horizonYears: 3,
      countryInputs: [
        {
          code: "AA",
          name: "Mercado A",
          calibration: {
            demandQuality: 80, resourceFit: 70, competitionAttractiveness: 70,
            governmentOpenness: 70, cageDistance: 25, politicalRisk: 20,
            economicRisk: 20, competitiveRisk: 20, operationalRisk: 20,
            internalReadiness: 75, timePressure: 70, controlNeed: 70, ipSensitivity: 60,
          },
        },
        {
          code: "BB",
          name: "Mercado B",
          calibration: {
            demandQuality: 35, resourceFit: 40, competitionAttractiveness: 30,
            governmentOpenness: 35, cageDistance: 75, politicalRisk: 75,
            economicRisk: 70, competitiveRisk: 75, operationalRisk: 65,
            internalReadiness: 40, timePressure: 35, controlNeed: 45, ipSensitivity: 70,
          },
        },
      ],
      marketData: {
        AA: { gdpUsd: 2_000_000_000_000, gdpPerCapita: 45_000, gdpGrowth: 3.4, population: 80_000_000, urbanization: 80, internetUse: 95, tradeOpenness: 85, investmentRate: 25, sourceYear: 2024, sourceStatus: "live" },
        BB: { gdpUsd: 90_000_000_000, gdpPerCapita: 3_500, gdpGrowth: -1.2, population: 9_000_000, urbanization: 35, internetUse: 28, tradeOpenness: 35, investmentRate: 12, sourceYear: 2024, sourceStatus: "live" },
      },
      financialByCountry: {
        AA: {
          currency: "USD", tamYearOne: 1_000_000, annualMarketGrowthPct: 5, samPct: 40,
          somPctYearOne: 2, somPctHorizon: 4, operatingMarginPct: 20, taxRatePct: 25,
          workingCapitalPctRevenue: 10, discountRatePct: 10, terminalGrowthPct: 2,
          modeProfiles: { digital: { initialInvestment: 50_000, annualOperatingCost: 25_000, revenueCapturePct: 100 } },
        },
      },
    });

    expect(result.countries[0].code).toBe("AA");
    expect(result.countries[0].scores.riskAdjusted).toBeGreaterThan(result.countries[1].scores.riskAdjusted);
    expect(result.countries[0].entryModes.some((mode) => mode.mode === "Entrada digital o híbrida")).toBe(true);
    expect(result.portfolio.leadingCountry).toBe("Mercado A");
    expect(result.countries[0].financial.market.tamAtHorizon).toBeGreaterThan(1_000_000);
    expect(result.countries[0].financial.alternatives).toHaveLength(7);
    expect(result.countries[0].investmentRecommendation.action).not.toBe("insufficient_data");
  });

  it("identifies a limited-evidence situation without inventing data", () => {
    const result = evaluateStrategy({
      companyName: "Prueba",
      homeCountry: "España",
      industry: "Manufactura",
      businessModel: "B2B",
      valueProposition: "",
      objective: "resources",
      horizonYears: 2,
      countryInputs: [{ code: "CC", name: "Mercado C" }],
      marketData: { CC: { sourceStatus: "unavailable" } },
    });

    expect(result.countries[0].scores.confidence).toBeLessThan(50);
    expect(result.countries[0].flags).toContain("Datos macroeconómicos incompletos o no disponibles: la puntuación se apoya más en calibración cualitativa.");
  });
});
