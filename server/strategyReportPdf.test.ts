import { describe, expect, it } from "vitest";
import { buildStrategyPdf } from "../client/src/lib/strategyReportPdf";

describe("buildStrategyPdf", () => {
  it("builds a multi-page PDF with strategic, financial and annual cash-flow content", () => {
    const pdf = buildStrategyPdf({
      scenarioName: "Caso de prueba",
      companyName: "Empresa S.A.",
      homeCountry: "España",
      industry: "Software",
      businessModel: "SaaS",
      valueProposition: "Automatización B2B",
      objectiveLabel: "Desarrollo de mercado",
      horizonYears: "3",
      generatedAt: "2026-09-09T18:00:00.000Z",
      portfolio: { leadingCountry: "Mercado A", recommendation: "Mercado A lidera.", caveats: ["Validar la regulación local."] },
      thresholds: { advanceMinRiskAdjusted: 65, testMinRiskAdjusted: 50, minConfidence: 60, advanceMinNpv: 0 },
      countries: [{
        code: "AA", name: "Mercado A",
        scores: { attractiveness: 80, safety: 75, riskAdjusted: 79, confidence: 82 },
        timing: { label: "Actuar", description: "Ventana favorable." },
        flags: [],
        entryModes: [{ mode: "Entrada digital", commitment: "Bajo", rationale: "Modelo escalable." }],
        investmentRecommendation: { action: "advance", label: "Avanzar", summary: "Supera los umbrales.", selectedMode: "Entrada digital", reasons: ["NPV positivo."] },
        financial: {
          status: "ok", currency: "EUR", localCurrency: "EUR", reportingCurrency: "EUR", fxRateToReportingCurrency: 1, horizonYears: 3,
          assumptions: { taxRatePct: 25, workingCapitalPctRevenue: 10, discountRatePct: 10, terminalGrowthPct: 2 },
          market: { tamYearOne: 1_000_000, tamAtHorizon: 1_100_000, samAtHorizon: 330_000, somRevenueYearOne: 5_000, somRevenueAtHorizon: 13_200 },
          alternatives: [{ key: "digital", mode: "Entrada digital", status: "ok", roiPct: 45, npv: 25000, paybackYear: 2, initialInvestment: 10000, annualOperatingCost: 5000, revenueCapturePct: 100, cumulativeFreeCashFlow: 14500, terminalValue: 50000, presentValueTerminal: 37500, missingInputs: [], annualProjection: [{ year: 1, revenue: 5000, operatingProfit: 1500, taxes: 375, changeInWorkingCapital: 500, freeCashFlow: 625, presentValue: 568 }, { year: 2, revenue: 9000, operatingProfit: 2700, taxes: 675, changeInWorkingCapital: 400, freeCashFlow: 1625, presentValue: 1343 }] }],
          scenarios: [
            { key: "base", label: "Base", priceRevenuePct: 0, operatingMarginPctPoints: 0, fxRatePct: 0, status: "ok", financial: null, missingInputs: [], note: "Caso base." },
            { key: "optimistic", label: "Optimista", priceRevenuePct: 10, operatingMarginPctPoints: 2, fxRatePct: 3, status: "ok", financial: null, missingInputs: [], note: "Caso optimista." },
            { key: "conservative", label: "Conservador", priceRevenuePct: -10, operatingMarginPctPoints: -2, fxRatePct: -3, status: "ok", financial: null, missingInputs: [], note: "Caso conservador." },
          ],
          missingInputs: [], methodology: "Método de prueba.",
        },
      }],
    });

    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    const header = new TextDecoder().decode(bytes.slice(0, 4));
    expect(header).toBe("%PDF");
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(4);
  });
});
