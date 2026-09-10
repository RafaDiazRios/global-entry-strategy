/**
 * Módulo 2 — Posicionamiento global y sistema de negocio.
 *
 * Capítulo 5 de Lasserre y Monteiro, pp. 188-199. La rejilla ERRC y el mapa de utilidad del
 * comprador no salen del libro: vienen del módulo 10 del programa (Kim y Mauborgne), y el
 * libro los admite como quinta tipología de ventaja competitiva en la Tabla 5.5, p. 194.
 */

/* ------------------------------------------------------------------------------------ */
/* Propuesta de valor — Fig. 5.8 (p. 189) y Tabla 5.4 (p. 190)                           */
/* ------------------------------------------------------------------------------------ */

export type Scope = "niche" | "broad";
export type Advantage = "cost" | "differentiated";
export type Standardization = "standardized" | "adaptive";

export const VALUE_PROPOSITION_DIMENSIONS = [
  {
    id: "scope",
    label: "Alcance de segmentos",
    question: "¿Uno o dos segmentos, o todos?",
    options: [
      { id: "niche", label: "Nicho", hint: "Posicionamiento que Porter llama focalizado." },
      { id: "broad", label: "Amplio", hint: "Abarca muchos o todos los segmentos de cliente." },
    ],
    provenance: "p. 190",
  },
  {
    id: "advantage",
    label: "Tipo de ventaja",
    question: "¿Se compite por precio o por atributos de valor?",
    options: [
      { id: "cost", label: "Coste", hint: "Liderazgo en costes sobre producto o servicio estandarizado." },
      { id: "differentiated", label: "Diferenciación", hint: "Rendimiento, calidad, servicio, personalización." },
    ],
    provenance: "Fig. 5.8, p. 189",
  },
  {
    id: "standardization",
    label: "Grado de estandarización",
    question: "¿La propuesta es la misma en todo el mundo o se adapta por país?",
    options: [
      { id: "standardized", label: "Estandarizada", hint: "Mismos atributos y mismos segmentos en todo el globo." },
      { id: "adaptive", label: "Adaptativa", hint: "Atributos o segmentos distintos según país o región." },
    ],
    provenance: "p. 190",
  },
] as const;

export type PositioningId =
  | "standardized_niche_differentiator"
  | "low_cost_standardized_niche"
  | "differentiated_niche_adapter"
  | "low_cost_niche_adapter"
  | "broad_standardized_differentiator"
  | "broad_standardized_cost"
  | "broad_adaptive_differentiator"
  | "broad_adaptive_cost_leader";

export type Positioning = {
  id: PositioningId;
  label: string;
  family: "Jugadores globales de nicho" | "Jugadores globales amplios";
  scope: Scope;
  advantage: Advantage;
  standardization: Standardization;
  examples: string[];
};

/** Tabla 5.4, «Global positioning alternatives», p. 190. */
export const POSITIONINGS: Positioning[] = [
  { id: "standardized_niche_differentiator", label: "Diferenciador de nicho estandarizado", family: "Jugadores globales de nicho", scope: "niche", advantage: "differentiated", standardization: "standardized", examples: ["Swatch", "Intel"] },
  { id: "low_cost_standardized_niche", label: "Nicho estandarizado de bajo coste", family: "Jugadores globales de nicho", scope: "niche", advantage: "cost", standardization: "standardized", examples: ["Acer"] },
  { id: "differentiated_niche_adapter", label: "Adaptador de nicho diferenciado", family: "Jugadores globales de nicho", scope: "niche", advantage: "differentiated", standardization: "adaptive", examples: ["McDonald's"] },
  { id: "low_cost_niche_adapter", label: "Adaptador de nicho de bajo coste", family: "Jugadores globales de nicho", scope: "niche", advantage: "cost", standardization: "adaptive", examples: ["Carrefour"] },
  { id: "broad_standardized_differentiator", label: "Diferenciador amplio estandarizado", family: "Jugadores globales amplios", scope: "broad", advantage: "differentiated", standardization: "standardized", examples: ["Sony"] },
  { id: "broad_standardized_cost", label: "Coste amplio estandarizado", family: "Jugadores globales amplios", scope: "broad", advantage: "cost", standardization: "standardized", examples: ["Matsushita"] },
  { id: "broad_adaptive_differentiator", label: "Diferenciador amplio adaptativo", family: "Jugadores globales amplios", scope: "broad", advantage: "differentiated", standardization: "adaptive", examples: ["Unilever", "P&G", "Philips"] },
  { id: "broad_adaptive_cost_leader", label: "Líder en coste amplio adaptativo", family: "Jugadores globales amplios", scope: "broad", advantage: "cost", standardization: "adaptive", examples: ["Electrolux"] },
];

export const POSITIONINGS_PROVENANCE = "Lasserre y Monteiro, Tabla 5.4, p. 190";

/* ------------------------------------------------------------------------------------ */
/* Capacidades y ventaja competitiva — Tablas 5.5 (p. 194) y 5.7 (p. 197)                */
/* ------------------------------------------------------------------------------------ */

export type CapabilityTypeId = "differentiation" | "cost_leadership" | "innovative" | "time_based" | "blue_ocean";

export const CAPABILITY_TYPES: { id: CapabilityTypeId; label: string; definition: string; items: string[] }[] = [
  {
    id: "differentiation",
    label: "Diferenciación",
    definition: "Capacidades que aumentan el valor percibido por el cliente.",
    items: ["Tecnología superior", "Calidad superior", "Diseño innovador", "Mejor funcionalidad", "Personalización", "Mejores servicios asociados", "Compra en un solo punto", "Venta de soluciones", "Imagen de marca", "Distribución con capacidad de respuesta", "Relaciones con clientes", "Servicios al cliente", "Financiación"],
  },
  {
    id: "cost_leadership",
    label: "Liderazgo en costes",
    definition: "Capacidades que permiten una posición de bajo coste.",
    items: ["Materia prima barata", "Mano de obra barata", "Economías de escala", "Economías de alcance", "Volumen acumulado", "Base de clientes", "Externalidades de red", "Tecnología de proceso eficiente", "Gestión del tiempo", "Gestión de la productividad"],
  },
  {
    id: "innovative",
    label: "Ventaja innovadora",
    definition: "Capacidades que permiten ir por delante en el desarrollo de nuevos productos o servicios.",
    items: ["Crear nuevos espacios de mercado", "Encontrar soluciones nuevas", "Cambio radical en la gestión de la cadena de valor", "Crear nuevos diseños de negocio"],
  },
  {
    id: "time_based",
    label: "Ventaja de tiempo",
    definition: "Capacidades que hacen a la empresa más rápida en adaptarse y entregar valor.",
    items: ["I+D más rápida", "Logística más rápida", "Tiempo de respuesta corto"],
  },
  {
    id: "blue_ocean",
    label: "Estrategia de océano azul",
    definition: "Capacidad de crear un espacio de mercado nuevo con una curva de valor distinta.",
    items: ["Eliminar elementos que no añaden valor", "Reducir elementos menos importantes", "Aumentar elementos que necesitan énfasis", "Crear elementos nuevos"],
  },
];

export const CAPABILITY_TYPES_PROVENANCE = "Lasserre y Monteiro, Tabla 5.5, p. 194";

export type SustainabilityTypeId = "customer_loyalty" | "network_externalities" | "accumulated_volume" | "pre_emption";
export type BuildingModeId = "first_mover" | "leverage";

export const SUSTAINABILITY_TYPES: { id: SustainabilityTypeId; label: string; definition: string }[] = [
  { id: "customer_loyalty", label: "Lealtad del cliente", definition: "Marca fuerte o valor único para el cliente, o altos costes de cambio." },
  { id: "network_externalities", label: "Externalidades de red", definition: "Retroalimentación positiva por efectos de red o efecto experiencia." },
  { id: "accumulated_volume", label: "Volumen acumulado", definition: "Efecto experiencia derivado de operar a escala global." },
  { id: "pre_emption", label: "Pre-emption", definition: "Apropiación anticipada de recursos clave: ubicaciones, personal, distribución, patentes." },
];

export const BUILDING_MODES: { id: BuildingModeId; label: string; definition: string }[] = [
  { id: "first_mover", label: "Primer entrante", definition: "Estar entre los primeros competidores en entrar en un mercado dado." },
  { id: "leverage", label: "Apalancamiento", definition: "Explotar capacidades ya construidas en otros países para desplazar a los competidores establecidos." },
];

/** Tabla 5.7, «Building global sustainable advantage», p. 197. Celdas del original. */
export const SUSTAINABILITY_MATRIX: Record<BuildingModeId, Partial<Record<SustainabilityTypeId, string>>> = {
  first_mover: {
    customer_loyalty: "Introducir un concepto o producto nuevo; crear marca nueva.",
    network_externalities: "Crear el estándar en los países clave al principio del ciclo de vida del producto.",
    accumulated_volume: "Construir volumen deprisa.",
    pre_emption: "Capturar ubicaciones, distribución, talento disponible, socios.",
  },
  leverage: {
    customer_loyalty: "Usar la marca global; apalancar la I+D para innovar y diferenciar.",
    network_externalities: "Usar la base de clientes global existente para expandirse.",
    accumulated_volume: "Usar el efecto experiencia de las operaciones globales para ser líder en coste.",
  },
};

/* ------------------------------------------------------------------------------------ */
/* Configuración de la cadena de valor — Fig. 5.12 (p. 193) y pp. 197-198                */
/* ------------------------------------------------------------------------------------ */

export type ValueChainFunctionId = "rnd" | "sourcing_production" | "marketing" | "customer_services" | "finances" | "hrm";
export type ValueChainLevel = "global" | "regional" | "local";

export const VALUE_CHAIN_LEVELS: { id: ValueChainLevel; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "regional", label: "Regional" },
  { id: "local", label: "Local" },
];

/** Fig. 5.12: los ejemplos de cada celda se usan como pista en la interfaz. */
export const VALUE_CHAIN_FUNCTIONS: { id: ValueChainFunctionId; label: string; hints: Record<ValueChainLevel, string> }[] = [
  {
    id: "rnd",
    label: "Investigación y desarrollo",
    hints: {
      global: "I+D central, estrategia técnica, tecnología y productos núcleo, inteligencia tecnológica",
      regional: "Desarrollo de productos regionales, inteligencia regional, seminarios regionales",
      local: "Laboratorios locales",
    },
  },
  {
    id: "sourcing_production",
    label: "Aprovisionamiento y producción",
    hints: {
      global: "Fábricas globales, flujo global de materiales, ingeniería de procesos, compras centrales",
      regional: "Fábricas regionales, aprovisionamiento regional",
      local: "Producción local, aprovisionamiento local",
    },
  },
  {
    id: "marketing",
    label: "Marketing",
    hints: {
      global: "Estrategia global de marketing, comunicación global, posicionamiento global",
      regional: "Inteligencia regional, gestión regional de producto, cuentas regionales, licitación regional",
      local: "Distribución, promoción, ventas",
    },
  },
  {
    id: "customer_services",
    label: "Servicio al cliente",
    hints: {
      global: "Políticas, procedimientos, sistema de información",
      regional: "Soporte regional al cliente, logística, mantenimiento",
      local: "Servicio posventa",
    },
  },
  {
    id: "finances",
    label: "Finanzas",
    hints: {
      global: "Finanzas corporativas, tesorería global, control",
      regional: "Financiación de deuda regional, control regional",
      local: "Endeudamiento local",
    },
  },
  {
    id: "hrm",
    label: "Recursos humanos",
    hints: {
      global: "Gestión internacional de personas",
      regional: "Carreras y formación regionales",
      local: "Carreras y formación locales",
    },
  },
];

export type ConfigurationId = "global" | "regional" | "multinational";

export const CONFIGURATIONS: { id: ConfigurationId; label: string; definition: string; provenance: string }[] = [
  { id: "global", label: "Configuración global", definition: "El mundo se considera un solo mercado: productos estandarizados y organización centralizada.", provenance: "p. 197" },
  { id: "regional", label: "Configuración regional", definition: "El enfoque competitivo se diferencia por características regionales y la estructura se diseña alrededor de las regiones.", provenance: "p. 198" },
  { id: "multinational", label: "Configuración multinacional", definition: "El mundo es un conjunto de países distintos y la estrategia competitiva se adapta a cada entorno.", provenance: "p. 198" },
];

/* ------------------------------------------------------------------------------------ */
/* Transfer, Adapt, Create — Fig. 5.14 (p. 199)                                          */
/* ------------------------------------------------------------------------------------ */

export type TacTag = "transfer" | "adapt" | "create";
export type CapabilityKind = "resource" | "asset" | "competency";

export const TAC_TAGS: { id: TacTag; label: string; definition: string }[] = [
  { id: "transfer", label: "Transferir", definition: "Se traslada al nuevo territorio sin cambios." },
  { id: "adapt", label: "Adaptar", definition: "Se traslada con adaptación a las condiciones locales." },
  { id: "create", label: "Crear", definition: "Hay que construirlo desde cero en el país de entrada." },
];

export const CAPABILITY_KINDS: { id: CapabilityKind; label: string; definition: string }[] = [
  { id: "resource", label: "Recurso", definition: "Personas, finanzas, materias primas, información, contactos, infraestructura externa." },
  { id: "asset", label: "Activo", definition: "Instalaciones, equipos, logística, puntos de distribución, sistemas, marca, fondo de comercio." },
  { id: "competency", label: "Competencia", definition: "Saber hacer técnico, gestión de proyectos, del tiempo, de la información, de la calidad, del servicio." },
];

/* ------------------------------------------------------------------------------------ */
/* Curva de valor, ERRC y mapa de utilidad — módulo 10 del programa (Kim y Mauborgne)    */
/* ------------------------------------------------------------------------------------ */

export type ErrcAction = "eliminate" | "reduce" | "raise" | "create" | "keep";

export const ERRC_ACTIONS: { id: ErrcAction; label: string; definition: string }[] = [
  { id: "eliminate", label: "Eliminar", definition: "Atributos que el sector da por supuestos y que pueden suprimirse." },
  { id: "reduce", label: "Reducir", definition: "Atributos sobredimensionados respecto a lo que el cliente valora." },
  { id: "raise", label: "Aumentar", definition: "Atributos que el sector ofrece por debajo de lo que el cliente necesita." },
  { id: "create", label: "Crear", definition: "Atributos nuevos que el sector no ofrece todavía." },
  { id: "keep", label: "Mantener", definition: "Atributos que no cambian entre la curva actual y la propuesta." },
];

export const BUYER_EXPERIENCE_STAGES = [
  { id: "purchase", label: "Compra" },
  { id: "delivery", label: "Entrega" },
  { id: "use", label: "Uso" },
  { id: "supplements", label: "Complementos" },
  { id: "maintenance", label: "Mantenimiento" },
  { id: "disposal", label: "Eliminación" },
] as const;

export const BUYER_UTILITY_LEVERS = [
  { id: "productivity", label: "Productividad del cliente" },
  { id: "simplicity", label: "Simplicidad" },
  { id: "convenience", label: "Comodidad" },
  { id: "risk", label: "Reducción de riesgo" },
  { id: "fun_image", label: "Diversión e imagen" },
  { id: "environment", label: "Respeto ambiental" },
] as const;

export const BUYER_UTILITY_PROVENANCE = "Módulo 10 del programa INSEAD CSO (Kim y Mauborgne); el libro lo cita como quinta tipología en la Tabla 5.5, p. 194";

/* ------------------------------------------------------------------------------------ */
/* Entrada del módulo                                                                    */
/* ------------------------------------------------------------------------------------ */

export type ValueCurveAttribute = {
  id: string;
  label: string;
  /** 0 a 5. `asIs` es la curva actual de la empresa; `toBe` la propuesta. */
  asIs: number | null;
  toBe: number | null;
  competitors: Record<string, number | null>;
  note: string | null;
};

export type TacEntry = {
  id: string;
  kind: CapabilityKind;
  label: string;
  functionId: ValueChainFunctionId | null;
  tag: TacTag | null;
  note: string | null;
};

export type PositioningInput = {
  scope: Scope | null;
  advantage: Advantage | null;
  standardization: Standardization | null;
  positioningRationale: string | null;
  competitors: { id: string; label: string }[];
  valueCurve: ValueCurveAttribute[];
  buyerUtility: Record<string, string | null>;
  /** `current` y `target` por función: dónde se gestiona hoy y dónde debería gestionarse. */
  valueChain: Record<ValueChainFunctionId, { current: ValueChainLevel | null; target: ValueChainLevel | null }>;
  capabilities: { id: string; typeId: CapabilityTypeId; label: string; isAdvantage: boolean }[];
  sustainability: { typeId: SustainabilityTypeId; modeId: BuildingModeId; how: string | null }[];
  tac: TacEntry[];
  liabilityOfForeignness: { handicap: string | null; compensatingAdvantage: string | null };
};

export function emptyPositioningInput(): PositioningInput {
  const valueChain = {} as PositioningInput["valueChain"];
  for (const fn of VALUE_CHAIN_FUNCTIONS) valueChain[fn.id] = { current: null, target: null };
  return {
    scope: null,
    advantage: null,
    standardization: null,
    positioningRationale: null,
    competitors: [],
    valueCurve: [],
    buyerUtility: {},
    valueChain,
    capabilities: [],
    sustainability: [],
    tac: [],
    liabilityOfForeignness: { handicap: null, compensatingAdvantage: null },
  };
}
