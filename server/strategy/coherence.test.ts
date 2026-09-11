import { pick, pickAll } from "@shared/i18n";
import { describe, expect, it } from "vitest";
import { emptyAmbitionInput } from "@shared/domain/globalAmbition";
import { emptyPositioningInput } from "@shared/domain/globalPositioning";
import { emptyEntryStrategyInput } from "@shared/domain/entryStrategy";
import { emptyPartneringInput } from "@shared/domain/partnering";
import { MODULE_WEIGHTS, type CaseDossier } from "@shared/domain/coherence";
import { completenessIndex, evaluateCoherence } from "./coherence";

function dossier(patch: Partial<CaseDossier> = {}): CaseDossier {
  return {
    ambition: emptyAmbitionInput(),
    positioning: emptyPositioningInput(),
    entry: emptyEntryStrategyInput(),
    partnering: emptyPartneringInput(),
    ...patch,
  };
}

function ids(findings: ReturnType<typeof evaluateCoherence>) {
  return findings.map((finding) => finding.id);
}

describe("coherencia entre ambición y países", () => {
  it("señala una ambición global sin ningún país clave", () => {
    const ambition = emptyAmbitionInput();
    ambition.targetRole = "global_player";
    ambition.countryRoles = [{ countryCode: "MEX", role: "marketing", justification: null }];
    expect(ids(evaluateCoherence(dossier({ ambition })))).toContain("global_ambition_without_key_countries");
  });

  it("no la señala cuando hay un país clave", () => {
    const ambition = emptyAmbitionInput();
    ambition.targetRole = "global_player";
    ambition.countryRoles = [{ countryCode: "CHN", role: "key", justification: "Mayor mercado" }];
    expect(ids(evaluateCoherence(dossier({ ambition })))).not.toContain("global_ambition_without_key_countries");
  });

  it("avisa de inversión máxima en un país secundario", () => {
    const ambition = emptyAmbitionInput();
    ambition.countryRoles = [{ countryCode: "VNM", role: "marketing", justification: null }];
    const entry = emptyEntryStrategyInput();
    entry.countryCode = "VNM";
    entry.preferredMode = "acquisition";
    expect(ids(evaluateCoherence(dossier({ ambition, entry })))).toContain("overcommitment_to_secondary_country");
  });

  it("y de un país de entrada sin rol asignado", () => {
    const ambition = emptyAmbitionInput();
    ambition.countryRoles = [{ countryCode: "CHN", role: "key", justification: "Mercado" }];
    const entry = emptyEntryStrategyInput();
    entry.countryCode = "IND";
    expect(ids(evaluateCoherence(dossier({ ambition, entry })))).toContain("entry_country_without_role");
  });
});

describe("coherencia entre posicionamiento y entrada", () => {
  it("señala una propuesta adaptativa con entrada a distancia", () => {
    const positioning = emptyPositioningInput();
    positioning.scope = "broad";
    positioning.advantage = "differentiated";
    positioning.standardization = "adaptive";
    const entry = emptyEntryStrategyInput();
    entry.preferredMode = "licensing";
    expect(ids(evaluateCoherence(dossier({ positioning, entry })))).toContain("adaptive_without_market_contact");
  });

  it("señala una ventaja en coste con un modo de penetración baja", () => {
    const positioning = emptyPositioningInput();
    positioning.scope = "broad";
    positioning.advantage = "cost";
    positioning.standardization = "standardized";
    const entry = emptyEntryStrategyInput();
    entry.preferredMode = "office";
    expect(ids(evaluateCoherence(dossier({ positioning, entry })))).toContain("cost_advantage_low_penetration");
  });
});

describe("coherencia entre objetivo y modo", () => {
  it("no se aprende por contrato", () => {
    const entry = emptyEntryStrategyInput();
    entry.objectives = entry.objectives.map((objective) => (objective.id === "learning" ? { ...objective, selected: true } : objective));
    entry.preferredMode = "distributor";
    expect(ids(evaluateCoherence(dossier({ entry })))).toContain("learning_objective_arms_length");
  });

  it("una oficina no asegura suministro", () => {
    const entry = emptyEntryStrategyInput();
    entry.objectives = entry.objectives.map((objective) => (objective.id === "resources" ? { ...objective, selected: true } : objective));
    entry.preferredMode = "office";
    expect(ids(evaluateCoherence(dossier({ entry })))).toContain("resource_objective_office");
  });

  it("coordinar con una fábrica es un aviso informativo, no un error", () => {
    const entry = emptyEntryStrategyInput();
    entry.objectives = entry.objectives.map((objective) => (objective.id === "coordination" ? { ...objective, selected: true } : objective));
    entry.preferredMode = "greenfield";
    const finding = evaluateCoherence(dossier({ entry })).find((item) => item.id === "coordination_objective_heavy_mode");
    expect(finding?.severity).toBe("info");
  });
});

describe("la brecha de recursos y su resolución", () => {
  it("bloquea si lo marcado «crear» no llega a la vía de acceso", () => {
    const positioning = emptyPositioningInput();
    positioning.tac = [
      { id: "1", kind: "asset", label: "Red de almacenes", functionId: "sourcing_production", tag: "create", note: null },
      { id: "2", kind: "competency", label: "Conocimiento del canal", functionId: "marketing", tag: "create", note: null },
    ];
    const finding = evaluateCoherence(dossier({ positioning })).find((item) => item.id === "unresolved_resource_gap");
    expect(finding?.severity).toBe("block");
    expect(pick(finding?.detail, "es")).toMatch(/Red de almacenes/);
  });

  it("deja de bloquear cuando la capacidad aparece en el módulo de socio", () => {
    const positioning = emptyPositioningInput();
    positioning.tac = [{ id: "1", kind: "asset", label: "Red de almacenes", functionId: "sourcing_production", tag: "create", note: null }];
    const partnering = emptyPartneringInput();
    partnering.gaps = [{ id: "g1", label: "  red de almacenes ", axes: {}, chosenRoute: null, note: null }];
    expect(ids(evaluateCoherence(dossier({ positioning, partnering })))).not.toContain("unresolved_resource_gap");
  });

  it("avisa de mucha carga de creación con una entrada ligera", () => {
    const positioning = emptyPositioningInput();
    positioning.tac = [
      { id: "1", kind: "asset", label: "A", functionId: null, tag: "create", note: null },
      { id: "2", kind: "asset", label: "B", functionId: null, tag: "create", note: null },
      { id: "3", kind: "competency", label: "C", functionId: null, tag: "transfer", note: null },
    ];
    const partnering = emptyPartneringInput();
    partnering.gaps = [
      { id: "g1", label: "A", axes: {}, chosenRoute: null, note: null },
      { id: "g2", label: "B", axes: {}, chosenRoute: null, note: null },
    ];
    const entry = emptyEntryStrategyInput();
    entry.preferredMode = "licensing";
    expect(ids(evaluateCoherence(dossier({ positioning, entry, partnering })))).toContain("high_creation_load_light_mode");
  });
});

describe("coherencia entre fase y vía de acceso", () => {
  it("construir en mercado maduro", () => {
    const entry = emptyEntryStrategyInput();
    entry.phase = "mature";
    const partnering = emptyPartneringInput();
    partnering.gaps = [{ id: "g1", label: "Capacidad", axes: { internal_relevance: 4 }, chosenRoute: "build", note: null }];
    expect(ids(evaluateCoherence(dossier({ entry, partnering })))).toContain("build_in_mature_market");
  });

  it("comprar con encaje cultural débil", () => {
    const partnering = emptyPartneringInput();
    partnering.gaps = [{ id: "g1", label: "Capacidad", axes: { internal_relevance: 0, tradability: 0, partner_closeness: 4, integration_capacity: 4 }, chosenRoute: "buy", note: null }];
    partnering.fits = [
      { id: "strategic", score: 4, evidence: "ok" },
      { id: "capability", score: 4, evidence: "ok" },
      { id: "cultural", score: 1, evidence: "Choque de estilos" },
      { id: "organizational", score: 3, evidence: "ok" },
    ];
    expect(ids(evaluateCoherence(dossier({ partnering })))).toContain("buy_with_weak_integration_fit");
  });

  it("bloquea una entrada por alianza sin socio caracterizado", () => {
    const entry = emptyEntryStrategyInput();
    entry.preferredMode = "alliance";
    const finding = evaluateCoherence(dossier({ entry })).find((item) => item.id === "alliance_mode_without_partner_analysis");
    expect(finding?.severity).toBe("block");
  });
});

describe("índice de exhaustividad", () => {
  it("pondera los cuatro módulos y suma cien", () => {
    expect(Object.values(MODULE_WEIGHTS).reduce((total, weight) => total + weight, 0)).toBe(100);
  });

  it("da cero con todo vacío y lista los módulos sin empezar", () => {
    const index = completenessIndex(dossier(), []);
    expect(index.pct).toBe(0);
    expect(index.blockers).toHaveLength(4);
  });

  it("sube conforme se contestan los módulos, con su peso", () => {
    const ambition = emptyAmbitionInput();
    ambition.currentRole = "regional_player";
    ambition.targetRole = "global_player";
    ambition.targetHorizonYears = 5;
    ambition.stage = "multinational";
    ambition.liabilityOfForeignness = "Sin red local";
    ambition.countryRoles = [{ countryCode: "CHN", role: "key", justification: "Mercado" }];
    ambition.motives = ambition.motives.map((motive) => (motive.id === "market_seeking" ? { ...motive, selected: true, justification: "Crecimiento" } : motive));

    const index = completenessIndex(dossier({ ambition }), []);
    const ambitionScore = index.modules.find((module) => module.key === "ambition");
    expect(ambitionScore?.pct).toBeGreaterThan(50);
    expect(index.pct).toBeGreaterThan(0);
    expect(index.pct).toBeLessThan(30);
  });

  it("lleva los bloqueantes de coherencia al índice", () => {
    const entry = emptyEntryStrategyInput();
    entry.preferredMode = "alliance";
    const findings = evaluateCoherence(dossier({ entry }));
    const index = completenessIndex(dossier({ entry }), findings);
    expect(pickAll(index.blockers, "es")).toContain("Entrada por alianza sin análisis de socio");
    expect(pickAll(index.blockers, "en")).toContain("Alliance entry with no partner analysis");
  });
});
