import { describe, expect, it } from "vitest";
import { emptyConfirmations, evaluateRoute, GUIDED_STEPS, type RouteSnapshot } from "@shared/domain/guidedRoute";
import { LANGUAGES, pick } from "@shared/i18n";

function empty(): RouteSnapshot {
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
  };
}

function complete(): RouteSnapshot {
  return {
    caseId: 1,
    hasDecisionQuestion: true,
    documentCount: 2,
    acceptedEvidenceCount: 9,
    briefComplete: true,
    ambition: { answered: 9, total: 9, complete: true },
    ambitionIndicesReady: true,
    positioning: { answered: 10, total: 10, complete: true },
    valueChainReady: true,
    candidateCount: 4,
    screenedCount: 3,
    assessedCountries: 3,
    entry: { answered: 8, total: 8, complete: true },
    partnering: { answered: 6, total: 6, complete: true },
    financialReady: true,
    hasResult: true,
    approvalCount: 1,
    confirmations: emptyConfirmations(),
  };
}

/** Confirma todos los pasos anteriores al indicado, para situar la ruta en ese punto. */
function confirmedUpTo(stepId: string) {
  const index = GUIDED_STEPS.findIndex((step) => step.id === stepId);
  return { confirmed: GUIDED_STEPS.slice(0, index).map((step) => step.id), skipped: [] as never[] };
}

describe("la ruta guiada", () => {
  it("tiene doce pasos numerados en orden y sin huecos", () => {
    expect(GUIDED_STEPS).toHaveLength(12);
    expect(GUIDED_STEPS.map((step) => step.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("cada paso dice qué se decide, por qué importa, un ejemplo del libro y su criterio de calidad", () => {
    for (const step of GUIDED_STEPS) {
      expect(step.decision.es.length).toBeGreaterThan(20);
      expect(step.why.es.length).toBeGreaterThan(40);
      expect(step.example.source).toMatch(/p\.|pp\.|Table|Fig\.|Example|Mini-case|assignment/);
      expect(step.quality.length).toBeGreaterThan(0);
    }
  });

  it("está entero en los dos idiomas, sin huecos", () => {
    for (const step of GUIDED_STEPS) {
      for (const lang of LANGUAGES) {
        expect(pick(step.title, lang).length).toBeGreaterThan(5);
        expect(pick(step.decision, lang).length).toBeGreaterThan(20);
        expect(pick(step.why, lang).length).toBeGreaterThan(40);
        expect(pick(step.example.text, lang).length).toBeGreaterThan(40);
        for (const item of step.quality) expect(pick(item, lang).length).toBeGreaterThan(10);
      }
    }
  });

  it("el español y el inglés dicen cosas distintas, no la misma cadena repetida", () => {
    for (const step of GUIDED_STEPS) {
      expect(step.title.es).not.toBe(step.title.en);
      expect(step.why.es).not.toBe(step.why.en);
    }
  });

  it("en un caso vacío manda empezar por abrir el caso", () => {
    const route = evaluateRoute(empty());
    expect(route.current?.step.id).toBe("case");
    expect(route.current?.status).toBe("in_progress");
    expect(route.current?.gateMet).toBe(false);
    expect(route.current?.missing.map((item) => item.es)).toContain("Crear o seleccionar un caso");
    expect(route.doneCount).toBe(0);
  });

  it("con el caso abierto pero sin mandato, sigue en el primer paso y lo dice", () => {
    const snapshot = { ...empty(), caseId: 3 };
    const route = evaluateRoute(snapshot);
    expect(route.current?.step.id).toBe("case");
    expect(route.current?.missing.map((item) => item.es)).toContain("Escribir el mandato: qué hay que decidir");
  });

  it("cumplir las condiciones deja el paso listo, y confirmarlo es lo que avanza", () => {
    const withCase = { ...empty(), caseId: 3, hasDecisionQuestion: true };
    const ready = evaluateRoute(withCase);
    expect(ready.current?.step.id).toBe("case");
    expect(ready.current?.status).toBe("ready");

    const afterConfirm = evaluateRoute({ ...withCase, confirmations: { confirmed: ["case"], skipped: [] } });
    expect(afterConfirm.current?.step.id).toBe("material");
  });

  it("no se salta países sin evaluar aunque falten pasos posteriores", () => {
    const snapshot = { ...complete(), assessedCountries: 1, confirmations: confirmedUpTo("assessment") };
    const route = evaluateRoute(snapshot);
    expect(route.current?.step.id).toBe("assessment");
    expect(route.current?.missing[0].es).toMatch(/Quedan 2 país/);
    expect(route.current?.progress).toBeCloseTo(1 / 3, 3);
  });

  it("avisa cuando el filtro deja fuera a todos los candidatos", () => {
    const snapshot = { ...complete(), candidateCount: 5, screenedCount: 0, assessedCountries: 0, confirmations: confirmedUpTo("countries") };
    const route = evaluateRoute(snapshot);
    expect(route.current?.step.id).toBe("countries");
    expect(route.current?.missing[0].es).toMatch(/deja fuera a todos/);
  });

  it("lleva el progreso de los módulos a la ruta", () => {
    const snapshot = { ...complete(), entry: { answered: 4, total: 8, complete: false }, confirmations: confirmedUpTo("entry") };
    const route = evaluateRoute(snapshot);
    expect(route.current?.step.id).toBe("entry");
    expect(route.current?.progress).toBeCloseTo(0.5, 3);
    expect(route.current?.missing[0].es).toBe("4 de 8 apartados contestados");
  });

  it("distingue los tres estados finales de la economía", () => {
    const upToEconomics = confirmedUpTo("economics");
    const noFinance = evaluateRoute({ ...complete(), financialReady: false, confirmations: upToEconomics });
    expect(noFinance.current?.missing[0].es).toMatch(/supuestos económicos/);

    const noResult = evaluateRoute({ ...complete(), hasResult: false, confirmations: upToEconomics });
    expect(noResult.current?.missing[0].es).toBe("Generar la evaluación");

    const noGate = evaluateRoute({ ...complete(), approvalCount: 0, confirmations: upToEconomics });
    expect(noGate.current?.missing[0].es).toMatch(/puerta de decisión/);
  });

  it("con las condiciones cumplidas el paso queda listo, no hecho: falta confirmarlo", () => {
    const route = evaluateRoute(complete());
    expect(route.current?.step.id).toBe("case");
    expect(route.current?.status).toBe("ready");
    expect(route.current?.gateMet).toBe(true);
    expect(route.doneCount).toBe(0);
  });

  it("solo se da por hecho lo que el analista confirma", () => {
    const snapshot = complete();
    snapshot.confirmations = { confirmed: ["case", "material"], skipped: [] };
    const route = evaluateRoute(snapshot);
    expect(route.doneCount).toBe(2);
    expect(route.current?.step.id).toBe("brief");
  });

  it("un paso saltado no cuenta como hecho y se marca aparte", () => {
    const snapshot = complete();
    snapshot.confirmations = { confirmed: ["case"], skipped: ["material"] };
    const route = evaluateRoute(snapshot);
    expect(route.doneCount).toBe(1);
    expect(route.skippedCount).toBe(1);
    expect(route.steps.find((state) => state.step.id === "material")?.status).toBe("skipped");
    expect(route.current?.step.id).toBe("brief");
  });

  it("se puede confirmar un paso cuyas condiciones no se cumplen, y la ruta lo refleja", () => {
    const snapshot = empty();
    snapshot.confirmations = { confirmed: [], skipped: ["case"] };
    const route = evaluateRoute(snapshot);
    expect(route.steps[0].status).toBe("skipped");
    expect(route.steps[0].gateMet).toBe(false);
    expect(route.current?.step.id).toBe("material");
  });

  it("con los doce resueltos no queda paso actual", () => {
    const snapshot = complete();
    snapshot.confirmations = { confirmed: GUIDED_STEPS.map((step) => step.id), skipped: [] };
    const route = evaluateRoute(snapshot);
    expect(route.current).toBeNull();
    expect(route.doneCount).toBe(route.total);
  });
});
