import { describe, expect, it } from "vitest";
import { emptyAmbitionInput, industryDemandFor, INDUSTRY_DEMAND_TABLE } from "@shared/domain/globalAmbition";
import { ambitionCompleteness, ambitionGap, computeIndices, DEFAULT_THRESHOLDS, overlapIndex, positionOnAmbitionMap } from "./globalAmbition";

/**
 * Test de aceptación de la Fase 3: el learning assignment 1 del capítulo 5, p. 220.
 *
 * El enunciado da la distribución de la industria del gas industrial en 2020 y las ventas y
 * activos de Air Liquide por regiones, y pregunta por su posición en el mapa GCI/GRI. Es la
 * única comprobación del capítulo con datos reales y respuesta esperable, así que es la que
 * fija la convención de cálculo.
 *
 * (El libro llama a Air Liquide «the insurance company» en esa página; es una errata del
 * original: Air Liquide es la industria del gas del propio enunciado.)
 */
function airLiquide() {
  const input = emptyAmbitionInput("three_regions");
  input.industryDemand = { americas: 42, europe: 30, asia_row: 28 };
  input.companyRevenue = { europe: 6800, americas: 7800, asia_row: 5000 };
  input.companyCapability = { europe: 10500, americas: 18400, asia_row: 2000 };
  input.capabilityBasis = "assets";
  return input;
}

describe("learning assignment 1, p. 220 — Air Liquide", () => {
  it("reparte las ventas casi como el mercado mundial y da un GRI muy alto", () => {
    const indices = computeIndices(airLiquide());
    expect(indices.gri).toBeCloseTo(0.9531, 4);
  });

  it("da un GCI menor porque los activos están escorados a América", () => {
    const indices = computeIndices(airLiquide());
    expect(indices.gci).toBeCloseTo(0.7847, 4);
    expect(indices.gci as number).toBeLessThan(indices.gri as number);
  });

  it("la sitúa como jugador global en el mapa de la Fig. 5.5", () => {
    const indices = computeIndices(airLiquide());
    const position = positionOnAmbitionMap(indices.gri as number, indices.gci as number);
    expect(position.role).toBe("global_player");
    expect(position.zone).toBe("Jugador global");
  });

  it("normaliza a porcentajes aunque los datos entren en millones de euros", () => {
    const indices = computeIndices(airLiquide());
    const sum = Object.values(indices.normalized.revenue).reduce((total, share) => total + share, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(indices.normalized.revenue.americas).toBeCloseTo(7800 / 19600, 6);
  });
});

describe("índice de solapamiento", () => {
  it("vale 1 cuando la empresa reparte exactamente como el mercado", () => {
    const shares = { americas: 0.42, europe: 0.3, asia_row: 0.28 };
    expect(overlapIndex(shares, shares, Object.keys(shares))).toBe(1);
  });

  it("cae al peso de la región cuando la empresa vende en una sola", () => {
    const industry = { americas: 0.42, europe: 0.3, asia_row: 0.28 };
    const concentrated = { americas: 1, europe: 0, asia_row: 0 };
    expect(overlapIndex(concentrated, industry, Object.keys(industry))).toBeCloseTo(0.42, 6);
  });

  it("coincide con 1 menos la mitad de la distancia absoluta entre distribuciones", () => {
    const industry = { americas: 0.42, europe: 0.3, asia_row: 0.28 };
    const company = { americas: 0.6, europe: 0.1, asia_row: 0.3 };
    const regions = Object.keys(industry);
    const distance = regions.reduce((total, region) => total + Math.abs(company[region as keyof typeof company] - industry[region as keyof typeof industry]), 0);
    expect(overlapIndex(company, industry, regions)).toBeCloseTo(1 - distance / 2, 6);
  });
});

describe("mapa de ambición", () => {
  it("distingue exportador global de aprovisionador global", () => {
    expect(positionOnAmbitionMap(0.9, 0.2).role).toBe("global_exporter");
    expect(positionOnAmbitionMap(0.2, 0.9).role).toBe("global_sourcer");
  });

  it("deja la zona intermedia como dominante regional, siguiendo la figura y no el texto", () => {
    const position = positionOnAmbitionMap(0.5, 0.5);
    expect(position.role).toBe("regional_dominant_global_player");
  });

  it("llama jugador regional solo a quien está bajo en los dos ejes", () => {
    expect(positionOnAmbitionMap(0.2, 0.2).role).toBe("regional_player");
    expect(DEFAULT_THRESHOLDS.low).toBeLessThan(DEFAULT_THRESHOLDS.high);
  });
});

describe("brecha de ambición", () => {
  it("señala la contradicción entre lo que la empresa dice ser y lo que dicen sus números", () => {
    const input = airLiquide();
    input.currentRole = "regional_player";
    const gap = ambitionGap(input, computeIndices(input));
    expect(gap.selfAssessmentMismatch).toBe(true);
    expect(gap.note).toMatch(/contradicción/);
  });

  it("no inventa brecha cuando el objetivo coincide con la posición observada", () => {
    const input = airLiquide();
    input.currentRole = "global_player";
    input.targetRole = "global_player";
    const gap = ambitionGap(input, computeIndices(input));
    expect(gap.hasGap).toBe(false);
    expect(gap.selfAssessmentMismatch).toBe(false);
  });
});

describe("Tabla 5.2 como semilla", () => {
  it("trae las quince industrias más el PIB de referencia", () => {
    expect(INDUSTRY_DEMAND_TABLE).toHaveLength(16);
    expect(INDUSTRY_DEMAND_TABLE.find((row) => row.id === "tyres")?.shares.asia_pacific).toBe(42);
  });

  it("agrega Asia Pacífico con Oriente Medio y África al pasar a tres regiones", () => {
    const four = INDUSTRY_DEMAND_TABLE.find((row) => row.id === "chemicals")!.shares;
    const three = industryDemandFor("chemicals", "three_regions")!;
    expect(three.asia_row).toBe(four.asia_pacific + four.mea);
    expect(three.europe).toBe(four.europe);
  });
});

describe("exhaustividad", () => {
  it("no da por completo un módulo sin liability of foreignness", () => {
    const input = airLiquide();
    input.currentRole = "global_player";
    input.targetRole = "global_player";
    input.targetHorizonYears = 5;
    input.stage = "global";
    input.motives = input.motives.map((motive) => (motive.id === "market_seeking" ? { ...motive, selected: true, justification: "Crecimiento en Asia" } : motive));
    input.countryRoles = [{ countryCode: "CHN", role: "key", justification: "Mayor mercado de gas industrial" }];
    const before = ambitionCompleteness(input, computeIndices(input));
    expect(before.complete).toBe(false);
    expect(before.missing).toContain("Liability of foreignness declarada");

    input.liabilityOfForeignness = "Sin red local de distribución industrial; se compensa con tecnología de separación de aire propia.";
    expect(ambitionCompleteness(input, computeIndices(input)).complete).toBe(true);
  });
});
