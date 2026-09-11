import { describe, expect, it } from "vitest";
import { pickAll } from "@shared/i18n";
import { itemPath } from "@shared/domain/countryAssessment";
import { evaluateStrategy, type CountryInput, type MarketData } from "./engine";
import type { CountryAssessment } from "./countryAssessment";

/**
 * Criterio de aceptación de la Fase 2: resolver el mini-caso 6.2 del libro.
 *
 * Izmir Industrial Electric (IZIEC), fabricante turco de electrónica con 500 empleados,
 * evalúa una planta de montaje en Angola, Ghana, Kenia, Nigeria y Sudáfrica.
 * Lasserre y Monteiro, *Global Strategic Management*, 5.ª ed., pp. 249-251, Tabla 6.7.
 *
 * Los datos de la tabla son de 2019 y se usan tal cual: el objetivo es comprobar que la
 * herramienta ordena la decisión con las cifras del libro, no reproducir un veredicto.
 */

type CaseCountry = {
  code: string;
  name: string;
  gdpUsdBn: number;
  gdpPerCapita: number;
  populationMillions: number;
  /** Fitch Country Risk Index: 0 = riesgo alto, 100 = riesgo bajo. */
  countryRisk: number;
  /** Doing Business: 0 = peor, 100 = mejor. */
  easeOfDoingBusiness: number;
  startingABusiness: number;
  industryValueAddedPctGdp: number;
};

const caseData: CaseCountry[] = [
  { code: "AO", name: "Angola", gdpUsdBn: 88.8, gdpPerCapita: 2_791, populationMillions: 32, countryRisk: 43, easeOfDoingBusiness: 41, startingABusiness: 73, industryValueAddedPctGdp: 46 },
  { code: "GH", name: "Ghana", gdpUsdBn: 67.0, gdpPerCapita: 2_202, populationMillions: 30, countryRisk: 55, easeOfDoingBusiness: 60, startingABusiness: 84, industryValueAddedPctGdp: 30 },
  { code: "KE", name: "Kenia", gdpUsdBn: 95.5, gdpPerCapita: 1_817, populationMillions: 53, countryRisk: 51, easeOfDoingBusiness: 73, startingABusiness: 82, industryValueAddedPctGdp: 17 },
  { code: "NG", name: "Nigeria", gdpUsdBn: 448.1, gdpPerCapita: 2_230, populationMillions: 201, countryRisk: 45, easeOfDoingBusiness: 57, startingABusiness: 83, industryValueAddedPctGdp: 28 },
  { code: "ZA", name: "Sudáfrica", gdpUsdBn: 351.4, gdpPerCapita: 6_001, populationMillions: 59, countryRisk: 56, easeOfDoingBusiness: 67, startingABusiness: 81, industryValueAddedPctGdp: 23 },
];

/** El índice de Fitch se lee al revés que la escala 0-4 de la evaluación: 100 = riesgo nulo. */
function riskRating(countryRisk: number) {
  return Math.round(((100 - countryRisk) / 100) * 4 * 10) / 10;
}

function marketDataFor(country: CaseCountry): MarketData {
  return {
    gdpUsd: country.gdpUsdBn * 1e9,
    gdpPerCapita: country.gdpPerCapita,
    population: country.populationMillions * 1e6,
    gdpGrowth: 2.5,
    urbanization: 50,
    internetUse: 40,
    tradeOpenness: 55,
    investmentRate: 20,
    fdiInflowUsd: 1e9,
    fdiInflowPctGdp: 1.5,
    sourceYear: 2019,
    sourceStatus: "live",
  };
}

function assessmentFor(country: CaseCountry): CountryAssessment {
  const risk = riskRating(country.countryRisk);
  // La industria manufacturera pesa en la oportunidad de montaje; el tamaño, en la de mercado.
  const sizeRating = country.gdpUsdBn > 300 ? 3 : country.gdpUsdBn > 90 ? 2 : 1;
  const industryRating = Math.min(4, Math.round((country.industryValueAddedPctGdp / 46) * 4));
  return {
    ratings: {
      [itemPath("market", "demand", "size")]: sizeRating,
      [itemPath("market", "demand", "growth")]: 3,
      [itemPath("market", "demand", "quality")]: 2,
      [itemPath("resources", "infrastructure", "supportingIndustries")]: industryRating,
      [itemPath("resources", "human", "payProductivity")]: 3,
      [itemPath("resources", "human", "skills")]: 2,
      [itemPath("industry", "forces", "rivalry")]: 2,
      [itemPath("industry", "forces", "entryBarriers")]: 2,
      [itemPath("industry", "forces", "governmentPolicy")]: Math.round(((100 - country.easeOfDoingBusiness) / 100) * 4),
      [itemPath("cage", "geographic", "physical")]: 3,
      [itemPath("cage", "administrative", "legalFramework")]: 3,
      [itemPath("cage", "economic", "infrastructure")]: 3,
      [itemPath("risk", "politicalShareholder", "assetSpoliation")]: risk,
      [itemPath("risk", "politicalShareholder", "assetInflexibility")]: risk,
      [itemPath("risk", "politicalOperational", "marketDisruption")]: risk,
      [itemPath("risk", "economic", "growth")]: risk,
      [itemPath("risk", "economic", "exchangeRate")]: risk,
      [itemPath("risk", "competitive", "corruption")]: risk,
      [itemPath("risk", "operational", "infrastructureReliability")]: risk,
      [itemPath("risk", "operational", "taxes")]: Math.round(((100 - country.startingABusiness) / 100) * 4),
    },
    easeOfDoingBusinessScore: country.easeOfDoingBusiness,
  };
}

function buildInput(overrides: Partial<Parameters<typeof evaluateStrategy>[0]> = {}) {
  const countryInputs: CountryInput[] = caseData.map((country) => ({
    code: country.code,
    name: country.name,
    calibration: { internalReadiness: 45, timePressure: 55, controlNeed: 70, ipSensitivity: 55 },
    assessment: assessmentFor(country),
  }));
  return evaluateStrategy({
    companyName: "Izmir Industrial Electric",
    homeCountry: "Turquía",
    industry: "Electrónica industrial",
    businessModel: "Fabricación y montaje B2B",
    valueProposition: "Componentes electrónicos de control para clientes industriales.",
    objective: "market",
    horizonYears: 5,
    countryInputs,
    marketData: Object.fromEntries(caseData.map((country) => [country.code, marketDataFor(country)])),
    ...overrides,
  });
}

describe("mini-caso 6.2 — Izmir Industrial Electric", () => {
  it("evalúa los cinco mercados con perfil, cuadrante y evidencia derivada", () => {
    const result = buildInput();

    expect(result.countries).toHaveLength(5);
    for (const country of result.countries) {
      expect(country.assessment.summary.assessedItems).toBeGreaterThan(15);
      expect(country.assessment.opportunityRisk.quadrant).toBeTruthy();
      expect(country.assessment.profile.best).not.toBeNull();
      // Los factores de país vienen de la evaluación, no del deslizador neutro.
      expect(country.assessment.derivedFields.map((field) => field.key)).toEqual(
        expect.arrayContaining(["demandQuality", "cageDistance", "politicalRisk", "economicRisk", "competitiveRisk", "operationalRisk"]),
      );
    }
  });

  it("ordena Sudáfrica por delante de Angola con las cifras de la Tabla 6.7", () => {
    const result = buildInput();
    const rank = (code: string) => result.countries.findIndex((country) => country.code === code);
    // Sudáfrica combina la mejor renta per cápita con el mejor índice de riesgo del grupo;
    // Angola tiene el peor riesgo y la peor facilidad para hacer negocios.
    expect(rank("ZA")).toBeLessThan(rank("AO"));
    expect(result.countries.find((country) => country.code === "ZA")!.scores.riskAdjusted)
      .toBeGreaterThan(result.countries.find((country) => country.code === "AO")!.scores.riskAdjusted);
  });

  it("clasifica Nigeria como el mercado de mayor tamaño del grupo", () => {
    const result = buildInput();
    const nigeria = result.countries.find((country) => country.code === "NG")!;
    const ghana = result.countries.find((country) => country.code === "GH")!;
    expect(nigeria.scores.market).toBeGreaterThan(ghana.scores.market);
  });

  it("excluye Angola cuando la política fija un techo de riesgo político", () => {
    const result = buildInput({ knockOuts: { maxPoliticalRisk: 55 } });
    const angola = result.countries.find((country) => country.code === "AO")!;
    const southAfrica = result.countries.find((country) => country.code === "ZA")!;

    expect(angola.eligibility.eligible).toBe(false);
    expect(angola.investmentRecommendation.action).toBe("discard");
    expect(southAfrica.eligibility.eligible).toBe(true);
    expect(result.portfolio.leadingCountry).not.toBe("Angola");
    expect(pickAll(result.portfolio.caveats, "es").join(" ")).toContain("criterio eliminatorio");
    expect(pickAll(result.portfolio.caveats, "en").join(" ")).toContain("knock-out criterion");
  });

  it("no emite veredicto de inversión sin supuestos financieros, por completa que sea la evaluación de país", () => {
    const result = buildInput();
    for (const country of result.countries) {
      expect(country.investmentRecommendation.action).toBe("insufficient_data");
    }
  });
});
