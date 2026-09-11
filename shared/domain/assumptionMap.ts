/**
 * De la tesis a los supuestos que la sostienen.
 *
 * Esta tabla es el corazón del modo trabajo. En lugar de pedir los 71 ítems del capítulo 6
 * por país —852 juicios con seis países en comparación—, mira la forma de la tesis y deriva
 * los seis a doce supuestos de los que depende. El resto del marco no desaparece: queda
 * declarado fuera de alcance y accesible como desglose.
 *
 * Las reglas están escritas a mano a propósito. Una derivación inferida sería más corta y no
 * se podría discutir; esta se puede leer, citar y llevar la contraria. Cada supuesto dice de
 * dónde sale y, cuando sale del libro, por qué página.
 *
 * La consecuencia —muere, cambia el modo, cambia el momento— es el mapa de materialidad, y se
 * produce sin puntuar un solo ítem de 0 a 4.
 */

import { loc, type Localized } from "../i18n";
import type { ApproverTest, ModelArea } from "./approvalChain";
import type { ProvenanceOrigin, ThesisInput } from "./thesis";
import { PRESENCE_SUPPRESSES_COUNTRY_BLOCKS } from "./thesis";
import { sectorMode } from "./industries";

export type Consequence = "dies" | "changes_mode" | "changes_timing";

export const CONSEQUENCES: { id: Consequence; label: Localized; meaning: Localized }[] = [
  {
    id: "dies",
    label: loc("Muere", "Dies"),
    meaning: loc("Si es falso, no hay tesis.", "If it is false, there is no thesis."),
  },
  {
    id: "changes_mode",
    label: loc("Cambia el modo", "Changes the mode"),
    meaning: loc("La entrada sigue en pie por otra vía.", "The entry still stands, by another route."),
  },
  {
    id: "changes_timing",
    label: loc("Cambia el momento", "Changes the timing"),
    meaning: loc("La entrada sigue en pie más tarde.", "The entry still stands, later."),
  },
];

export type AssumptionSlot = {
  id: string;
  /** Redactado como afirmación, para que se pueda declarar falsa. */
  claim: Localized;
  /** A qué prueba de la cadena de aprobación responde. */
  test: ApproverTest;
  area: ModelArea;
  consequence: Consequence;
  origin: ProvenanceOrigin;
  provenance: Localized;
};

export type AssumptionRule = {
  id: string;
  when: (thesis: ThesisInput) => boolean;
  slot: AssumptionSlot;
};

const always = () => true;

const CORPORATE: Localized = loc(
  "Convención de gobierno corporativo; no procede del libro.",
  "Corporate governance practice; it does not come from the book."
);

export const ASSUMPTION_RULES: AssumptionRule[] = [
  /* --- Siempre ------------------------------------------------------------------- */
  {
    id: "group_strategy",
    when: always,
    slot: {
      id: "group_strategy",
      claim: loc(
        "El grupo admite este movimiento dentro de la estrategia que ya ha declarado.",
        "The group accepts this move within the strategy it has already declared."
      ),
      test: "strategic_fit",
      area: "thesis",
      consequence: "dies",
      origin: "sector",
      provenance: CORPORATE,
    },
  },
  {
    id: "economics_holds",
    when: always,
    slot: {
      id: "economics_holds",
      claim: loc(
        "El caso económico supera el umbral de retorno al compromiso declarado.",
        "The economic case clears the return threshold at the declared commitment."
      ),
      test: "return_threshold",
      area: "economics",
      consequence: "dies",
      origin: "sector",
      provenance: CORPORATE,
    },
  },
  {
    id: "lawful",
    when: always,
    slot: {
      id: "lawful",
      claim: loc(
        "Es lícito operar en ese país y con esas contrapartes.",
        "It is lawful to operate in that country and with those counterparties."
      ),
      test: "sanctions_screening",
      area: "thesis",
      consequence: "dies",
      origin: "sector",
      provenance: CORPORATE,
    },
  },
  {
    id: "narrative",
    when: always,
    slot: {
      id: "narrative",
      claim: loc(
        "La tesis no contradice lo que el grupo le ha contado al mercado.",
        "The thesis does not contradict what the group has told the market."
      ),
      test: "market_narrative",
      area: "thesis",
      consequence: "dies",
      origin: "sector",
      provenance: CORPORATE,
    },
  },

  /* --- Entrada de país ------------------------------------------------------------ */
  {
    id: "market_worth",
    when: (thesis) => thesis.entryKind === "country",
    slot: {
      id: "market_worth",
      claim: loc(
        "El mercado merece presencia por tamaño, crecimiento o calidad de la demanda.",
        "The market deserves a presence by size, growth or quality of demand."
      ),
      test: "regional_case",
      area: "assessment",
      consequence: "dies",
      origin: "book",
      provenance: loc("Figura 6.3, p. 229", "Figure 6.3, p. 229"),
    },
  },
  {
    id: "country_risk",
    when: (thesis) =>
      thesis.entryKind === "country" && !PRESENCE_SUPPRESSES_COUNTRY_BLOCKS.includes(thesis.presence ?? "none"),
    slot: {
      id: "country_risk",
      claim: loc(
        "El riesgo país cabe en lo que el grupo está dispuesto a exponer.",
        "Country risk fits within what the group is willing to expose."
      ),
      test: "regional_case",
      area: "assessment",
      consequence: "changes_mode",
      origin: "book",
      provenance: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
    },
  },
  {
    id: "distance_manageable",
    when: (thesis) =>
      thesis.entryKind === "country" && (thesis.presence === "none" || thesis.presence === "representative"),
    slot: {
      id: "distance_manageable",
      claim: loc(
        "La distancia con el país de origen es gestionable con lo que tenemos.",
        "The distance from the home country is manageable with what we have."
      ),
      test: "operational_capability",
      area: "assessment",
      consequence: "changes_mode",
      origin: "book",
      provenance: loc("Figura 6.11, p. 243", "Figure 6.11, p. 243"),
    },
  },
  {
    id: "legitimacy",
    when: (thesis) =>
      thesis.entryKind === "country" && (thesis.presence === "none" || thesis.presence === "representative"),
    slot: {
      id: "legitimacy",
      claim: loc(
        "La desventaja por ser extranjeros se compensa con una ventaja superior concreta.",
        "The handicap of being foreign is offset by a specific, superior advantage."
      ),
      test: "strategic_fit",
      area: "positioning",
      consequence: "dies",
      origin: "book",
      provenance: loc("p. 198", "p. 198"),
    },
  },

  /* --- Entrada de producto -------------------------------------------------------- */
  {
    id: "product_fit",
    when: (thesis) => thesis.entryKind === "product",
    slot: {
      id: "product_fit",
      claim: loc(
        "El producto encaja con la curva de valor del cliente local sin rehacerlo.",
        "The product fits the local customer's value curve without being rebuilt."
      ),
      test: "regional_case",
      area: "positioning",
      consequence: "dies",
      origin: "book",
      provenance: loc("Tabla 6.2, p. 234 y Fig. 5.9, p. 189", "Table 6.2, p. 234 and Fig. 5.9, p. 189"),
    },
  },

  /* --- El modo -------------------------------------------------------------------- */
  {
    id: "mode_fits_phase",
    when: (thesis) => Boolean(thesis.modeKey),
    slot: {
      id: "mode_fits_phase",
      claim: loc(
        "El modo elegido es el apropiado para la fase en que está la ventana.",
        "The chosen mode is the appropriate one for the phase the window is in."
      ),
      test: "regional_case",
      area: "entry",
      consequence: "changes_mode",
      origin: "book",
      provenance: loc("pp. 261-262 y Fig. 7.3, p. 272", "pp. 261-262 and Fig. 7.3, p. 272"),
    },
  },
  {
    id: "partner_exists",
    when: (thesis) => sectorMode(thesis.industryId, thesis.modeKey)?.requiresPartner === true,
    slot: {
      id: "partner_exists",
      claim: loc(
        "Existe un socio con el encaje de capacidades que hace falta y sin conflicto de intereses.",
        "A partner exists with the capability fit required and without a conflict of interest."
      ),
      test: "operational_capability",
      area: "partnering",
      consequence: "changes_mode",
      origin: "book",
      provenance: loc("Tabla 7.3, p. 267 y p. 278", "Table 7.3, p. 267 and p. 278"),
    },
  },
  {
    id: "licence_covers",
    when: (thesis) =>
      thesis.regulatoryGate.requiresLicence === true ||
      sectorMode(thesis.industryId, thesis.modeKey)?.requiresLicence === true,
    slot: {
      id: "licence_covers",
      claim: loc(
        "La vía de licencia elegida cubre este producto en este país.",
        "The chosen licence route covers this product in this country."
      ),
      test: "supervisor_non_objection",
      area: "thesis",
      consequence: "changes_mode",
      origin: "sector",
      provenance: loc(
        "Convención del sector regulado; no procede del libro.",
        "Practice in regulated sectors; it does not come from the book."
      ),
    },
  },

  /* --- El momento ------------------------------------------------------------------ */
  {
    id: "window_open",
    when: (thesis) => thesis.horizonMonths !== null && thesis.horizonMonths <= 24,
    slot: {
      id: "window_open",
      claim: loc(
        "La ventana sigue abierta dentro del horizonte declarado.",
        "The window is still open within the declared horizon."
      ),
      test: "regional_case",
      area: "entry",
      consequence: "changes_timing",
      origin: "book",
      provenance: loc("pp. 261-262 y p. 277", "pp. 261-262 and p. 277"),
    },
  },

  /* --- No entrar también es una tesis ---------------------------------------------- */
  {
    id: "inaction_cost",
    when: (thesis) => thesis.stance === "do_not_enter",
    slot: {
      id: "inaction_cost",
      claim: loc(
        "El coste de no entrar —que otro se lleve la ventana— es asumible.",
        "The cost of not entering —someone else taking the window— is acceptable."
      ),
      test: "strategic_fit",
      area: "entry",
      consequence: "changes_timing",
      origin: "book",
      provenance: loc("Tabla 7.2, p. 262", "Table 7.2, p. 262"),
    },
  },

  /* --- Servicios financieros -------------------------------------------------------- */
  {
    id: "risk_appetite",
    when: (thesis) => thesis.industryId === "financial_services",
    slot: {
      id: "risk_appetite",
      claim: loc(
        "El producto cabe en el apetito de riesgo y en la política de crédito del grupo.",
        "The product fits the group's risk appetite and credit policy."
      ),
      test: "risk_appetite",
      // El apetito es una política del grupo, no una lectura del país: por eso vive en la
      // tesis y no en la evaluación del capítulo 6.
      area: "thesis",
      consequence: "dies",
      origin: "sector",
      provenance: loc(
        "Convención del sector financiero regulado; no procede del libro.",
        "Practice in regulated financial services; it does not come from the book."
      ),
    },
  },
  {
    id: "npa_clears",
    when: (thesis) => thesis.industryId === "financial_services",
    slot: {
      id: "npa_clears",
      claim: loc(
        "El producto pasa el proceso de aprobación de producto nuevo en el plazo del plan.",
        "The product clears the new product approval process within the plan's timeframe."
      ),
      test: "new_product_approval",
      area: "thesis",
      consequence: "changes_timing",
      origin: "sector",
      provenance: loc(
        "Convención del sector financiero regulado; no procede del libro.",
        "Practice in regulated financial services; it does not come from the book."
      ),
    },
  },
  {
    id: "entity_board",
    when: (thesis) => thesis.industryId === "financial_services",
    slot: {
      id: "entity_board",
      claim: loc(
        "El consejo de la entidad que va a emitir lo aprueba.",
        "The board of the issuing entity approves it."
      ),
      test: "local_entity_board",
      area: "thesis",
      consequence: "changes_mode",
      origin: "sector",
      provenance: loc(
        "Convención del sector financiero regulado; no procede del libro.",
        "Practice in regulated financial services; it does not come from the book."
      ),
    },
  },

  /* --- Retail y productos de consumo ------------------------------------------------ */
  {
    id: "supply_serves",
    when: (thesis) => thesis.industryId === "retail_consumer",
    slot: {
      id: "supply_serves",
      claim: loc(
        "La red de suministro existente puede servir ese mercado dentro del sobre de coste.",
        "The existing supply network can serve that market within the cost envelope."
      ),
      test: "supply_chain",
      area: "positioning",
      consequence: "dies",
      origin: "sector",
      provenance: loc(
        "Convención del sector de distribución y gran consumo; no procede del libro.",
        "Practice in retail and consumer goods; it does not come from the book."
      ),
    },
  },
  {
    id: "product_compliant",
    when: (thesis) => thesis.industryId === "retail_consumer",
    slot: {
      id: "product_compliant",
      claim: loc(
        "El producto cumple la normativa local de composición, etiquetado y seguridad.",
        "The product complies with local rules on composition, labelling and safety."
      ),
      test: "product_compliance",
      area: "thesis",
      consequence: "dies",
      origin: "sector",
      provenance: loc(
        "Convención del sector de distribución y gran consumo; no procede del libro.",
        "Practice in retail and consumer goods; it does not come from the book."
      ),
    },
  },
  {
    id: "brand_fits",
    when: (thesis) => thesis.industryId === "retail_consumer",
    slot: {
      id: "brand_fits",
      claim: loc(
        "La posición en ese mercado refuerza la marca en lugar de diluirla.",
        "The position in that market reinforces the brand rather than diluting it."
      ),
      test: "brand_fit",
      area: "positioning",
      consequence: "changes_mode",
      origin: "sector",
      provenance: loc(
        "Convención del sector; se apoya en la Tabla 5.4, p. 190.",
        "Sector practice; it rests on Table 5.4, p. 190."
      ),
    },
  },
  {
    id: "esg_acceptable",
    when: (thesis) => thesis.industryId === "retail_consumer",
    slot: {
      id: "esg_acceptable",
      claim: loc(
        "Las cuestiones ambientales y sociales del país son asumibles para la marca.",
        "The country's environmental and social issues are acceptable for the brand."
      ),
      test: "responsible_sourcing",
      area: "assessment",
      consequence: "changes_mode",
      origin: "sector",
      provenance: loc(
        "Convención del sector; el libro lo plantea como filtro previo a la inversión, p. 242.",
        "Sector practice; the book frames it as a filter before investing, p. 242."
      ),
    },
  },
];

/* ------------------------------------------------------------------------------------ */
/* Respuestas del analista                                                               */
/* ------------------------------------------------------------------------------------ */

/**
 * La herramienta no sabe si un supuesto es cierto: lo declara quien analiza. Lo que sí hace es
 * exigir que diga qué lo falsaría, que es el campo que separa una creencia de una apuesta.
 */
export type Belief = "holds" | "does_not_hold" | "unknown";

export const BELIEFS: { id: Belief; label: Localized }[] = [
  { id: "holds", label: loc("Se sostiene", "Holds") },
  { id: "does_not_hold", label: loc("No se sostiene", "Does not hold") },
  { id: "unknown", label: loc("Sin averiguar", "Not yet established") },
];

export type AssumptionAnswer = {
  slotId: string;
  belief: Belief;
  /** 0 a 4, como el resto de la herramienta. */
  confidence: number | null;
  evidence: string | null;
  /** Qué lo falsaría. Sin esto, el supuesto no está contestado. */
  falsifier: string | null;
};

export function emptyAnswer(slotId: string): AssumptionAnswer {
  return { slotId, belief: "unknown", confidence: null, evidence: null, falsifier: null };
}
