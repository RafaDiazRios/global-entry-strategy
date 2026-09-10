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
 */

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
export const OPTION_EXPANSION_PATHS: { id: string; label: string; from: string; to: string }[] = [
  { id: "jv_stake_up", label: "Aumentar la participación en la empresa conjunta", from: "alliance", to: "greenfield" },
  { id: "licence_to_acquisition", label: "Transformar la licencia en adquisición", from: "licensing", to: "acquisition" },
  { id: "distributor_to_investment", label: "Sustituir al distribuidor por inversión propia", from: "distributor", to: "greenfield" },
  { id: "office_to_operation", label: "Convertir la oficina en operación", from: "office", to: "greenfield" },
];

export const OPTION_RETREAT_PATHS: { id: string; label: string }[] = [
  { id: "sell_jv_share", label: "Vender la participación en la empresa conjunta" },
  { id: "continue_under_licence", label: "Continuar solo bajo licencia" },
  { id: "continue_as_distributor", label: "Continuar solo como distribuidor" },
  { id: "sell_business", label: "Vender el negocio" },
];

export const REAL_OPTION_PROVENANCE = "Lasserre y Monteiro, «Entry modes seen as real options», p. 270";

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

export const BBB_AXES: { id: BbbAxisId; label: string; question: string; lowMeans: string; highMeans: string }[] = [
  {
    id: "internal_relevance",
    label: "Relevancia de lo que ya tenemos",
    question: "¿Hasta qué punto los recursos y competencias actuales sirven de base para construir lo que falta?",
    lowMeans: "Lo que hay dentro no se parece a lo que hace falta",
    highMeans: "Lo que hay dentro es una base sólida y reciente para desarrollarlo",
  },
  {
    id: "tradability",
    label: "Negociabilidad del recurso",
    question: "¿Se puede obtener ese recurso mediante un contrato claro, con su alcance y su precio delimitados?",
    lowMeans: "El recurso es tácito, está incrustado en personas o rutinas y no se deja contratar",
    highMeans: "Se puede licenciar o contratar con condiciones verificables",
  },
  {
    id: "partner_closeness",
    label: "Cercanía necesaria con el socio",
    question: "¿Cuánta coordinación diaria hace falta con quien aporte el recurso?",
    lowMeans: "Basta una relación a distancia y por contrato",
    highMeans: "Exige trabajar juntos, compartir decisiones y ajustar sobre la marcha",
  },
  {
    id: "integration_capacity",
    label: "Capacidad de integrar",
    question: "¿Puede la empresa absorber una organización ajena sin destruir lo que la hacía valiosa?",
    lowMeans: "No hay experiencia ni capacidad de integración",
    highMeans: "Hay método y experiencia probada de integración",
  },
];

export const BBB_ROUTES: { id: BbbRoute; label: string; definition: string; typicalModes: string[] }[] = [
  { id: "build", label: "Construir", definition: "Desarrollarlo internamente a partir de lo que ya se tiene.", typicalModes: ["greenfield"] },
  { id: "borrow_contract", label: "Alquilar por contrato", definition: "Licencia, franquicia o contrato de suministro con alcance y precio delimitados.", typicalModes: ["licensing", "distributor"] },
  { id: "borrow_alliance", label: "Alquilar por alianza", definition: "Empresa conjunta o alianza cuando el recurso no se deja contratar y hace falta trabajar juntos.", typicalModes: ["alliance"] },
  { id: "buy", label: "Comprar", definition: "Adquisición, cuando ni se construye ni se alquila y además se puede integrar.", typicalModes: ["acquisition"] },
];

export const BBB_PROVENANCE = "Marco de Capron y Mitchell («Build, Borrow or Buy»); preguntas propias de esta herramienta";

/* ------------------------------------------------------------------------------------ */
/* Las cuatro pruebas de encaje — p. 278, desarrolladas en el capítulo 8                  */
/* ------------------------------------------------------------------------------------ */

export type FitId = "strategic" | "capability" | "cultural" | "organizational";

export const PARTNER_FITS: { id: FitId; label: string; question: string; failureSign: string }[] = [
  {
    id: "strategic",
    label: "Encaje estratégico",
    question: "¿Los objetivos de las dos partes son compatibles y duraderos, o solo coinciden hoy?",
    failureSign: "El socio quiere de la alianza justo lo que nosotros no queremos darle",
  },
  {
    id: "capability",
    label: "Encaje de capacidades",
    question: "¿Cada parte aporta algo que la otra no tiene y necesita?",
    failureSign: "Los dos aportan lo mismo, o uno aporta solo dinero cuando hacía falta conocimiento",
  },
  {
    id: "cultural",
    label: "Encaje cultural",
    question: "¿Las formas de decidir, de tratar el conflicto y de entender el tiempo son compatibles?",
    failureSign: "Lo que una parte considera un acuerdo, la otra lo considera el principio de la negociación",
  },
  {
    id: "organizational",
    label: "Encaje organizativo",
    question: "¿Los procesos, sistemas y ritmos de decisión pueden trabajar juntos sin fricción permanente?",
    failureSign: "Cada decisión operativa sube a un comité distinto en cada casa",
  },
];

export const PARTNER_FITS_PROVENANCE = "p. 278; desarrollo en el capítulo 8";

/* ------------------------------------------------------------------------------------ */
/* Tipos de socio local — Tabla 7.3, p. 267                                              */
/* ------------------------------------------------------------------------------------ */

export type PartnerTypeId = "supplier" | "customer_distributor" | "competitor" | "diversifier" | "investor" | "government";

export const PARTNER_TYPES: {
  id: PartnerTypeId;
  label: string;
  foreignMotives: string[];
  foreignRisks: string[];
}[] = [
  {
    id: "supplier",
    label: "Proveedor",
    foreignMotives: ["Asegurar materias primas"],
    foreignRisks: ["Quedar atado a un solo proveedor", "Calidad no óptima", "Presión para una adquisición vertical por parte del socio"],
  },
  {
    id: "customer_distributor",
    label: "Cliente o distribuidor",
    foreignMotives: ["Acceso al mercado", "Aprender del mercado"],
    foreignRisks: ["Falta de competencias industriales de conjunto", "Mentalidad cortoplacista del socio", "Dependencia", "Presión para una adquisición vertical"],
  },
  {
    id: "competitor",
    label: "Competidor",
    foreignMotives: ["Acceso al mercado", "Aprender del mercado", "Recursos: activos y personas", "Control del mercado"],
    foreignRisks: ["Copia y fuga tecnológica", "Conflictos con otros productos del socio"],
  },
  {
    id: "diversifier",
    label: "Diversificador",
    foreignMotives: ["Poder y contactos", "Perfil y reputación altos", "Poca o ninguna interferencia en la operación", "Flexibilidad"],
    foreignRisks: ["Recursos escasos del socio", "Nada que aprender de él", "Posible oportunismo"],
  },
  {
    id: "investor",
    label: "Inversor",
    foreignMotives: ["Contactos", "Perfil y reputación altos", "Satisfacer requisitos legales", "Capital"],
    foreignRisks: ["Nada que aprender", "Oportunismo", "Ningún apoyo operativo"],
  },
  {
    id: "government",
    label: "Gobierno",
    foreignMotives: ["Satisfacer requisitos legales", "Preferencias favorables"],
    foreignRisks: ["Burocracia", "Quedar dentro de luchas políticas"],
  },
];

export const PARTNER_TYPES_PROVENANCE = "Lasserre y Monteiro, Tabla 7.3, p. 267";

/** Categorías de socio del resumen de la p. 278. */
export const PARTNER_CATEGORIES: { id: string; label: string; definition: string }[] = [
  { id: "sleeping", label: "Durmiente", definition: "Aporta la firma y poco más; no interviene en la gestión." },
  { id: "complementing", label: "Complementario", definition: "Aporta lo que a la empresa le falta y necesita." },
  { id: "investor", label: "Inversor", definition: "Aporta capital y cumplimiento legal." },
  { id: "teaching", label: "Enseñante", definition: "Aporta conocimiento que la empresa quiere absorber." },
  { id: "acquisition", label: "Preludio de adquisición", definition: "La alianza es el primer paso de una compra futura." },
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
