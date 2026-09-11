import { describe, expect, it } from "vitest";
import { pick } from "@shared/i18n";
import { emptyThesisInput, type ThesisInput } from "@shared/domain/thesis";
import { ASSUMPTION_RULES, emptyAnswer, type AssumptionAnswer } from "@shared/domain/assumptionMap";
import { INDUSTRIES, resolveChain, sectorMode } from "@shared/domain/industries";
import { BASE_CHAIN } from "@shared/domain/approvalChain";
import { blindSpots, deriveAssumptions, evaluateChain, evaluateThesis, outOfScope, splitByAuthority, unownedAssumptions } from "./thesis";
import { parseThesisPayload } from "./globalStrategySchemas";

/**
 * Los dos casos de prueba son reales y opuestos a propósito: uno de manufactura con entrada de
 * país y sin presencia previa (Lubricador SA, mini-caso 7.3 del libro), otro de servicios
 * financieros con entrada de producto donde el grupo ya opera (Citi en Países Bajos). El
 * tercero, de retail, está para comprobar que la tercera superposición encaja sin retorcer
 * nada: con dos, una de las cuales es la genérica, no se puede saber si la abstracción es real.
 */

function lubricador(): ThesisInput {
  return {
    ...emptyThesisInput(),
    company: "Lubricador SA",
    industryId: "generic",
    countryCode: "CN",
    product: "Aditivos para frenos",
    presence: "none",
    entryKind: "country",
    stance: "enter",
    modeKey: "alliance",
    horizonMonths: 18,
    commitment: { amount: 25_000_000, currency: "CNY" },
    reasons: ["La ventana sigue abierta", "La formulación no se replica localmente"],
  };
}

function citiNetherlands(): ThesisInput {
  return {
    ...emptyThesisInput(),
    company: "Citi",
    industryId: "financial_services",
    countryCode: "NL",
    product: "Tarjetas de crédito de consumo",
    presence: "other_business",
    entryKind: "product",
    stance: "enter",
    groupConstraint: {
      declaredStrategy: "Salida de banca de consumo no estratégica; foco en institucional y wealth",
      returnThresholdPct: 15,
      availableEntities: "Entidad europea con licencia pasaportable",
    },
    regulatoryGate: { requiresLicence: true, licenceRoute: "Pasaporte desde la entidad europea", note: null },
    modeKey: "passport_branch",
    horizonMonths: 24,
    commitment: { amount: 40_000_000, currency: "EUR" },
    reasons: ["Aprovechar la licencia europea existente"],
  };
}

function consumerGoods(): ThesisInput {
  return {
    ...emptyThesisInput(),
    company: "Fabricante de gran consumo",
    industryId: "retail_consumer",
    countryCode: "NG",
    product: "Bebida refrescante",
    presence: "none",
    entryKind: "country",
    stance: "enter",
    modeKey: "wholesale",
    horizonMonths: 36,
    commitment: { amount: 12_000_000, currency: "USD" },
    reasons: ["Clase media en expansión"],
  };
}

function answer(slotId: string, patch: Partial<AssumptionAnswer>): AssumptionAnswer {
  return { ...emptyAnswer(slotId), ...patch };
}

describe("derivación de supuestos", () => {
  it("no deriva nada mientras la tesis no esté enunciada", () => {
    expect(deriveAssumptions(emptyThesisInput())).toEqual([]);
    expect(evaluateThesis(emptyThesisInput(), []).status).toBe("not_stated");
  });

  it("saca una decena de supuestos, no setenta y uno por país", () => {
    for (const thesis of [lubricador(), citiNetherlands(), consumerGoods()]) {
      const derived = deriveAssumptions(thesis);
      expect(derived.length, pick(thesis.product ?? "", "es")).toBeGreaterThanOrEqual(6);
      expect(derived.length).toBeLessThanOrEqual(16);
    }
  });

  it("y la lista que se lleva a la reunión es más corta todavía", () => {
    // Solo los supuestos que mira un veto pueden parar la tesis. El resto la moldea.
    for (const thesis of [lubricador(), citiNetherlands(), consumerGoods()]) {
      const { critical, shaping } = splitByAuthority(thesis, []);
      expect(critical.length, pick(thesis.product ?? "", "es")).toBeLessThanOrEqual(12);
      expect(critical.length).toBeGreaterThanOrEqual(4);
      expect(critical.length + shaping.length).toBe(deriveAssumptions(thesis).length);
    }
  });

  it("Lubricador: entrada de país sin presencia pide distancia, legitimidad y socio", () => {
    const ids = deriveAssumptions(lubricador()).map((slot) => slot.id);
    expect(ids).toContain("market_worth");
    expect(ids).toContain("distance_manageable");
    expect(ids).toContain("legitimacy");
    // El modo es empresa conjunta: el socio deja de ser opcional.
    expect(sectorMode("generic", "alliance")?.requiresPartner).toBe(true);
    expect(ids).toContain("partner_exists");
    // Y no arrastra nada de servicios financieros ni de retail.
    expect(ids).not.toContain("risk_appetite");
    expect(ids).not.toContain("supply_serves");
  });

  it("Citi: entrada de producto donde ya se opera no vuelve a litigar el país", () => {
    const ids = deriveAssumptions(citiNetherlands()).map((slot) => slot.id);
    expect(ids).not.toContain("distance_manageable");
    expect(ids).not.toContain("country_risk");
    expect(ids).toContain("product_fit");
    expect(ids).toContain("risk_appetite");
    expect(ids).toContain("licence_covers");
  });

  it("y lo declara fuera de alcance en lugar de esconderlo", () => {
    const exclusions = outOfScope(citiNetherlands());
    expect(exclusions.map((entry) => entry.area)).toContain("assessment");
    for (const exclusion of exclusions) {
      expect(pick(exclusion.reason, "es").length).toBeGreaterThan(30);
      expect(pick(exclusion.reason, "en").length).toBeGreaterThan(30);
    }
  });

  it("retail encaja sin tocar el mecanismo: la tercera superposición es la que lo prueba", () => {
    const ids = deriveAssumptions(consumerGoods()).map((slot) => slot.id);
    expect(ids).toContain("supply_serves");
    expect(ids).toContain("product_compliant");
    expect(ids).toContain("brand_fits");
    expect(ids).not.toContain("risk_appetite");
  });
});

describe("la cadena de aprobación", () => {
  it("pone los vetos primero, al revés que el organigrama", () => {
    const authorities = resolveChain("financial_services").map((approver) => approver.authority);
    const lastVeto = authorities.lastIndexOf("veto");
    const firstAdvisory = authorities.indexOf("advisory");
    expect(firstAdvisory).toBeGreaterThan(lastVeto);
  });

  it("el sector añade aprobadores y no quita ninguno de la base", () => {
    const base = BASE_CHAIN.map((approver) => approver.id);
    for (const entry of INDUSTRIES) {
      const chain = resolveChain(entry.id).map((approver) => approver.id);
      for (const id of base) expect(chain, pick(entry.label, "es")).toContain(id);
    }
    expect(resolveChain("financial_services").map((a) => a.id)).toContain("risk");
    expect(resolveChain("retail_consumer").map((a) => a.id)).toContain("supply_chain");
    expect(resolveChain("generic").map((a) => a.id)).not.toContain("risk");
  });

  it("el riesgo veta en servicios financieros, que es la corrección que faltaba", () => {
    const risk = resolveChain("financial_services").find((approver) => approver.id === "risk");
    expect(risk?.authority).toBe("veto");
  });
});

describe("qué supuesto, si es falso, hace que quién te lo tumbe", () => {
  it("Citi: la tumban estrategia y finanzas sin puntuar un solo ítem del capítulo 6", () => {
    const answers = [
      answer("group_strategy", { belief: "does_not_hold", falsifier: "El grupo ha declarado la salida de consumo" }),
      answer("economics_holds", { belief: "does_not_hold", falsifier: "Interchange topado y revolving estructuralmente pequeño" }),
    ];
    const verdict = evaluateThesis(citiNetherlands(), answers);

    expect(verdict.status).toBe("blocked");
    const blockers = verdict.killPairs.map((pair) => pair.approver.id);
    expect(blockers).toContain("strategy");
    expect(blockers).toContain("finance");
    expect(pick(verdict.headline, "es")).toMatch(/no llega a la mesa/);
    expect(pick(verdict.headline, "en")).toMatch(/does not reach the table/);

    // Tecnología es asesor: puede estar en rojo y no para nada.
    const technology = verdict.verdicts.find((entry) => entry.approver.id === "technology");
    expect(technology?.approver.authority).toBe("advisory");
    expect(blockers).not.toContain("technology");
  });

  it("un supuesto crítico sin averiguar no es un aprobado", () => {
    const verdict = evaluateThesis(lubricador(), []);
    expect(verdict.status).toBe("at_risk");
    expect(verdict.openCriticalCount).toBeGreaterThan(0);
    expect(pick(verdict.headline, "es")).toMatch(/sin averiguar/);
  });

  it("sin falsador, un supuesto no cuenta como contestado", () => {
    const answers = deriveAssumptions(lubricador()).map((slot) =>
      answer(slot.id, { belief: "holds", confidence: 4, evidence: "Lo sé" }),
    );
    const verdict = evaluateThesis(lubricador(), answers);
    expect(verdict.status).toBe("at_risk");
    expect(verdict.openCriticalCount).toBeGreaterThan(0);
  });

  it("con todos contestados y falsados, ningún veto la para", () => {
    const answers = deriveAssumptions(lubricador()).map((slot) =>
      answer(slot.id, { belief: "holds", confidence: 3, evidence: "Estudio de mercado", falsifier: "Que la cuota del líder supere el 40%" }),
    );
    const verdict = evaluateThesis(lubricador(), answers);
    expect(verdict.status).toBe("clear");
    expect(verdict.killPairs).toEqual([]);
  });
});

describe("integridad de la tabla de derivación", () => {
  it("no hay reglas con identificador repetido", () => {
    const ids = ASSUMPTION_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada supuesto que puede matar la tesis tiene un veto que lo mire", () => {
    // Un supuesto mortal sin dueño sería un hueco de gobierno silencioso.
    for (const thesis of [lubricador(), citiNetherlands(), consumerGoods()]) {
      const chain = resolveChain(thesis.industryId);
      for (const slot of deriveAssumptions(thesis)) {
        if (slot.consequence !== "dies") continue;
        const owner = chain.find((approver) => approver.test === slot.test);
        expect(owner, `${slot.id} en ${thesis.industryId}`).toBeDefined();
        expect(owner?.authority, slot.id).not.toBe("advisory");
      }
    }
  });

  it("los supuestos sin dueño se declaran, no se esconden", () => {
    // En la cadena genérica nadie aplica la prueba del supervisor.
    const thesis = { ...lubricador(), regulatoryGate: { requiresLicence: true, licenceRoute: null, note: null } };
    const unowned = unownedAssumptions(thesis, []);
    expect(unowned.map((entry) => entry.slot.id)).toContain("licence_covers");
  });

  it("cada modo declara si exige socio y si exige licencia", () => {
    for (const entry of INDUSTRIES) {
      expect(entry.modes.length).toBeGreaterThan(0);
      for (const mode of entry.modes) {
        expect(typeof mode.requiresPartner).toBe("boolean");
        expect(typeof mode.requiresLicence).toBe("boolean");
        expect(["weak", "strong"]).toContain(mode.control);
        expect(["low", "high"]).toContain(mode.intensity);
      }
    }
  });

  it("todo lo que no sale del libro lo dice", () => {
    // La regla fundacional del proyecto es que nada carece de origen citable. Las
    // superposiciones sectoriales no salen de Lasserre y tienen que admitirlo.
    for (const rule of ASSUMPTION_RULES) {
      expect(["book", "sector", "user"]).toContain(rule.slot.origin);
      if (rule.slot.origin === "book") {
        expect(pick(rule.slot.provenance, "es"), rule.id).toMatch(/p\.|pp\.|Fig|Tabla|Figura/);
      } else {
        expect(pick(rule.slot.provenance, "es"), rule.id).toMatch(/no procede del libro|Convención/);
      }
    }
  });

  it("la cadena entera y las tres superposiciones están en los dos idiomas", () => {
    for (const entry of INDUSTRIES) {
      for (const approver of resolveChain(entry.id)) {
        for (const lang of ["es", "en"] as const) {
          expect(pick(approver.role, lang).trim()).not.toBe("");
          expect(pick(approver.question, lang).trim()).not.toBe("");
        }
      }
    }
  });
});

describe("evaluateChain", () => {
  it("marca como «sin probar» al aprobador que no tiene supuestos que mirar", () => {
    const verdicts = evaluateChain(citiNetherlands(), []);
    const statuses = new Set(verdicts.map((verdict) => verdict.status));
    expect(statuses.has("at_risk")).toBe(true);
    expect(verdicts.every((verdict) => verdict.assumptions.every((entry) => entry.slot.test === verdict.approver.test))).toBe(true);
  });
});

describe("el motor de coherencia, al revés", () => {
  it("no dice nada mientras no haya tesis", () => {
    expect(blindSpots(emptyThesisInput(), [])).toEqual([]);
  });

  it("un supuesto mortal sin averiguar bloquea, y lo dice en los dos idiomas", () => {
    const spots = blindSpots(lubricador(), []);
    const critical = spots.find((spot) => spot.id === "critical_unestablished");
    expect(critical?.severity).toBe("block");
    expect(pick(critical?.detail, "es")).toMatch(/no se puede defender/);
    expect(pick(critical?.detail, "en")).toMatch(/cannot be defended/);
  });

  it("dar algo por cierto sin una sola fuente es la pregunta que llega primero", () => {
    const answers = deriveAssumptions(lubricador()).map((slot) =>
      answer(slot.id, { belief: "holds", confidence: 4, falsifier: "Que la cuota del líder supere el 40%" }),
    );
    const spots = blindSpots(lubricador(), answers);
    expect(spots.map((spot) => spot.id)).toContain("held_without_evidence");
  });

  it("cazar la contradicción: fuera de alcance y sosteniendo la tesis a la vez", () => {
    // Decir «entrada de país» y a la vez «ya operamos allí» es incoherente, y la
    // incoherencia se ve porque un supuesto mortal mira un bloque que se dio por excluido.
    const contradictory: ThesisInput = { ...lubricador(), presence: "operating" };
    const spots = blindSpots(contradictory, []);
    expect(spots.some((spot) => spot.id.startsWith("excluded_but_load_bearing"))).toBe(true);
  });

  it("el caso de Citi no dispara esa contradicción: entrada de producto donde ya se opera es coherente", () => {
    const spots = blindSpots(citiNetherlands(), []);
    expect(spots.some((spot) => spot.id.startsWith("excluded_but_load_bearing"))).toBe(false);
  });

  it("trae lo que el marco señala en un módulo que la tesis no toca", () => {
    const finding = {
      id: "alliance_mode_without_partner_analysis",
      severity: "block" as const,
      modules: ["partnering" as const],
      title: { es: "Entrada por alianza sin análisis de socio", en: "Alliance entry with no partner analysis" },
      detail: { es: "Detalle en español.", en: "Detail in English." },
      provenance: { es: "p. 265", en: "p. 265" },
    };
    // La tesis de Citi es por sucursal: no toca el módulo de socio, así que el aviso entra.
    const spots = blindSpots(citiNetherlands(), [], [finding]);
    expect(spots.some((spot) => spot.id === "framework_unmentioned_alliance_mode_without_partner_analysis")).toBe(true);

    // La de Lubricador es por empresa conjunta: sí lo toca, así que no lo repite.
    const covered = blindSpots(lubricador(), [], [finding]);
    expect(covered.some((spot) => spot.id.startsWith("framework_unmentioned"))).toBe(false);
  });
});

describe("ida y vuelta por el esquema de guardado", () => {
  it("una tesis completa sobrevive a guardarse y volver", () => {
    const payload = { thesis: citiNetherlands(), answers: [answer("group_strategy", { belief: "does_not_hold", falsifier: "Salida de consumo declarada" })] };
    const round = parseThesisPayload(JSON.parse(JSON.stringify(payload)));
    expect(round.thesis.industryId).toBe("financial_services");
    expect(round.thesis.regulatoryGate.requiresLicence).toBe(true);
    expect(round.answers[0].belief).toBe("does_not_hold");
    expect(evaluateThesis(round.thesis, round.answers).status).toBe("blocked");
  });

  it("un payload corrupto devuelve una tesis vacía en lugar de reventar", () => {
    const round = parseThesisPayload({ thesis: { company: 42 }, answers: "no" });
    expect(round.thesis.company).toBeNull();
    expect(round.answers).toEqual([]);
  });
});
