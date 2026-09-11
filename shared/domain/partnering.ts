/**
 * Módulo 5 — Vía de acceso a los recursos que faltan.
 *
 * Dos orígenes distintos, y conviene no confundirlos:
 *
 * - La opción real, los tipos de socio local y las cuatro pruebas de encaje vienen de
 *   Lasserre y Monteiro, capítulo 7 (pp. 265-270, Tabla 7.3 en p. 267) y del resumen de la
 *   p. 278, que remite al capítulo 8.
 * - El árbol build-borrow-buy viene de Capron y Mitchell. Las preguntas de esta herramienta
 *   son propias: reformulan los tres ejes del marco sin reproducir el cuestionario del
 *   programa.
 *
 * La entrada de este módulo es la lista de capacidades etiquetadas «crear» en el
 * Transfer-Adapt-Create de la Fase 3: lo que no viaja hay que construirlo, alquilarlo o
 * comprarlo.
 *
 * Bilingüe: cada etiqueta lleva su par `{ es, en }` junto a la definición del marco.
 */

import { loc, type Localized } from "../i18n";

/* ------------------------------------------------------------------------------------ */
/* La opción real — p. 270                                                               */
/* ------------------------------------------------------------------------------------ */

export type OptionStance = "hold" | "expand" | "retreat";

/**
 * El libro plantea la entrada preliminar como una opción de compra: se paga una prima
 * —la inversión inicial— por el derecho a observar el negocio y decidir después. Lo que
 * aquí se modela no es el valor de Black-Scholes, que el libro no da, sino la estructura de
 * la decisión: qué se paga, cuánto dura la observación, qué se mira y qué se hace después.
 */
export const OPTION_EXPANSION_PATHS: { id: string; label: Localized; from: string; to: string }[] = [
  { id: "jv_stake_up", label: loc("Aumentar la participación en la empresa conjunta", "Increase the stake in the joint venture"), from: "alliance", to: "greenfield" },
  { id: "licence_to_acquisition", label: loc("Transformar la licencia en adquisición", "Turn the licence into an acquisition"), from: "licensing", to: "acquisition" },
  { id: "distributor_to_investment", label: loc("Sustituir al distribuidor por inversión propia", "Replace the distributor with own investment"), from: "distributor", to: "greenfield" },
  { id: "office_to_operation", label: loc("Convertir la oficina en operación", "Turn the office into an operation"), from: "office", to: "greenfield" },
];

export const OPTION_RETREAT_PATHS: { id: string; label: Localized }[] = [
  { id: "sell_jv_share", label: loc("Vender la participación en la empresa conjunta", "Sell the joint-venture stake") },
  { id: "continue_under_licence", label: loc("Continuar solo bajo licencia", "Continue under licence only") },
  { id: "continue_as_distributor", label: loc("Continuar solo como distribuidor", "Continue as distributor only") },
  { id: "sell_business", label: loc("Vender el negocio", "Sell the business") },
];

export const REAL_OPTION_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, «Entry modes seen as real options», p. 270",
  "Lasserre and Monteiro, \u201cEntry modes seen as real options\u201d, p. 270"
);

export type RealOptionInput = {
  /** Prima de la opción: la inversión preliminar que se paga por poder observar. */
  premium: number | null;
  currency: string | null;
  /** Duración del periodo de prueba, en años. */
  trialYears: number | null;
  /** Qué se observa para decidir. Sin esto la opción no es una opción, es una apuesta. */
  triggers: { id: string; signal: string; threshold: string | null; stance: OptionStance }[];
  expansionPathId: string | null;
  retreatPathId: string | null;
  note: string | null;
};

/* ------------------------------------------------------------------------------------ */
/* Build, borrow, buy — marco de Capron y Mitchell, preguntas propias                    */
/* ------------------------------------------------------------------------------------ */

export type BbbAxisId = "internal_relevance" | "tradability" | "partner_closeness" | "integration_capacity";
export type BbbRoute = "build" | "borrow_contract" | "borrow_alliance" | "buy";

export const BBB_AXES: { id: BbbAxisId; label: Localized; question: Localized; lowMeans: Localized; highMeans: Localized }[] = [
  {
    id: "internal_relevance",
    label: loc("Relevancia de lo que ya tenemos", "Relevance of what we already have"),
    question: loc(
      "¿Hasta qué punto los recursos y competencias actuales sirven de base para construir lo que falta?",
      "How far do current resources and competencies serve as a base for building what is missing?"
    ),
    lowMeans: loc(
      "Lo que hay dentro no se parece a lo que hace falta",
      "What is inside bears no resemblance to what is needed"
    ),
    highMeans: loc(
      "Lo que hay dentro es una base sólida y reciente para desarrollarlo",
      "What is inside is a solid, up-to-date base for developing it"
    ),
  },
  {
    id: "tradability",
    label: loc("Negociabilidad del recurso", "Tradability of the resource"),
    question: loc(
      "¿Se puede obtener ese recurso mediante un contrato claro, con su alcance y su precio delimitados?",
      "Can the resource be obtained through a clear contract, with its scope and price defined?"
    ),
    lowMeans: loc(
      "El recurso es tácito, está incrustado en personas o rutinas y no se deja contratar",
      "The resource is tacit, embedded in people or routines, and will not be contracted for"
    ),
    highMeans: loc(
      "Se puede licenciar o contratar con condiciones verificables",
      "It can be licensed or contracted with verifiable terms"
    ),
  },
  {
    id: "partner_closeness",
    label: loc("Cercanía necesaria con el socio", "Closeness required with the partner"),
    question: loc(
      "¿Cuánta coordinación diaria hace falta con quien aporte el recurso?",
      "How much day-to-day coordination is needed with whoever brings the resource?"
    ),
    lowMeans: loc(
      "Basta una relación a distancia y por contrato",
      "An arm's-length, contractual relationship is enough"
    ),
    highMeans: loc(
      "Exige trabajar juntos, compartir decisiones y ajustar sobre la marcha",
      "It requires working together, sharing decisions and adjusting as you go"
    ),
  },
  {
    id: "integration_capacity",
    label: loc("Capacidad de integrar", "Capacity to integrate"),
    question: loc(
      "¿Puede la empresa absorber una organización ajena sin destruir lo que la hacía valiosa?",
      "Can the firm absorb another organization without destroying what made it valuable?"
    ),
    lowMeans: loc(
      "No hay experiencia ni capacidad de integración",
      "There is neither experience nor integration capability"
    ),
    highMeans: loc(
      "Hay método y experiencia probada de integración",
      "There is method and proven integration experience"
    ),
  },
];

export const BBB_ROUTES: { id: BbbRoute; label: Localized; definition: Localized; typicalModes: string[] }[] = [
  {
    id: "build",
    label: loc("Construir", "Build"),
    definition: loc(
      "Desarrollarlo internamente a partir de lo que ya se tiene.",
      "Develop it internally from what the firm already has."
    ),
    typicalModes: ["greenfield"],
  },
  {
    id: "borrow_contract",
    label: loc("Alquilar por contrato", "Borrow through contract"),
    definition: loc(
      "Licencia, franquicia o contrato de suministro con alcance y precio delimitados.",
      "Licence, franchise or supply contract with defined scope and price."
    ),
    typicalModes: ["licensing", "distributor"],
  },
  {
    id: "borrow_alliance",
    label: loc("Alquilar por alianza", "Borrow through alliance"),
    definition: loc(
      "Empresa conjunta o alianza cuando el recurso no se deja contratar y hace falta trabajar juntos.",
      "Joint venture or alliance when the resource cannot be contracted for and joint work is required."
    ),
    typicalModes: ["alliance"],
  },
  {
    id: "buy",
    label: loc("Comprar", "Buy"),
    definition: loc(
      "Adquisición, cuando ni se construye ni se alquila y además se puede integrar.",
      "Acquisition, when it can be neither built nor borrowed and the firm can integrate."
    ),
    typicalModes: ["acquisition"],
  },
];

export const BBB_PROVENANCE: Localized = loc(
  "Marco de Capron y Mitchell («Build, Borrow or Buy»); preguntas propias de esta herramienta",
  "Capron and Mitchell's framework (\u201cBuild, Borrow or Buy\u201d); the questions are this tool's own"
);

/* ------------------------------------------------------------------------------------ */
/* Las cuatro pruebas de encaje — p. 278, desarrolladas en el capítulo 8                  */
/* ------------------------------------------------------------------------------------ */

export type FitId = "strategic" | "capability" | "cultural" | "organizational";

export const PARTNER_FITS: { id: FitId; label: Localized; question: Localized; failureSign: Localized }[] = [
  {
    id: "strategic",
    label: loc("Encaje estratégico", "Strategic fit"),
    question: loc(
      "¿Los objetivos de las dos partes son compatibles y duraderos, o solo coinciden hoy?",
      "Are both parties' objectives compatible and durable, or do they merely coincide today?"
    ),
    failureSign: loc(
      "El socio quiere de la alianza justo lo que nosotros no queremos darle",
      "The partner wants from the alliance exactly what we do not want to give"
    ),
  },
  {
    id: "capability",
    label: loc("Encaje de capacidades", "Capability fit"),
    question: loc(
      "¿Cada parte aporta algo que la otra no tiene y necesita?",
      "Does each party bring something the other lacks and needs?"
    ),
    failureSign: loc(
      "Los dos aportan lo mismo, o uno aporta solo dinero cuando hacía falta conocimiento",
      "Both bring the same thing, or one brings only money when knowledge was what was needed"
    ),
  },
  {
    id: "cultural",
    label: loc("Encaje cultural", "Cultural fit"),
    question: loc(
      "¿Las formas de decidir, de tratar el conflicto y de entender el tiempo son compatibles?",
      "Are the ways of deciding, handling conflict and understanding time compatible?"
    ),
    failureSign: loc(
      "Lo que una parte considera un acuerdo, la otra lo considera el principio de la negociación",
      "What one party treats as an agreement, the other treats as the start of the negotiation"
    ),
  },
  {
    id: "organizational",
    label: loc("Encaje organizativo", "Organizational fit"),
    question: loc(
      "¿Los procesos, sistemas y ritmos de decisión pueden trabajar juntos sin fricción permanente?",
      "Can the processes, systems and decision rhythms work together without permanent friction?"
    ),
    failureSign: loc(
      "Cada decisión operativa sube a un comité distinto en cada casa",
      "Every operating decision escalates to a different committee on each side"
    ),
  },
];

export const PARTNER_FITS_PROVENANCE: Localized = loc(
  "p. 278; desarrollo en el capítulo 8",
  "p. 278; developed in chapter 8"
);

/* ------------------------------------------------------------------------------------ */
/* Tipos de socio local — Tabla 7.3, p. 267                                              */
/* ------------------------------------------------------------------------------------ */

export type PartnerTypeId = "supplier" | "customer_distributor" | "competitor" | "diversifier" | "investor" | "government";

export const PARTNER_TYPES: {
  id: PartnerTypeId;
  label: Localized;
  foreignMotives: Localized[];
  foreignRisks: Localized[];
}[] = [
  {
    id: "supplier",
    label: loc("Proveedor", "Supplier"),
    foreignMotives: [loc("Asegurar materias primas", "Securing raw materials")],
    foreignRisks: [
      loc("Quedar atado a un solo proveedor", "Being locked into a single supplier"),
      loc("Calidad no óptima", "Sub-optimal quality"),
      loc("Presión para una adquisición vertical por parte del socio", "Pressure from the partner for a vertical acquisition"),
    ],
  },
  {
    id: "customer_distributor",
    label: loc("Cliente o distribuidor", "Customer or distributor"),
    foreignMotives: [loc("Acceso al mercado", "Market access"), loc("Aprender del mercado", "Learning about the market")],
    foreignRisks: [
      loc("Falta de competencias industriales de conjunto", "Lack of overall industrial competencies"),
      loc("Mentalidad cortoplacista del socio", "Short-term mindset of the partner"),
      loc("Dependencia", "Dependency"),
      loc("Presión para una adquisición vertical", "Pressure for a vertical acquisition"),
    ],
  },
  {
    id: "competitor",
    label: loc("Competidor", "Competitor"),
    foreignMotives: [
      loc("Acceso al mercado", "Market access"),
      loc("Aprender del mercado", "Learning about the market"),
      loc("Recursos: activos y personas", "Resources: assets and people"),
      loc("Control del mercado", "Market control"),
    ],
    foreignRisks: [
      loc("Copia y fuga tecnológica", "Copying and technological leakage"),
      loc("Conflictos con otros productos del socio", "Conflicts with the partner's other products"),
    ],
  },
  {
    id: "diversifier",
    label: loc("Diversificador", "Diversifier"),
    foreignMotives: [
      loc("Poder y contactos", "Power and contacts"),
      loc("Perfil y reputación altos", "High profile and reputation"),
      loc("Poca o ninguna interferencia en la operación", "Little or no interference in the operation"),
      loc("Flexibilidad", "Flexibility"),
    ],
    foreignRisks: [
      loc("Recursos escasos del socio", "Scarce resources on the partner's side"),
      loc("Nada que aprender de él", "Nothing to learn from them"),
      loc("Posible oportunismo", "Possible opportunism"),
    ],
  },
  {
    id: "investor",
    label: loc("Inversor", "Investor"),
    foreignMotives: [
      loc("Contactos", "Contacts"),
      loc("Perfil y reputación altos", "High profile and reputation"),
      loc("Satisfacer requisitos legales", "Meeting legal requirements"),
      loc("Capital", "Capital"),
    ],
    foreignRisks: [
      loc("Nada que aprender", "Nothing to learn"),
      loc("Oportunismo", "Opportunism"),
      loc("Ningún apoyo operativo", "No operational support"),
    ],
  },
  {
    id: "government",
    label: loc("Gobierno", "Government"),
    foreignMotives: [
      loc("Satisfacer requisitos legales", "Meeting legal requirements"),
      loc("Preferencias favorables", "Favourable preferences"),
    ],
    foreignRisks: [
      loc("Burocracia", "Bureaucracy"),
      loc("Quedar dentro de luchas políticas", "Getting caught in political struggles"),
    ],
  },
];

export const PARTNER_TYPES_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, Tabla 7.3, p. 267",
  "Lasserre and Monteiro, Table 7.3, p. 267"
);

/** Categorías de socio del resumen de la p. 278. */
export const PARTNER_CATEGORIES: { id: string; label: Localized; definition: Localized }[] = [
  {
    id: "sleeping",
    label: loc("Durmiente", "Sleeping partner"),
    definition: loc("Aporta la firma y poco más; no interviene en la gestión.", "Brings the signature and little else; does not get involved in management."),
  },
  {
    id: "complementing",
    label: loc("Complementario", "Complementing partner"),
    definition: loc("Aporta lo que a la empresa le falta y necesita.", "Brings what the firm lacks and needs."),
  },
  {
    id: "investor",
    label: loc("Inversor", "Investing partner"),
    definition: loc("Aporta capital y cumplimiento legal.", "Brings capital and legal compliance."),
  },
  {
    id: "teaching",
    label: loc("Enseñante", "Teaching partner"),
    definition: loc("Aporta conocimiento que la empresa quiere absorber.", "Brings knowledge the firm wants to absorb."),
  },
  {
    id: "acquisition",
    label: loc("Preludio de adquisición", "Prelude to acquisition"),
    definition: loc("La alianza es el primer paso de una compra futura.", "The alliance is the first step of a future purchase."),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Entrada del módulo                                                                    */
/* ------------------------------------------------------------------------------------ */

export type PartneringInput = {
  /** Capacidades a conseguir. Se pueden traer del Transfer-Adapt-Create del módulo 2. */
  gaps: { id: string; label: string; axes: Partial<Record<BbbAxisId, number | null>>; chosenRoute: BbbRoute | null; note: string | null }[];
  partnerType: PartnerTypeId | null;
  partnerCategory: string | null;
  partnerName: string | null;
  fits: { id: FitId; score: number | null; evidence: string | null }[];
  realOption: RealOptionInput;
};

export function emptyPartneringInput(): PartneringInput {
  return {
    gaps: [],
    partnerType: null,
    partnerCategory: null,
    partnerName: null,
    fits: PARTNER_FITS.map((fit) => ({ id: fit.id, score: null, evidence: null })),
    realOption: { premium: null, currency: null, trialYears: null, triggers: [], expansionPathId: null, retreatPathId: null, note: null },
  };
}
