import { describe, expect, it } from "vitest";
import { itemPath } from "@shared/domain/countryAssessment";
import {
  classifyCountryProfile,
  deriveCalibration,
  growthVariability,
  positionOnOpportunityRiskMatrix,
  scoreBlock,
  scoreGroup,
  summarizeAssessment,
  variabilityRating,
  type CountryAssessment,
} from "./countryAssessment";
import type { MarketData, QualitativeCalibration } from "./engine";

const neutral: QualitativeCalibration = {
  demandQuality: 50, resourceFit: 50, competitionAttractiveness: 50, governmentOpenness: 50,
  cageDistance: 50, politicalRisk: 50, economicRisk: 50, competitiveRisk: 50, operationalRisk: 50,
  internalReadiness: 50, timePressure: 50, controlNeed: 50, ipSensitivity: 50,
};

describe("puntuación de bloques", () => {
  it("no confunde un ítem sin evaluar con un cero", () => {
    const assessment: CountryAssessment = { ratings: { [itemPath("market", "demand", "size")]: 4 } };
    const block = scoreBlock(assessment, "market");
    expect(block.assessed).toBe(1);
    expect(block.raw).toBe(100);
    expect(block.coverage).toBeLessThan(0.2);

    const empty = scoreBlock({ ratings: {} }, "market");
    expect(empty.raw).toBeNull();
    expect(empty.coverage).toBe(0);
  });

  it("invierte los bloques adversos para leerlos siempre como más es mejor", () => {
    const highRisk: CountryAssessment = {
      ratings: {
        [itemPath("risk", "competitive", "corruption")]: 4,
        [itemPath("risk", "competitive", "cartels")]: 4,
        [itemPath("risk", "competitive", "networks")]: 4,
      },
    };
    const group = scoreGroup(highRisk, "risk", "competitive");
    expect(group.raw).toBe(100);
    expect(group.favourable).toBe(0);
  });
});

describe("derivación de la calibración", () => {
  it("sustituye los factores de país y conserva los de la empresa", () => {
    const assessment: CountryAssessment = {
      ratings: {
        [itemPath("cage", "cultural", "language")]: 4,
        [itemPath("cage", "cultural", "values")]: 3,
        [itemPath("cage", "administrative", "legalFramework")]: 4,
        [itemPath("risk", "competitive", "corruption")]: 3,
        [itemPath("risk", "competitive", "cartels")]: 3,
        [itemPath("risk", "competitive", "networks")]: 3,
      },
    };
    const { calibration, derived } = deriveCalibration(assessment, { ...neutral, internalReadiness: 82, ipSensitivity: 91 });

    expect(calibration.cageDistance).toBeGreaterThan(50);
    expect(calibration.competitiveRisk).toBe(75);
    // Capacidad interna y sensibilidad de IP describen a la empresa, no al país: no se derivan.
    expect(calibration.internalReadiness).toBe(82);
    expect(calibration.ipSensitivity).toBe(91);
    expect(derived.map((field) => field.key)).toContain("cageDistance");
    expect(derived.map((field) => field.key)).not.toContain("internalReadiness");
    expect(derived.find((field) => field.key === "competitiveRisk")?.coverage).toBe(1);
  });

  it("mantiene el valor manual de los bloques que no se han evaluado", () => {
    const { calibration, derived } = deriveCalibration({ ratings: {} }, { ...neutral, demandQuality: 71 });
    expect(calibration.demandQuality).toBe(71);
    expect(derived).toHaveLength(0);
  });

  it("pondera los incentivos por debajo de la política gubernamental", () => {
    const base: CountryAssessment = { ratings: { [itemPath("industry", "forces", "governmentPolicy")]: 0 } };
    const withIncentives: CountryAssessment = { ...base, incentives: ["tax.holiday", "financial.subsidies", "trade.importDuty"] };
    const withoutIncentives = deriveCalibration(base, neutral).calibration.governmentOpenness;
    const withThem = deriveCalibration(withIncentives, neutral).calibration.governmentOpenness;
    // Los incentivos mueven el resultado, pero no lo dominan (p. 242).
    expect(withThem).not.toBe(withoutIncentives);
    expect(Math.abs(withThem - withoutIncentives)).toBeLessThan(12);
  });
});

describe("variabilidad del crecimiento", () => {
  it("reproduce la lectura del libro: mismo crecimiento medio, distinto riesgo", () => {
    // Series ilustrativas con media próxima y dispersión distinta (Figura 6.13, p. 245).
    const stable = growthVariability([2.6, 2.9, 3.1, 2.7, 2.8, 3.0, 2.5, 2.9]);
    const volatile = growthVariability([2.6, -1.5, 6.4, 0.4, 5.8, -0.9, 4.7, 3.0]);

    expect(stable.coefficientOfVariation).not.toBeNull();
    expect(volatile.coefficientOfVariation).not.toBeNull();
    expect(volatile.coefficientOfVariation!).toBeGreaterThan(stable.coefficientOfVariation!);
    expect(variabilityRating(volatile.coefficientOfVariation)).toBeGreaterThan(variabilityRating(stable.coefficientOfVariation)!);
  });

  it("no calcula con menos de tres observaciones", () => {
    expect(growthVariability([2.1, 3.0]).coefficientOfVariation).toBeNull();
    expect(variabilityRating(null)).toBeNull();
  });
});

describe("perfil de país y matriz de síntesis", () => {
  const hubLike: MarketData = {
    gdpUsd: 340e9, gdpPerCapita: 60_000, population: 5_600_000, internetUse: 92,
    governance: { politicalStability: 88, governmentEffectiveness: 95, regulatoryQuality: 96, ruleOfLaw: 94, controlOfCorruption: 96, sourceYear: 2024, sourceStatus: "live" },
    sourceStatus: "live",
  };
  const giantLike: MarketData = {
    gdpUsd: 3_400e9, gdpPerCapita: 2_400, population: 1_400_000_000, internetUse: 46,
    governance: { politicalStability: 30, governmentEffectiveness: 60, regulatoryQuality: 45, ruleOfLaw: 52, controlOfCorruption: 45, sourceYear: 2024, sourceStatus: "live" },
    sourceStatus: "live",
  };

  it("distingue un hub de un gigante emergente", () => {
    expect(classifyCountryProfile(hubLike).best?.key).toBe("hub");
    expect(classifyCountryProfile(giantLike).best?.key).toBe("emergingGiant");
  });

  it("respeta el perfil fijado a mano", () => {
    expect(classifyCountryProfile(hubLike, { profileOverride: "resourceRich" }).best?.key).toBe("resourceRich");
  });

  it("no clasifica sin rasgos observables", () => {
    expect(classifyCountryProfile({ sourceStatus: "unavailable" }).best).toBeNull();
  });

  it("sitúa cada mercado en el cuadrante correcto de la Figura 6.2", () => {
    expect(positionOnOpportunityRiskMatrix(80, 20).quadrant).toBe("highAttractiveness");
    expect(positionOnOpportunityRiskMatrix(80, 70).quadrant).toBe("highRiskHighReturn");
    expect(positionOnOpportunityRiskMatrix(30, 20).quadrant).toBe("lowRiskLowReturn");
    expect(positionOnOpportunityRiskMatrix(30, 70).quadrant).toBe("lowAttractiveness");
    // Los umbrales son parámetros, no constantes: el libro no fija una ponderación universal.
    expect(positionOnOpportunityRiskMatrix(60, 20, { opportunity: 75 }).quadrant).toBe("lowRiskLowReturn");
  });
});

describe("resumen de la evaluación", () => {
  it("mide la cobertura sobre el total de ítems del capítulo", () => {
    const summary = summarizeAssessment({ ratings: { [itemPath("market", "demand", "size")]: 3, [itemPath("market", "demand", "growth")]: 2 } });
    expect(summary.assessedItems).toBe(2);
    expect(summary.totalItems).toBeGreaterThan(50);
    expect(summary.coverage).toBeCloseTo(2 / summary.totalItems, 5);
    expect(summary.blocks.cage.assessed).toBe(0);
  });
});
