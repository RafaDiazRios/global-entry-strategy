import { pick, pickAll } from "@shared/i18n";
import { describe, expect, it } from "vitest";
import { evaluateStrategy } from "./engine";
import { buildSituation, scoreEntryModes } from "./entryModeScoring";

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
          calibrationNotes: {
            demandQuality: { rationale: "Tres entrevistas con responsables de operaciones del sector.", sourceLabel: "Entrevistas de campo, mayo" },
            resourceFit: { rationale: "Disponibilidad de perfiles técnicos verificada con dos partners locales." },
            competitionAttractiveness: { rationale: "Cinco fuerzas revisadas: dos incumbentes, sin sobrecapacidad." },
            governmentOpenness: { rationale: "Régimen de inversión extranjera sin restricción sectorial." },
            cageDistance: { rationale: "Idioma y marco legal próximos; distancia económica moderada." },
            politicalRisk: { rationale: "Estabilidad institucional alta según WGI y prensa local." },
            economicRisk: { rationale: "Coeficiente de variación del crecimiento por debajo de la media regional." },
            competitiveRisk: { rationale: "Sin señales de cartelización en las licitaciones revisadas." },
            operationalRisk: { rationale: "Infraestructura y proveedores contrastados con dos clientes actuales." },
            internalReadiness: { rationale: "Equipo con dos entradas previas en mercados comparables." },
            timePressure: { rationale: "Dos competidores globales anunciaron entrada este año." },
            controlNeed: { rationale: "El dato de cliente es el activo central del modelo." },
            ipSensitivity: { rationale: "El motor de reglas es propietario y no está patentado." },
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
    expect(result.countries[0].entryModes.some((mode) => pick(mode.mode, "es") === "Entrada digital o híbrida")).toBe(true);
    expect(result.portfolio.leadingCountry).toBe("Mercado A");
    expect(result.countries[0].financial.market.tamAtHorizon).toBeGreaterThan(1_000_000);
    expect(result.countries[0].financial.alternatives).toHaveLength(7);
    expect(result.countries[0].investmentRecommendation.action).not.toBe("insufficient_data");
    expect(result.countries[0].evidence.documentedJudgements).toBe(13);
    expect(result.countries[0].scores.confidence).toBeGreaterThanOrEqual(60);
    expect(result.countries[0].eligibility.eligible).toBe(true);
    // Cada modo trae la procedencia de su perfil y el desglose de los ocho criterios.
    expect(result.countries[0].entryModes[0].criteria).toHaveLength(8);
    expect(pick(result.countries[0].entryModes[0].provenance, "es")).toContain("7.4");
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
    expect(result.countries[0].evidence.documentedJudgements).toBe(0);
    expect(pickAll(result.countries[0].flags, "es")).toContain("Datos macroeconómicos incompletos o no disponibles: la puntuación se apoya más en calibración cualitativa.");
    expect(pickAll(result.countries[0].flags, "en")).toContain("Macroeconomic data incomplete or unavailable: the score leans more on qualitative calibration.");
  });
});

describe("criterios eliminatorios y modos de entrada", () => {
  const base = {
    companyName: "Prueba",
    homeCountry: "España",
    industry: "Equipamiento industrial",
    businessModel: "B2B",
    valueProposition: "Equipos de control de procesos.",
    objective: "market" as const,
    horizonYears: 3,
    marketData: {
      AA: { gdpUsd: 500_000_000_000, gdpPerCapita: 12_000, gdpGrowth: 4, population: 45_000_000, urbanization: 70, internetUse: 70, tradeOpenness: 60, investmentRate: 22, sourceYear: 2024, sourceStatus: "live" as const },
    },
  };

  it("excluye un país que incumple un umbral eliminatorio, por alta que sea su atractividad", () => {
    const result = evaluateStrategy({
      ...base,
      countryInputs: [{
        code: "AA",
        name: "Mercado A",
        calibration: { demandQuality: 95, resourceFit: 90, competitionAttractiveness: 85, governmentOpenness: 80, cageDistance: 20, politicalRisk: 85, economicRisk: 30, competitiveRisk: 30, operationalRisk: 30, internalReadiness: 80, timePressure: 60, controlNeed: 60, ipSensitivity: 40 },
      }],
      knockOuts: { maxPoliticalRisk: 70 },
    });

    const country = result.countries[0];
    expect(country.eligibility.eligible).toBe(false);
    expect(country.eligibility.breaches[0].rule).toBe("maxPoliticalRisk");
    expect(country.investmentRecommendation.action).toBe("discard");
    expect(pick(country.investmentRecommendation.label, "es")).toContain("eliminatorio");
    expect(pick(country.investmentRecommendation.label, "en")).toContain("knock-out");
    expect(result.portfolio.leadingCountry).toBeUndefined();
    expect(pickAll(country.flags, "es").some((flag) => flag.startsWith("Criterio eliminatorio"))).toBe(true);
    expect(pickAll(country.flags, "en").some((flag) => flag.startsWith("Knock-out criterion"))).toBe(true);
  });

  it("ofrece el modo digital según el modelo de entrega declarado y no por el texto libre", () => {
    const countryInputs = [{ code: "AA", name: "Mercado A" }];
    const relational = evaluateStrategy({ ...base, countryInputs, entryDeliveryModel: "relational" });
    const hybrid = evaluateStrategy({ ...base, countryInputs, entryDeliveryModel: "hybrid" });

    expect(relational.countries[0].financial.alternatives.some((alternative) => alternative.key === "digital")).toBe(false);
    expect(hybrid.countries[0].financial.alternatives.some((alternative) => alternative.key === "digital")).toBe(true);
  });

  it("reordena los modos cuando cambian los pesos de los criterios de la Tabla 7.4", () => {
    // La sensibilidad de IP es alta y la capacidad interna baja: el caso típico de licencia.
    const situation = buildSituation({
      objective: "market",
      attractiveness: 65,
      safety: 60,
      internalReadiness: 30,
      timePressure: 80,
      controlNeed: 50,
      ipSensitivity: 90,
    });
    const balanced = scoreEntryModes(situation, { includeDigital: false });
    const leakageAverse = scoreEntryModes(situation, { includeDigital: false, weights: { technologicalLeakage: 80 } });
    const scoreOf = (ranking: typeof balanced, key: string) => ranking.find((mode) => mode.key === key)!.score;

    // Al primar la fuga tecnológica, la licencia pierde y la oficina de representación gana.
    expect(scoreOf(leakageAverse, "licensing")).toBeLessThan(scoreOf(balanced, "licensing"));
    expect(scoreOf(leakageAverse, "office")).toBeGreaterThan(scoreOf(balanced, "office"));

    const leakageCriterion = balanced.find((mode) => mode.key === "licensing")!.criteria.find((criterion) => criterion.key === "technologicalLeakage")!;
    expect(leakageCriterion.modeValue).toBe(85);
    expect(leakageCriterion.situationValue).toBe(90);
    expect(leakageCriterion.fit).toBeLessThan(30);
  });
});
