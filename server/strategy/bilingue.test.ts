import { describe, expect, it } from "vitest";
import { LANGUAGES, loc, pick, type Localized } from "@shared/i18n";
import { localizedError, readLocalizedError } from "@shared/localizedError";
import { emptyAmbitionInput } from "@shared/domain/globalAmbition";
import { emptyPositioningInput } from "@shared/domain/globalPositioning";
import { emptyEntryStrategyInput } from "@shared/domain/entryStrategy";
import { emptyPartneringInput } from "@shared/domain/partnering";
import { evaluateCoherence } from "./coherence";
import { evaluateStrategy } from "./engine";
import { evaluateFinancials, recommendInvestmentAction } from "./financialEngine";
import { entryStrategyWarnings } from "./entryStrategy";
import { partneringWarnings } from "./partnering";
import * as ambition from "@shared/domain/globalAmbition";
import * as positioning from "@shared/domain/globalPositioning";
import * as entry from "@shared/domain/entryStrategy";
import * as partnering from "@shared/domain/partnering";
import * as modes from "@shared/domain/entryModes";
import * as coherence from "@shared/domain/coherence";
import * as countryAssessment from "@shared/domain/countryAssessment";
import * as countries from "@shared/domain/countries";
import * as thesis from "@shared/domain/thesis";
import * as approvalChain from "@shared/domain/approvalChain";
import * as industries from "@shared/domain/industries";
import * as revenueStack from "@shared/domain/revenueStack";
import * as competitiveLandscape from "@shared/domain/competitiveLandscape";
import * as decisionMemo from "@shared/domain/decisionMemo";
import * as assumptionMap from "@shared/domain/assumptionMap";
import { UI_STRINGS } from "../../client/src/i18n/strings";
import { STACK_TEMPLATES } from "@shared/domain/industries";

/**
 * Cobertura bilingüe de las tablas del libro.
 *
 * No comprueba cadena por cadena: recorre los módulos enteros y examina cada par
 * `{ es, en }` que encuentra. Así, una tabla nueva queda cubierta el día que se escribe sin
 * que nadie tenga que acordarse de añadirla aquí, que es exactamente lo que no ocurre con
 * los ficheros de traducciones por claves.
 */

const MODULES: Record<string, Record<string, unknown>> = {
  globalAmbition: ambition,
  globalPositioning: positioning,
  entryStrategy: entry,
  partnering: partnering,
  entryModes: modes,
  coherence: coherence,
  countryAssessment: countryAssessment,
  countries: countries,
  thesis: thesis,
  approvalChain: approvalChain,
  industries: industries,
  revenueStack: revenueStack,
  competitiveLandscape: competitiveLandscape,
  decisionMemo: decisionMemo,
  assumptionMap: assumptionMap,
};

type Found = { path: string; value: Localized };

function isLocalized(value: unknown): value is Localized {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value);
  return keys.length === 2 && keys.includes("es") && keys.includes("en")
    && typeof (value as Localized).es === "string" && typeof (value as Localized).en === "string";
}

/** Recoge todos los pares del módulo, con la ruta por la que se ha llegado a cada uno. */
function collect(value: unknown, path: string, out: Found[], plain: { path: string; value: string }[]) {
  if (typeof value === "string") { plain.push({ path, value }); return; }
  if (isLocalized(value)) { out.push({ path, value }); return; }
  if (Array.isArray(value)) { value.forEach((item, index) => collect(item, `${path}[${index}]`, out, plain)); return; }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) collect(child, `${path}.${key}`, out, plain);
  }
}

const pairs: Found[] = [];
const plainStrings: { path: string; value: string }[] = [];
for (const [name, module] of Object.entries(MODULES)) {
  for (const [key, exported] of Object.entries(module)) {
    if (typeof exported === "function") continue;
    collect(exported, `${name}.${key}`, pairs, plainStrings);
  }
}

/**
 * Términos que son literalmente iguales en los dos idiomas. La lista es corta a propósito:
 * si crece, es señal de que alguien está copiando el español en el campo inglés.
 */
const SAME_IN_BOTH = new Set([
  "Capital", "Control", "Digital", "Global", "Hubs", "Local", "Marketing", "Pre-emption", "Regional",
  // Términos del libro que en español se usan en inglés, y una palabra que coincide.
  "Liability of foreignness", "Transfer, Adapt, Create", "8. Gates", "gradual",
  "Cultural", "Hub", "Veto", "Supervisor", "Sector", "No",
  // Nombre del producto, siglas y palabras que se escriben igual en los dos idiomas.
  "Global Entry Strategy Studio", "Gate", "manual", "Manual", "Base", "macro", "FX USD / local",
  "Drivers", "Driver", "Total",
]);

/** Las citas del libro se escriben igual en los dos idiomas salvo la palabra «Tabla». */
const CITATION = /^(p\.|pp\.|Fig\.|Table|Tabla|Learning assignment)/;

/**
 * Nombres propios: países y ejemplos del libro. Muchos se escriben igual en los dos idiomas
 * —China, India, Australia— y exigir que difieran no diría nada útil.
 */
const PROPER_NOUN_PATH = /\.name$|\.examples$/;

describe("cobertura bilingüe de las tablas del libro", () => {
  it("encuentra pares en los doce módulos, no en uno solo", () => {
    expect(pairs.length).toBeGreaterThan(800);
    for (const name of Object.keys(MODULES)) {
      expect(pairs.some((pair) => pair.path.startsWith(`${name}.`)), name).toBe(true);
    }
  });

  it("no deja huecos en ninguno de los dos idiomas", () => {
    for (const { path, value } of pairs) {
      for (const lang of LANGUAGES) {
        expect(value[lang].trim(), `${path}.${lang}`).not.toBe("");
      }
    }
  });

  it("el inglés no es el español repetido", () => {
    const repeated = pairs.filter(({ path, value }) =>
      value.es === value.en && !SAME_IN_BOTH.has(value.es) && !CITATION.test(value.es) && !PROPER_NOUN_PATH.test(path)
    );
    expect(repeated.map((pair) => `${pair.path}: ${pair.value.es}`)).toEqual([]);
  });

  it("ninguna cita en inglés habla de «Tabla»", () => {
    const spanishTable = pairs.filter(({ value }) => /\bTabla\b/.test(value.en));
    expect(spanishTable.map((pair) => `${pair.path}: ${pair.value.en}`)).toEqual([]);
  });

  it("el texto propio de la interfaz también está en los dos idiomas", () => {
    const entries = Object.entries(UI_STRINGS);
    expect(entries.length).toBeGreaterThan(150);
    for (const [key, value] of entries) {
      for (const lang of LANGUAGES) expect(value[lang].trim(), `${key}.${lang}`).not.toBe("");
    }
    const repeated = entries.filter(([, value]) => value.es === value.en && !SAME_IN_BOTH.has(value.es) && !CITATION.test(value.es));
    expect(repeated.map(([key, value]) => `${key}: ${value.es}`)).toEqual([]);
  });

  it("no queda texto suelto en español fuera de los pares", () => {
    // Los identificadores, las claves y los nombres propios del libro son cadenas sueltas
    // legítimas; lo que no puede quedar suelto es prosa en español.
    const leftovers = plainStrings.filter(({ value }) => /[áéíóúñ¿¡«»]/i.test(value));
    expect(leftovers.map((entry) => `${entry.path}: ${entry.value}`)).toEqual([]);
  });
});

/**
 * El error que TypeScript no puede ver.
 *
 * Varios avisos incrustan una etiqueta del libro dentro de la frase. Si alguien olvida
 * resolver el par al idioma, la plantilla interpola el objeto entero y el usuario lee
 * «[object Object]» sin que el compilador diga nada, porque una plantilla acepta cualquier
 * cosa. Esta prueba dispara los avisos que interpolan y mira el resultado.
 */
describe("los avisos que incrustan etiquetas no escupen objetos", () => {
  function dossierWithContradictions() {
    const ambition = emptyAmbitionInput();
    ambition.targetRole = "global_player";
    ambition.stage = "export";
    ambition.countryRoles = [{ countryCode: "CHN", role: "marketing", justification: null }];

    const positioning = emptyPositioningInput();
    positioning.scope = "niche";
    positioning.advantage = "cost";
    positioning.standardization = "adaptive";
    positioning.tac = [{ id: "1", kind: "asset", label: "Red de almacenes", functionId: null, tag: "create", note: null }];

    const entry = emptyEntryStrategyInput();
    entry.countryCode = "CHN";
    entry.phase = "premature";
    entry.preferredMode = "greenfield";
    entry.marketAttractiveness = "low";
    entry.politicalClimate = "poor";
    entry.timingStance = "first_mover";
    entry.objectives = entry.objectives.map((objective) =>
      objective.id === "learning" ? { ...objective, selected: true } : objective
    );

    const partnering = emptyPartneringInput();
    partnering.gaps = [{ id: "g1", label: "Licencia de operación", axes: { internal_relevance: 0, tradability: 4 }, chosenRoute: "buy", note: null }];
    partnering.fits = partnering.fits.map((fit) => ({ ...fit, score: 1 }));
    partnering.realOption.premium = 500000;

    return { ambition, positioning, entry, partnering };
  }

  it("ni en español ni en inglés", () => {
    const dossier = dossierWithContradictions();
    const texts: Localized[] = [
      ...evaluateCoherence(dossier).flatMap((finding) => [finding.title, finding.detail, finding.provenance]),
      ...entryStrategyWarnings(dossier.entry).flatMap((warning) => [warning.message, warning.provenance]),
      ...partneringWarnings(dossier.partnering).flatMap((warning) => [warning.message, warning.provenance]),
    ];

    expect(texts.length).toBeGreaterThan(10);
    for (const text of texts) {
      for (const lang of LANGUAGES) {
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("[object Object]");
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("undefined");
      }
    }
  });
});

/**
 * Los dos motores también interpolan.
 *
 * El motor de países mete la etiqueta del criterio eliminatorio dentro del aviso, y el
 * financiero mete el nombre del modo y las cifras dentro de cada razón. Son los sitios con
 * más riesgo de que se cuele un objeto, porque la frase se construye dos veces —una por
 * idioma— y basta con olvidar un `pick` en una de ellas.
 */
describe("los motores tampoco escupen objetos", () => {
  const assumptions = {
    currency: "USD", tamYearOne: 4_000_000_000, annualMarketGrowthPct: 6, samPct: 30,
    somPctYearOne: 3, somPctHorizon: 12, operatingMarginPct: 15, taxRatePct: 25,
    workingCapitalPctRevenue: 10, discountRatePct: 10, terminalGrowthPct: 2,
    modeProfiles: { greenfield: { initialInvestment: 8_000_000, annualOperatingCost: 3_000_000, revenueCapturePct: 100 } },
    sensitivityScenarios: { optimistic: { priceRevenuePct: 10, operatingMarginPctPoints: 3, fxRatePct: 0 }, conservative: { priceRevenuePct: -10, operatingMarginPctPoints: -3, fxRatePct: 0 } },
  };

  function assertClean(texts: (Localized | undefined)[]) {
    const present = texts.filter((text): text is Localized => text !== undefined);
    expect(present.length).toBeGreaterThan(0);
    for (const text of present) {
      for (const lang of LANGUAGES) {
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("[object Object]");
        expect(pick(text, lang), JSON.stringify(text)).not.toContain("undefined");
      }
    }
  }

  it("el motor financiero, en sus cuatro veredictos", () => {
    const financial = evaluateFinancials(assumptions, [{ key: "greenfield", mode: loc("Filial propia / greenfield", "Wholly owned subsidiary / greenfield") }], 4);
    const verdicts = [
      recommendInvestmentAction(financial, 90, 90, { advanceMinRiskAdjusted: 10, advanceMinRoiPct: -100, advanceMaxPaybackYears: 10, advanceMinNpv: 0, testMaxInitialInvestment: 1_000_000_000 }),
      recommendInvestmentAction(financial, 90, 90, { advanceMinRoiPct: 10_000, testMinRoiPct: -100, testMinNpv: 0, testMinRiskAdjusted: 10 }),
      recommendInvestmentAction(financial, 90, 90, { advanceMinRiskAdjusted: 99, testMinRiskAdjusted: 95 }),
      recommendInvestmentAction(financial, 90, 10, { minConfidence: 60 }),
    ];
    expect(new Set(verdicts.map((verdict) => verdict.action)).size).toBe(4);
    assertClean(verdicts.flatMap((verdict) => [verdict.label, verdict.summary, ...verdict.reasons]));
    assertClean([financial.methodology, ...financial.missingInputs, ...financial.scenarios.flatMap((scenario) => [scenario.label, scenario.note, ...scenario.missingInputs])]);
    assertClean(financial.tornado.levers.map((lever) => lever.label));
  });

  it("el motor de países, con un criterio eliminatorio activo", () => {
    const result = evaluateStrategy({
      companyName: "Prueba", homeCountry: "ES", industry: "Software", businessModel: "SaaS",
      valueProposition: "", objective: "market", horizonYears: 4,
      countryInputs: [{ code: "AA", name: "Mercado A", calibration: { politicalRisk: 95 } }],
      marketData: { AA: { sourceStatus: "unavailable" } },
      knockOuts: { maxPoliticalRisk: 40 },
    });
    const country = result.countries[0];
    expect(country.eligibility.eligible).toBe(false);
    assertClean([
      result.methodology, result.portfolio.recommendation, ...result.portfolio.caveats,
      country.timing.label, country.timing.description, ...country.flags,
      country.investmentRecommendation.label, country.investmentRecommendation.summary,
      ...country.investmentRecommendation.reasons,
    ]);
  });
});

/**
 * Los errores del servidor viajan dentro del mensaje, no en un campo aparte. Si el formato
 * cambia sin querer, el cliente dejaría de encontrar el par y enseñaría la cadena cruda con
 * la marca delante, que es peor que no traducir.
 */
describe("los errores bilingües sobreviven al viaje", () => {
  it("se vuelven a abrir en los dos idiomas", () => {
    const error = localizedError("No encontrado.", "Not found.");
    const reopened = readLocalizedError(error);
    expect(pick(reopened, "es")).toBe("No encontrado.");
    expect(pick(reopened, "en")).toBe("Not found.");
  });

  it("un error que no viene de aquí se muestra tal cual", () => {
    expect(readLocalizedError(new Error("ECONNRESET"))).toBe("ECONNRESET");
    expect(readLocalizedError(null)).toBe("");
  });
});

/**
 * Las plantillas de cuenta de resultados son un caso aparte.
 *
 * El texto del marco está en los dos idiomas, pero lo que la plantilla produce es dato del
 * usuario —lo va a renombrar— y sale ya resuelto a un idioma. El recorrido genérico no las
 * ve, porque las etiquetas viven dentro del cierre de `build`. Así que se instancian en los
 * dos idiomas y se comprueba que de verdad difieren.
 */
describe("las plantillas de cuenta de resultados siembran en los dos idiomas", () => {
  it("cada plantilla produce etiquetas distintas en español y en inglés", () => {
    expect(STACK_TEMPLATES.length).toBeGreaterThan(3);
    for (const template of STACK_TEMPLATES) {
      const es = template.build("es");
      const en = template.build("en");

      expect(es.drivers.map((driver) => driver.id)).toEqual(en.drivers.map((driver) => driver.id));
      expect(es.lines.map((line) => line.id)).toEqual(en.lines.map((line) => line.id));

      const spanish = [...es.drivers.map((d) => d.label), ...es.lines.flatMap((l) => [l.label, ...l.items.map((i) => i.label)])];
      const english = [...en.drivers.map((d) => d.label), ...en.lines.flatMap((l) => [l.label, ...l.items.map((i) => i.label)])];
      for (const label of [...spanish, ...english]) expect(label.trim()).not.toBe("");
      // No todas cambian —«Interchange» es la misma palabra— pero la mayoría sí.
      const changed = spanish.filter((label, index) => label !== english[index]).length;
      expect(changed, `${template.id}: ${spanish.length - changed} etiquetas iguales`).toBeGreaterThan(spanish.length / 2);
    }
  });

  it("ninguna partida se presenta como si viniera del libro", () => {
    for (const template of STACK_TEMPLATES) {
      expect(template.origin).toBe("sector");
      const items = template.build("es").lines.flatMap((line) => line.items);
      expect(items.every((item) => item.origin === "sector")).toBe(true);
      for (const lang of LANGUAGES) {
        for (const item of items) expect(pick(item.provenance, lang)).not.toContain("Lasserre");
      }
    }
  });
});
