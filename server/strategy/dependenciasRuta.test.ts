import { describe, expect, it } from "vitest";
import { LANGUAGES, pick, pickAll } from "@shared/i18n";
import {
  DATA_ORIGINS,
  GUIDED_STEPS,
  emptyConfirmations,
  evaluateRoute,
  type RouteSnapshot,
} from "@shared/domain/guidedRoute";

/**
 * Las dependencias de la ruta.
 *
 * La prueba que importa no es que el grafo esté bien formado —que también— sino que las
 * dependencias se comprueben contra el caso real. Decir «primero el mandato» es un manual;
 * decir «le falta el mandato y por eso este paso está bloqueado» es una herramienta.
 */

function snapshot(overrides: Partial<RouteSnapshot> = {}): RouteSnapshot {
  return {
    caseId: null,
    hasDecisionQuestion: false,
    documentCount: 0,
    acceptedEvidenceCount: 0,
    briefComplete: false,
    ambition: null,
    ambitionIndicesReady: false,
    positioning: null,
    valueChainReady: false,
    candidateCount: 0,
    screenedCount: 0,
    assessedCountries: 0,
    entry: null,
    partnering: null,
    financialReady: false,
    hasResult: false,
    approvalCount: 0,
    confirmations: emptyConfirmations(),
    ...overrides,
  };
}

const stepIds = new Set(GUIDED_STEPS.map((step) => step.id));

describe("dependencias de la ruta", () => {
  it("toda dependencia apunta a un paso que existe y va antes", () => {
    for (const step of GUIDED_STEPS) {
      for (const need of step.needs) {
        expect(stepIds.has(need.from), `${step.id} → ${need.from}`).toBe(true);
        const source = GUIDED_STEPS.find((entry) => entry.id === need.from)!;
        expect(source.order, `${step.id} depende de ${need.from}`).toBeLessThan(step.order);
      }
    }
  });

  it("el primer paso no depende de nada y todos los demás sí", () => {
    const [first, ...rest] = GUIDED_STEPS;
    expect(first.needs).toHaveLength(0);
    for (const step of rest) expect(step.needs.length, step.id).toBeGreaterThan(0);
  });

  it("cada paso dice qué dato hay que traer y de dónde", () => {
    const origins = new Set(DATA_ORIGINS.map((origin) => origin.id));
    for (const step of GUIDED_STEPS) {
      expect(step.bring.length, step.id).toBeGreaterThan(0);
      for (const data of step.bring) {
        expect(origins.has(data.origin), `${step.id}: ${data.origin}`).toBe(true);
        for (const lang of LANGUAGES) {
          expect(pick(data.what, lang).trim()).not.toBe("");
          expect(pick(data.where, lang).trim()).not.toBe("");
        }
      }
    }
  });

  it("con el caso vacío, todo lo que no sea el primer paso está bloqueado", () => {
    const route = evaluateRoute(snapshot());
    const first = route.steps[0];
    expect(first.blockedBy).toHaveLength(0);
    for (const state of route.steps.slice(1)) {
      expect(state.blockedBy.length, state.step.id).toBeGreaterThan(0);
    }
  });

  it("al cumplirse un paso, lo que dependía de él deja de estar bloqueado y pasa a apoyarse en él", () => {
    const antes = evaluateRoute(snapshot());
    const material = antes.steps.find((state) => state.step.id === "material")!;
    expect(material.blockedBy.map((entry) => entry.step.id)).toEqual(["case"]);

    const despues = evaluateRoute(snapshot({ caseId: 1, hasDecisionQuestion: true }));
    const materialDespues = despues.steps.find((state) => state.step.id === "material")!;
    expect(materialDespues.blockedBy).toHaveLength(0);
    expect(materialDespues.restsOn.map((entry) => entry.step.id)).toEqual(["case"]);
  });

  it("un paso saltado no satisface lo que dependía de él", () => {
    const saltado = evaluateRoute(snapshot({
      caseId: 1,
      hasDecisionQuestion: true,
      confirmations: { confirmed: [], skipped: ["brief"] },
    }));
    const ambition = saltado.steps.find((state) => state.step.id === "ambition_motives")!;
    expect(ambition.blockedBy.map((entry) => entry.step.id)).toContain("brief");
  });

  it("lo que un paso desbloquea se deriva de las dependencias, no se declara aparte", () => {
    const route = evaluateRoute(snapshot());
    const brief = route.steps.find((state) => state.step.id === "brief")!;
    const unlocked = brief.unlocks.map((entry) => entry.step.id);
    expect(unlocked).toContain("ambition_motives");
    expect(unlocked).toContain("ambition_indices");
    expect(unlocked).toContain("positioning");

    // Lo que un paso desbloquea es exactamente lo que otros declararon necesitar de él.
    for (const state of route.steps) {
      const declared = GUIDED_STEPS.filter((step) => step.needs.some((need) => need.from === state.step.id));
      expect(state.unlocks.map((entry) => entry.step.id).sort()).toEqual(declared.map((step) => step.id).sort());
    }
  });

  it("el último paso no desbloquea nada y el grafo no tiene islas", () => {
    const route = evaluateRoute(snapshot());
    expect(route.steps.at(-1)!.unlocks).toHaveLength(0);
    // Todo paso salvo el último alimenta a alguien: si no, sobra o falta una dependencia.
    for (const state of route.steps.slice(0, -1)) {
      expect(state.unlocks.length, state.step.id).toBeGreaterThan(0);
    }
  });

  it("no escupe objetos en ninguno de los dos idiomas", () => {
    const route = evaluateRoute(snapshot({ caseId: 1, hasDecisionQuestion: true }));
    for (const state of route.steps) {
      const texts = [
        ...state.blockedBy.map((entry) => entry.what),
        ...state.restsOn.map((entry) => entry.what),
        ...state.unlocks.map((entry) => entry.what),
        ...state.step.bring.flatMap((data) => [data.what, data.where]),
      ];
      for (const text of texts) {
        for (const lang of LANGUAGES) {
          expect(pick(text, lang)).not.toContain("[object Object]");
          expect(pick(text, lang)).not.toContain("undefined");
        }
      }
    }
    expect(pickAll(DATA_ORIGINS.map((origin) => origin.help), "en").join(" ")).not.toContain("undefined");
  });
});
