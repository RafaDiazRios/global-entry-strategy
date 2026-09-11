import { describe, expect, it } from "vitest";
import { LANGUAGES, pick, type Localized } from "@shared/i18n";
import { emptyAmbitionInput } from "@shared/domain/globalAmbition";
import { emptyPositioningInput } from "@shared/domain/globalPositioning";
import { emptyEntryStrategyInput } from "@shared/domain/entryStrategy";
import { emptyPartneringInput } from "@shared/domain/partnering";
import { evaluateCoherence } from "./coherence";
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
import * as assumptionMap from "@shared/domain/assumptionMap";
import { UI_STRINGS } from "../../client/src/i18n/strings";

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
