import { describe, expect, it } from "vitest";
import { LANGUAGES, loc } from "@shared/i18n";
import { buildDecisionMemo, type MemoInput } from "@shared/domain/decisionMemo";

/**
 * El memo de decisión.
 *
 * Lo que se prueba es lo que el memo se niega a hacer: callar un hueco, esconder una sección
 * vacía y quedarse sin decir quién responde de cada supuesto. Un memo que se ve completo
 * cuando no lo está es peor que no tener memo.
 */

const base: MemoInput = {
  company: "Citi",
  countryName: "Países Bajos",
  product: "Tarjetas de crédito",
  stance: loc("Entrar en", "Enter"),
  entryKind: loc("Negocio nuevo en país nuevo", "New business in a new country"),
  mode: loc("Filial local con licencia propia", "Local subsidiary with its own licence"),
  horizonMonths: 24,
  commitment: { amount: 25_000_000, currency: "EUR" },
  reasons: ["El volumen de compra existe y el interchange es estable", "La licencia se puede pasaportar"],
  returnThresholdPct: 15,
  status: "blocked",
  headline: loc("Dos vetos la paran.", "Two vetoes stop it."),
  killPairs: [
    { claim: loc("El caso económico supera el umbral.", "The economic case clears the threshold."), owner: loc("Finanzas", "Finance"), falsifier: "Un coste de riesgo por encima del 5%" },
    { claim: loc("Es lícito operar con esas contrapartes.", "It is lawful to operate with those counterparties."), owner: loc("Sanciones", "Sanctions"), falsifier: null },
  ],
  openCritical: [
    { claim: loc("El supervisor no objeta.", "The supervisor does not object."), owner: loc("Supervisor", "Supervisor"), belief: "unknown", confidence: null, evidence: null, falsifier: null },
  ],
  answeredCritical: [
    { claim: loc("La demanda existe.", "Demand exists."), owner: loc("Estrategia", "Strategy"), belief: "holds", confidence: 3, evidence: "DNB payment statistics 2025", falsifier: "Que el gasto medio por tarjeta caiga bajo 1.800 €" },
  ],
  blindSpots: [
    { severity: "block", title: loc("Crítico sin establecer", "Critical not established"), detail: loc("Falta contestar el supuesto del supervisor.", "The supervisor assumption is unanswered.") },
  ],
  exclusions: [{ reason: loc("El grupo ya opera en el país.", "The group already operates in the country.") }],
  economics: loc("NPV negativo con el coste de riesgo declarado.", "Negative NPV at the declared cost of risk."),
  market: [loc("El plan implica el 40% del mercado.", "The plan implies 40% of the market.")],
  generatedAt: "2026-09-12T09:00:00.000Z",
};

describe("memo de decisión", () => {
  it("abre con la tesis en una frase y el porqué", () => {
    const memo = buildDecisionMemo(base, "es");
    const thesis = memo.sections.find((section) => section.id === "thesis")!;
    expect(thesis.lines[0].text).toContain("Entrar en");
    expect(thesis.lines[0].text).toContain("Países Bajos");
    expect(thesis.lines[0].text).toContain("24 meses");
    expect(thesis.lines[0].text).toContain("25.000.000 EUR");
    expect(thesis.lines[0].text).toContain("umbral de retorno 15%");
    expect(thesis.lines[1].text).toContain("Porque:");
  });

  it("cada supuesto que la mata lleva quién la tumba", () => {
    const memo = buildDecisionMemo(base, "es");
    const kills = memo.sections.find((section) => section.id === "kills")!;
    expect(kills.lines).toHaveLength(2);
    expect(kills.lines[0].owner).toBe("Finanzas");
    expect(kills.lines[1].owner).toBe("Sanciones");
  });

  it("dice cuándo un supuesto va sin falsador en lugar de dejarlo en blanco", () => {
    const memo = buildDecisionMemo(base, "es");
    const kills = memo.sections.find((section) => section.id === "kills")!;
    expect(kills.lines[0].detail).toContain("La falsa:");
    expect(kills.lines[1].detail).toBe("sin falsador escrito");
  });

  it("marca como alerta lo que no está contestado", () => {
    const memo = buildDecisionMemo(base, "es");
    const open = memo.sections.find((section) => section.id === "open")!;
    expect(open.lines[0].tone).toBe("alert");
    expect(open.lines[0].detail).toContain("sin declarar");
    expect(open.lines[0].detail).toContain("sin evidencia registrada");

    const answered = memo.sections.find((section) => section.id === "answered")!;
    expect(answered.lines[0].tone).toBe("normal");
    expect(answered.lines[0].detail).toContain("confianza 3/4");
  });

  it("se genera aunque falte todo, y entonces las secciones vacías dicen por qué", () => {
    const vacio: MemoInput = {
      ...base,
      status: "not_stated",
      killPairs: [],
      openCritical: [],
      answeredCritical: [],
      blindSpots: [],
      exclusions: [],
      economics: null,
      market: [],
    };
    const memo = buildDecisionMemo(vacio, "es");
    // Ninguna sección desaparece: un hueco declarado es información.
    expect(memo.sections.map((section) => section.id)).toEqual([
      "thesis", "kills", "open", "answered", "numbers", "market", "blind", "scope",
    ]);
    for (const section of memo.sections.filter((entry) => entry.id !== "thesis")) {
      expect(section.lines).toHaveLength(0);
      expect(section.emptyNote, section.id).toBeTruthy();
    }
    expect(memo.sections.find((section) => section.id === "numbers")!.emptyNote).toContain("No hay caso económico");
  });

  it("traduce el estado y el pie en los dos idiomas", () => {
    expect(buildDecisionMemo(base, "es").statusLabel).toBe("Un veto la para");
    expect(buildDecisionMemo(base, "en").statusLabel).toBe("A veto stops it");
    expect(buildDecisionMemo(base, "en").sections.find((section) => section.id === "kills")!.title).toBe("What kills it");
    for (const lang of LANGUAGES) {
      const memo = buildDecisionMemo(base, lang);
      expect(memo.footer).toContain(lang === "es" ? "No autoriza gasto" : "authorises no spending");
    }
  });

  it("no escupe objetos ni indefinidos en ningún idioma", () => {
    for (const lang of LANGUAGES) {
      const memo = buildDecisionMemo(base, lang);
      const texts = [
        memo.title, memo.subtitle, memo.statusLabel, memo.headline, memo.footer,
        ...memo.sections.flatMap((section) => [section.title, section.emptyNote ?? "", ...section.lines.flatMap((line) => [line.text, line.owner ?? "", line.detail ?? ""])]),
      ];
      for (const text of texts) {
        expect(text).not.toContain("[object Object]");
        expect(text).not.toContain("undefined");
      }
    }
  });
});
