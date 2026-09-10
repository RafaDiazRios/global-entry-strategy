import { describe, expect, it } from "vitest";
import { emptyEntryStrategyInput, ENTRY_OBJECTIVES, MODE_MAPPING, WINDOW_PHASES } from "@shared/domain/entryStrategy";
import { entryStrategyCompleteness, entryStrategyWarnings, mappingShortlist, paceProfile, phaseDefinition } from "./entryStrategy";

function base() {
  const input = emptyEntryStrategyInput();
  input.countryCode = "CHN";
  input.objectives = input.objectives.map((objective) =>
    objective.id === "market" ? { ...objective, selected: true, justification: "Segundo mercado mundial del sector" } : objective
  );
  return input;
}

describe("tablas del capítulo 7", () => {
  it("trae los cuatro objetivos de la Tabla 7.1 y las cuatro fases de la ventana", () => {
    expect(ENTRY_OBJECTIVES.map((objective) => objective.id)).toEqual(["market", "resources", "learning", "coordination"]);
    expect(WINDOW_PHASES.map((phase) => phase.id)).toEqual(["premature", "window", "competitive_growth", "mature"]);
  });

  it("cubre las nueve casillas del mapa de la Fig. 7.3", () => {
    expect(MODE_MAPPING).toHaveLength(9);
    expect(mappingShortlist("high", "poor")?.modes).toContain("Licencia");
    expect(mappingShortlist("low", "poor")?.modes).toEqual(["Exportación ocasional"]);
  });

  it("no propone nada mientras falte uno de los dos ejes", () => {
    expect(mappingShortlist("high", null)).toBeNull();
  });
});

describe("ritmo de entrada", () => {
  it("empuja a compromiso gradual cuando pesan la distancia y el riesgo", () => {
    const input = base();
    input.paceFactors = { past_experience: 0, cultural_distance: 4, country_risk: 4, available_resources: 1, entry_dispersion: 3, resources_at_stake: 4 };
    const profile = paceProfile(input);
    expect(profile.recommendation).toBe("gradual");
    expect(profile.index as number).toBeLessThan(0.4);
    expect(profile.answered).toBe(6);
  });

  it("empuja a compromiso rápido con experiencia y recursos y poco riesgo", () => {
    const input = base();
    input.paceFactors = { past_experience: 4, cultural_distance: 0, country_risk: 1, available_resources: 4, entry_dispersion: 0, resources_at_stake: 1 };
    expect(paceProfile(input).recommendation).toBe("rapido");
  });

  it("no inventa ritmo sin factores contestados", () => {
    expect(paceProfile(base()).index).toBeNull();
  });
});

describe("coherencia de la estrategia de entrada", () => {
  it("bloquea si no hay objetivo declarado", () => {
    const input = emptyEntryStrategyInput();
    const blocker = entryStrategyWarnings(input).find((warning) => warning.id === "no_objective");
    expect(blocker?.severity).toBe("block");
  });

  it("señala el modo que no encaja con la fase", () => {
    const input = base();
    input.phase = "mature";
    input.preferredMode = "licensing";
    const ids = entryStrategyWarnings(input).map((warning) => warning.id);
    expect(ids).toContain("mode_out_of_phase");
    expect(phaseDefinition("mature")?.appropriateModes).toEqual(["acquisition", "greenfield"]);
  });

  it("no deja pasar un primer entrante en fase de crecimiento competitivo", () => {
    const input = base();
    input.phase = "competitive_growth";
    input.timingStance = "first_mover";
    expect(entryStrategyWarnings(input).map((warning) => warning.id)).toContain("first_mover_too_late");
  });

  it("avisa de una inversión fuerte en fase prematura", () => {
    const input = base();
    input.phase = "premature";
    input.preferredMode = "greenfield";
    const ids = entryStrategyWarnings(input).map((warning) => warning.id);
    expect(ids).toContain("premature_commitment");
  });

  it("contrapone el ritmo gradual con un modo de compromiso alto", () => {
    const input = base();
    input.phase = "window";
    input.preferredMode = "greenfield";
    input.paceFactors = { past_experience: 0, cultural_distance: 4, country_risk: 4, available_resources: 0, entry_dispersion: 4, resources_at_stake: 4 };
    expect(entryStrategyWarnings(input).map((warning) => warning.id)).toContain("pace_against_mode");
  });

  it("acepta el modo cuando coincide con el mapa de la Fig. 7.3", () => {
    const input = base();
    input.phase = "window";
    input.preferredMode = "licensing";
    input.marketAttractiveness = "high";
    input.politicalClimate = "poor";
    expect(entryStrategyWarnings(input).map((warning) => warning.id)).not.toContain("mode_off_mapping");
  });

  it("y lo señala cuando queda fuera", () => {
    const input = base();
    input.phase = "window";
    input.preferredMode = "greenfield";
    input.marketAttractiveness = "low";
    input.politicalClimate = "poor";
    expect(entryStrategyWarnings(input).map((warning) => warning.id)).toContain("mode_off_mapping");
  });
});

describe("exhaustividad", () => {
  it("enumera lo que falta y solo se da por completa con todo contestado", () => {
    const input = base();
    expect(entryStrategyCompleteness(input).complete).toBe(false);

    input.phase = "window";
    input.phaseEvidence = "El mercado creció un 8% anual entre 2020 y 2030 según el estudio del caso.";
    input.timingStance = "follower";
    input.timingRationale = "Dos competidores locales ya controlan el 70%.";
    input.paceFactors = { past_experience: 2, cultural_distance: 3, country_risk: 2, available_resources: 3, entry_dispersion: 1, resources_at_stake: 3 };
    input.marketAttractiveness = "high";
    input.politicalClimate = "medium";
    input.preferredMode = "alliance";
    input.modeRationale = "La normativa exige socio local y acorta el acceso a distribución.";
    input.governmentRequirements = "Participación local mínima del 50% en el sector.";

    const completeness = entryStrategyCompleteness(input);
    expect(completeness.missing).toEqual([]);
    expect(completeness.complete).toBe(true);
  });
});
