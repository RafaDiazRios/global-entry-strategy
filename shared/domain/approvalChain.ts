/**
 * La cadena de aprobación.
 *
 * Esto no sale del libro. Lasserre analiza la decisión; no analiza quién la firma. Y en una
 * casa real la decisión no la toma «la empresa»: la toma una cadena de personas, cada una con
 * una prueba distinta, y basta con que una de ellas diga que no.
 *
 * La primitiva no es el cargo sino la potestad. Un aprobador con veto mata la tesis él solo;
 * un asesor la moldea pero no la para. Esa distinción es lo único que el motor necesita
 * entender, y es lo que hace que la cadena sirva para cualquier industria: cambia la lista de
 * cargos, no la mecánica.
 *
 * Y una observación de orden. En la casa, el veto llega al final, cuando la tesis ya se ha
 * socializado y tumbarla cuesta reputación además de dinero. Aquí los vetos corren primero.
 */

import { loc, type Localized } from "../i18n";
import type { ProvenanceOrigin } from "./thesis";

export type Authority = "veto" | "advisory" | "decides";

export const AUTHORITIES: { id: Authority; label: Localized; meaning: Localized }[] = [
  {
    id: "veto",
    label: loc("Veto", "Veto"),
    meaning: loc("Puede parar la tesis por sí solo.", "Can stop the thesis on its own."),
  },
  {
    id: "advisory",
    label: loc("Asesor", "Advisory"),
    meaning: loc("La moldea, no la para.", "Shapes it; does not stop it."),
  },
  {
    id: "decides",
    label: loc("Decide", "Decides"),
    meaning: loc("Es quien firma, dentro de lo que los vetos dejan en pie.", "Signs it off, within what the vetoes leave standing."),
  },
];

/**
 * Qué prueba aplica cada aprobador. El identificador es lo que engancha la cadena con los
 * supuestos: un supuesto que responde a `return_threshold` es el que puede tumbar el CFO.
 */
export type ApproverTest =
  | "strategic_fit"
  | "return_threshold"
  | "market_narrative"
  | "sanctions_screening"
  | "platform_capability"
  | "operational_capability"
  | "regional_case"
  | "risk_appetite"
  | "new_product_approval"
  | "local_entity_board"
  | "supervisor_non_objection"
  | "supply_chain"
  | "product_compliance"
  | "brand_fit"
  | "responsible_sourcing";

/** Qué parte del modelo contesta la prueba. Sirve para llevar al usuario allí. */
export type ModelArea =
  | "thesis"
  | "ambition"
  | "positioning"
  | "entry"
  | "partnering"
  | "assessment"
  | "economics";

export type Approver = {
  id: string;
  role: Localized;
  authority: Authority;
  test: ApproverTest;
  question: Localized;
  reads: ModelArea[];
  origin: ProvenanceOrigin;
  provenance: Localized;
};

const CORPORATE_PRACTICE: Localized = loc(
  "Convención de gobierno corporativo, común a cualquier sector; no procede del libro.",
  "Corporate governance practice, common to any sector; it does not come from the book."
);

/**
 * La cadena base, presente en cualquier casa. Las superposiciones sectoriales añaden
 * aprobadores; no quitan ninguno de estos.
 */
export const BASE_CHAIN: Approver[] = [
  {
    id: "strategy",
    role: loc("Estrategia", "Strategy"),
    authority: "veto",
    test: "strategic_fit",
    question: loc(
      "¿Encaja con la cartera y con lo que el grupo ha decidido ser?",
      "Does it fit the portfolio and what the group has decided to be?"
    ),
    reads: ["thesis", "ambition"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
  {
    id: "finance",
    role: loc("Finanzas", "Finance"),
    authority: "veto",
    test: "return_threshold",
    question: loc(
      "¿Supera el umbral de retorno sobre el capital que consume?",
      "Does it clear the return threshold on the capital it consumes?"
    ),
    reads: ["economics", "thesis"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
  {
    id: "sanctions",
    role: loc("Sanciones y control de exportaciones", "Sanctions and export control"),
    authority: "veto",
    test: "sanctions_screening",
    question: loc(
      "¿Es lícito operar en este país y con estas contrapartes?",
      "Is it lawful to operate in this country and with these counterparties?"
    ),
    reads: ["thesis"],
    origin: "sector",
    provenance: loc(
      "Obligatorio en cualquier multinacional; no procede del libro.",
      "Mandatory in any multinational; it does not come from the book."
    ),
  },
  {
    id: "technology",
    role: loc("Tecnología", "Technology"),
    authority: "advisory",
    test: "platform_capability",
    question: loc(
      "¿La plataforma soporta el producto y las particularidades locales?",
      "Does the platform support the product and the local specifics?"
    ),
    reads: ["positioning", "partnering"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
  {
    id: "operations",
    role: loc("Operaciones", "Operations"),
    authority: "advisory",
    test: "operational_capability",
    question: loc(
      "¿Se puede operar allí con la calidad que exige la propuesta?",
      "Can it be operated there at the quality the proposition requires?"
    ),
    reads: ["positioning", "assessment"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
  {
    id: "regional_pl",
    role: loc("Dueño del P&L regional", "Regional P&L owner"),
    authority: "decides",
    test: "regional_case",
    question: loc(
      "¿Gana en la región y merece atención directiva?",
      "Does it win in the region and deserve management attention?"
    ),
    reads: ["thesis", "entry"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
  {
    id: "chief_executive",
    role: loc("Consejero delegado, consejo y junta", "Chief executive, board and shareholders"),
    authority: "veto",
    test: "market_narrative",
    question: loc(
      "¿Contradice la historia que el grupo le ha contado al mercado?",
      "Does it contradict the story the group has told the market?"
    ),
    reads: ["thesis"],
    origin: "sector",
    provenance: CORPORATE_PRACTICE,
  },
];

export function approverByTest(chain: Approver[], test: ApproverTest): Approver | null {
  return chain.find((approver) => approver.test === test) ?? null;
}

export function vetoHolders(chain: Approver[]): Approver[] {
  return chain.filter((approver) => approver.authority === "veto");
}
