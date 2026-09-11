/**
 * La tesis: lo que la herramienta pide antes de pedir nada más.
 *
 * El resto de los módulos son fieles al libro y recogen el análisis completo. Este no. Este
 * recoge la afirmación que hay que defender, y de ella se derivan los pocos supuestos de los
 * que depende. La diferencia con el mandato del paso 1 de la ruta guiada es exactamente la
 * que separa una pregunta de una respuesta: «¿merece la pena entrar en Países Bajos y de qué
 * manera?» es un mandato; «entramos por sucursal en veinticuatro meses porque X» es una tesis,
 * y una tesis se puede matar.
 *
 * Una tesis puede ser negativa. «No entrar» es una posición defendible y la mitad del valor de
 * este trabajo es poder sostenerla con el porqué escrito.
 */

import { loc, type Localized } from "../i18n";
import type { IndustryId } from "./industries";

/* ------------------------------------------------------------------------------------ */
/* Procedencia                                                                           */
/* ------------------------------------------------------------------------------------ */

/**
 * De dónde sale cada cosa. Hasta ahora todo venía del libro y bastaba con citar la página;
 * en cuanto existen superposiciones sectoriales eso deja de ser cierto, y confundir una
 * convención del sector con una afirmación de Lasserre erosionaría justo lo que hace
 * defendible a la herramienta.
 */
export type ProvenanceOrigin = "book" | "sector" | "user";

export const PROVENANCE_ORIGINS: { id: ProvenanceOrigin; label: Localized }[] = [
  { id: "book", label: loc("Del libro", "From the book") },
  { id: "sector", label: loc("Convención del sector", "Sector convention") },
  { id: "user", label: loc("Definido por el usuario", "Defined by the user") },
];

/* ------------------------------------------------------------------------------------ */
/* Presencia previa                                                                      */
/* ------------------------------------------------------------------------------------ */

/**
 * Distingue entrar en un país de lanzar un producto donde ya se está. Es el campo que apaga
 * bloques enteros del capítulo 6: quien ya opera en un país no vuelve a litigar su riesgo
 * político ni su distancia cultural.
 */
export type CountryPresence = "none" | "representative" | "other_business" | "region_only" | "operating";

export const COUNTRY_PRESENCE: { id: CountryPresence; label: Localized; consequence: Localized }[] = [
  {
    id: "none",
    label: loc("Sin presencia", "No presence"),
    consequence: loc(
      "Entrada de país completa: riesgo, distancia y legitimidad se evalúan enteros.",
      "A full country entry: risk, distance and legitimacy are assessed in full."
    ),
  },
  {
    id: "representative",
    label: loc("Oficina de representación u observatorio", "Representative office or listening post"),
    consequence: loc(
      "Hay contacto con el país pero no operación: la distancia sigue contando.",
      "There is contact with the country but no operation: distance still counts."
    ),
  },
  {
    id: "other_business",
    label: loc("Otro negocio del grupo ya opera allí", "Another group business already operates there"),
    consequence: loc(
      "El riesgo país y la distancia ya están pagados por el grupo: la pregunta es del producto, no del país.",
      "Country risk and distance are already paid for by the group: the question is about the product, not the country."
    ),
  },
  {
    id: "region_only",
    label: loc("El negocio opera en la región pero no en el país", "The business operates in the region but not in the country"),
    consequence: loc(
      "Se puede apalancar la operación regional; queda por resolver lo específico del país.",
      "The regional operation can be leveraged; what is country-specific remains to be resolved."
    ),
  },
  {
    id: "operating",
    label: loc("El negocio ya opera en el país", "The business already operates in the country"),
    consequence: loc(
      "No es una entrada: es una extensión. El capítulo 6 sobra casi entero.",
      "This is not an entry: it is an extension. Almost all of chapter 6 is redundant."
    ),
  },
];

/** Presencias en las que no tiene sentido volver a evaluar el país entero. */
export const PRESENCE_SUPPRESSES_COUNTRY_BLOCKS: CountryPresence[] = ["other_business", "operating"];

/* ------------------------------------------------------------------------------------ */
/* La tesis                                                                              */
/* ------------------------------------------------------------------------------------ */

export type ThesisStance = "enter" | "do_not_enter";

export const THESIS_STANCES: { id: ThesisStance; label: Localized }[] = [
  { id: "enter", label: loc("Entrar", "Enter") },
  { id: "do_not_enter", label: loc("No entrar", "Do not enter") },
];

export type EntryKind = "country" | "product";

export const ENTRY_KINDS: { id: EntryKind; label: Localized; help: Localized }[] = [
  {
    id: "country",
    label: loc("Entrada de país", "Country entry"),
    help: loc(
      "El grupo no opera todavía en ese mercado con ningún negocio relevante.",
      "The group does not yet operate in that market with any relevant business."
    ),
  },
  {
    id: "product",
    label: loc("Entrada de producto", "Product entry"),
    help: loc(
      "El grupo ya está en el país y lo que se lanza es una línea nueva.",
      "The group is already in the country and what is being launched is a new line."
    ),
  },
];

export type ThesisInput = {
  company: string | null;
  industryId: IndustryId | null;
  countryCode: string | null;
  product: string | null;
  presence: CountryPresence | null;
  entryKind: EntryKind | null;
  stance: ThesisStance | null;
  /**
   * La restricción del grupo. No es un juicio del analista: es lo que la casa ya ha decidido
   * y que esta tesis tiene que respetar o contradecir explícitamente.
   */
  groupConstraint: {
    declaredStrategy: string | null;
    returnThresholdPct: number | null;
    availableEntities: string | null;
  };
  /**
   * La puerta regulatoria. En un sector regulado poda el conjunto de modos antes de que
   * empiece el análisis, así que se contesta primero.
   */
  regulatoryGate: {
    requiresLicence: boolean | null;
    licenceRoute: string | null;
    note: string | null;
  };
  /** Clave del modo dentro de la taxonomía del sector. */
  modeKey: string | null;
  horizonMonths: number | null;
  commitment: { amount: number | null; currency: string | null };
  /** El «porque» de la tesis. Entre una y tres razones. */
  reasons: string[];
  /** Identificador de la tesis rival con la que se compara, si la hay. */
  rivalOf: string | null;
};

export function emptyThesisInput(): ThesisInput {
  return {
    company: null,
    industryId: null,
    countryCode: null,
    product: null,
    presence: null,
    entryKind: null,
    stance: null,
    groupConstraint: { declaredStrategy: null, returnThresholdPct: null, availableEntities: null },
    regulatoryGate: { requiresLicence: null, licenceRoute: null, note: null },
    modeKey: null,
    horizonMonths: null,
    commitment: { amount: null, currency: null },
    reasons: [],
    rivalOf: null,
  };
}

/** Una tesis sin estas cuatro cosas no deriva nada: no hay de qué colgar los supuestos. */
export function thesisIsStated(thesis: ThesisInput): boolean {
  return Boolean(thesis.stance && thesis.countryCode && thesis.entryKind && thesis.reasons.some((reason) => reason.trim()));
}
