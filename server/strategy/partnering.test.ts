import { pick, pickAll } from "@shared/i18n";
import { describe, expect, it } from "vitest";
import { emptyPartneringInput, PARTNER_TYPES, type PartneringInput } from "@shared/domain/partnering";
import {
  decideRoute,
  diagnoseFits,
  diagnoseRealOption,
  evaluateGaps,
  partneringCompleteness,
  partneringWarnings,
  partnerTypeRisks,
  routeLabel,
} from "./partnering";

function withGap(axes: Record<string, number | null>, chosenRoute: PartneringInput["gaps"][number]["chosenRoute"] = null): PartneringInput {
  const input = emptyPartneringInput();
  input.gaps = [{ id: "g1", label: "Red de distribución industrial", axes, chosenRoute, note: null }];
  return input;
}

describe("árbol build-borrow-buy", () => {
  it("construye cuando lo que ya se tiene sirve de base", () => {
    const decision = decideRoute({ internal_relevance: 4, tradability: 0, partner_closeness: 4, integration_capacity: 0 });
    expect(decision.route).toBe("build");
    expect(decision.decidedBy).toBe("internal_relevance");
  });

  it("alquila por contrato cuando el recurso se deja delimitar", () => {
    const decision = decideRoute({ internal_relevance: 1, tradability: 4, partner_closeness: 4, integration_capacity: 4 });
    expect(decision.route).toBe("borrow_contract");
  });

  it("compra solo si además hay capacidad de integrar", () => {
    const buy = decideRoute({ internal_relevance: 0, tradability: 0, partner_closeness: 4, integration_capacity: 4 });
    expect(buy.route).toBe("buy");
    const ally = decideRoute({ internal_relevance: 0, tradability: 0, partner_closeness: 4, integration_capacity: 0 });
    expect(ally.route).toBe("borrow_alliance");
    expect(pick(ally.reason, "es")).toMatch(/destruiría/);
  });

  it("se detiene en la primera pregunta que decide, sin promediar", () => {
    // Relevancia alta decide «construir» aunque el resto de ejes esté sin contestar.
    const decision = decideRoute({ internal_relevance: 3 });
    expect(decision.route).toBe("build");
  });

  it("no decide mientras falte la pregunta que toca", () => {
    expect(decideRoute({ internal_relevance: 1 }).route).toBeNull();
    expect(decideRoute({ internal_relevance: 1, tradability: 1, partner_closeness: 4 }).route).toBeNull();
  });

  it("señala cuando la vía elegida no es la del árbol", () => {
    const verdicts = evaluateGaps(withGap({ internal_relevance: 0, tradability: 4 }, "buy"));
    expect(verdicts[0].route).toBe("borrow_contract");
    expect(verdicts[0].divergesFromChoice).toBe(true);
    expect(pick(routeLabel("borrow_contract"), "es")).toBe("Alquilar por contrato");
    expect(pick(routeLabel("borrow_contract"), "en")).toBe("Borrow through contract");
  });
});

describe("encaje del socio", () => {
  it("no compensa un encaje débil con la media de los demás", () => {
    const input = emptyPartneringInput();
    input.fits = [
      { id: "strategic", score: 4, evidence: "Objetivos alineados a diez años" },
      { id: "capability", score: 4, evidence: "Aporta distribución, aportamos tecnología" },
      { id: "cultural", score: 1, evidence: "Choque en la forma de cerrar acuerdos" },
      { id: "organizational", score: 4, evidence: "Ritmos de decisión compatibles" },
    ];
    const diagnosis = diagnoseFits(input);
    expect(diagnosis.average).toBeGreaterThan(3);
    expect(diagnosis.weak).toHaveLength(1);
    expect(diagnosis.weak[0].id).toBe("cultural");
  });

  it("lista los encajes puntuados sin evidencia", () => {
    const input = emptyPartneringInput();
    input.fits = [{ id: "strategic", score: 3, evidence: null }, { id: "capability", score: null, evidence: null }, { id: "cultural", score: null, evidence: null }, { id: "organizational", score: null, evidence: null }];
    expect(pickAll(diagnoseFits(input).unevidenced, "es")).toEqual(["Encaje estratégico"]);
  });

  it("trae los riesgos del tipo de socio de la Tabla 7.3", () => {
    expect(PARTNER_TYPES).toHaveLength(6);
    expect(pickAll(partnerTypeRisks("competitor")?.foreignRisks, "es").join(" ")).toMatch(/fuga tecnológica/);
    expect(partnerTypeRisks(null)).toBeNull();
  });
});

describe("opción real", () => {
  it("no da por estructurada una opción sin señales ni salidas", () => {
    const input = emptyPartneringInput();
    input.realOption.premium = 600000;
    const diagnosis = diagnoseRealOption(input);
    expect(diagnosis.structured).toBe(false);
    expect(pickAll(diagnosis.missing, "es").join(" ")).toMatch(/señal/);
  });

  it("exige un umbral verificable y no solo una señal enunciada", () => {
    const input = emptyPartneringInput();
    input.realOption = {
      premium: 600000,
      currency: "CNY",
      trialYears: 3,
      triggers: [{ id: "t1", signal: "Cuota alcanzada por el licenciatario", threshold: null, stance: "expand" }],
      expansionPathId: "licence_to_acquisition",
      retreatPathId: "continue_under_licence",
      note: null,
    };
    expect(pickAll(diagnoseRealOption(input).missing, "es").join(" ")).toMatch(/umbral/);

    input.realOption.triggers[0].threshold = "20% de cuota al tercer año";
    const diagnosis = diagnoseRealOption(input);
    expect(diagnosis.structured).toBe(true);
    expect(diagnosis.expansionPath?.to).toBe("acquisition");
  });
});

describe("avisos y exhaustividad", () => {
  it("pide caracterizar al socio cuando el árbol lleva a alianza o compra", () => {
    const input = withGap({ internal_relevance: 0, tradability: 0, partner_closeness: 4, integration_capacity: 4 }, "buy");
    const ids = partneringWarnings(input).map((warning) => warning.id);
    expect(ids).toContain("partner_type_missing");
    expect(ids).toContain("fits_incomplete");
  });

  it("no pide socio cuando todo se construye en casa", () => {
    const input = withGap({ internal_relevance: 4 }, "build");
    const ids = partneringWarnings(input).map((warning) => warning.id);
    expect(ids).not.toContain("partner_type_missing");
  });

  it("solo se da por completo con socio, encajes y opción resueltos", () => {
    const input = withGap({ internal_relevance: 0, tradability: 0, partner_closeness: 4, integration_capacity: 1 }, "borrow_alliance");
    expect(partneringCompleteness(input).complete).toBe(false);

    input.partnerType = "customer_distributor";
    input.partnerCategory = "complementing";
    input.fits = [
      { id: "strategic", score: 3, evidence: "Quiere crecer en el mismo segmento" },
      { id: "capability", score: 4, evidence: "Aporta 25.000 puntos de venta" },
      { id: "cultural", score: 3, evidence: "Empresa familiar con decisión concentrada, como la nuestra" },
      { id: "organizational", score: 3, evidence: "Ciclo de decisión mensual en ambas" },
    ];
    const completeness = partneringCompleteness(input);
    expect(completeness.missing).toEqual([]);
    expect(completeness.complete).toBe(true);
  });
});
