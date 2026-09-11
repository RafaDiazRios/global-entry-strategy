/**
 * Módulo 2 — Posicionamiento global y sistema de negocio.
 *
 * Capítulo 5 de Lasserre y Monteiro, pp. 188-199. La rejilla ERRC y el mapa de utilidad del
 * comprador no salen del libro: vienen del módulo 10 del programa (Kim y Mauborgne), y el
 * libro los admite como quinta tipología de ventaja competitiva en la Tabla 5.5, p. 194.
 *
 * Bilingüe: cada etiqueta lleva su par `{ es, en }` al lado de la definición del marco.
 */

import { loc, type Localized } from "../i18n";

/* ------------------------------------------------------------------------------------ */
/* Propuesta de valor — Fig. 5.8 (p. 189) y Tabla 5.4 (p. 190)                           */
/* ------------------------------------------------------------------------------------ */

export type Scope = "niche" | "broad";
export type Advantage = "cost" | "differentiated";
export type Standardization = "standardized" | "adaptive";

export const VALUE_PROPOSITION_DIMENSIONS = [
  {
    id: "scope",
    label: loc("Alcance de segmentos", "Segment scope"),
    question: loc("¿Uno o dos segmentos, o todos?", "One or two segments, or all of them?"),
    options: [
      { id: "niche", label: loc("Nicho", "Niche"), hint: loc("Posicionamiento que Porter llama focalizado.", "The positioning Porter calls focused.") },
      { id: "broad", label: loc("Amplio", "Broad"), hint: loc("Abarca muchos o todos los segmentos de cliente.", "Covers many or all customer segments.") },
    ],
    provenance: loc("p. 190", "p. 190"),
  },
  {
    id: "advantage",
    label: loc("Tipo de ventaja", "Type of advantage"),
    question: loc("¿Se compite por precio o por atributos de valor?", "Do you compete on price or on value attributes?"),
    options: [
      { id: "cost", label: loc("Coste", "Cost"), hint: loc("Liderazgo en costes sobre producto o servicio estandarizado.", "Cost leadership on a standardized product or service.") },
      { id: "differentiated", label: loc("Diferenciación", "Differentiation"), hint: loc("Rendimiento, calidad, servicio, personalización.", "Performance, quality, service, customization.") },
    ],
    provenance: loc("Fig. 5.8, p. 189", "Fig. 5.8, p. 189"),
  },
  {
    id: "standardization",
    label: loc("Grado de estandarización", "Degree of standardization"),
    question: loc("¿La propuesta es la misma en todo el mundo o se adapta por país?", "Is the offer the same worldwide or adapted country by country?"),
    options: [
      { id: "standardized", label: loc("Estandarizada", "Standardized"), hint: loc("Mismos atributos y mismos segmentos en todo el globo.", "Same attributes and same segments across the globe.") },
      { id: "adaptive", label: loc("Adaptativa", "Adaptive"), hint: loc("Atributos o segmentos distintos según país o región.", "Different attributes or segments by country or region.") },
    ],
    provenance: loc("p. 190", "p. 190"),
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

export type PositioningFamilyId = "niche_players" | "broad_players";

export const POSITIONING_FAMILIES: { id: PositioningFamilyId; label: Localized }[] = [
  { id: "niche_players", label: loc("Jugadores globales de nicho", "Global niche players") },
  { id: "broad_players", label: loc("Jugadores globales amplios", "Broad global players") },
];

export function positioningFamilyLabel(id: PositioningFamilyId): Localized {
  return POSITIONING_FAMILIES.find((entry) => entry.id === id)?.label ?? loc(id, id);
}

export type Positioning = {
  id: PositioningId;
  label: Localized;
  familyId: PositioningFamilyId;
  scope: Scope;
  advantage: Advantage;
  standardization: Standardization;
  examples: string[];
};

/** Tabla 5.4, «Global positioning alternatives», p. 190. */
export const POSITIONINGS: Positioning[] = [
  { id: "standardized_niche_differentiator", label: loc("Diferenciador de nicho estandarizado", "Standardized niche differentiator"), familyId: "niche_players", scope: "niche", advantage: "differentiated", standardization: "standardized", examples: ["Swatch", "Intel"] },
  { id: "low_cost_standardized_niche", label: loc("Nicho estandarizado de bajo coste", "Low-cost standardized niche"), familyId: "niche_players", scope: "niche", advantage: "cost", standardization: "standardized", examples: ["Acer"] },
  { id: "differentiated_niche_adapter", label: loc("Adaptador de nicho diferenciado", "Differentiated niche adapter"), familyId: "niche_players", scope: "niche", advantage: "differentiated", standardization: "adaptive", examples: ["McDonald's"] },
  { id: "low_cost_niche_adapter", label: loc("Adaptador de nicho de bajo coste", "Low-cost niche adapter"), familyId: "niche_players", scope: "niche", advantage: "cost", standardization: "adaptive", examples: ["Carrefour"] },
  { id: "broad_standardized_differentiator", label: loc("Diferenciador amplio estandarizado", "Broad standardized differentiator"), familyId: "broad_players", scope: "broad", advantage: "differentiated", standardization: "standardized", examples: ["Sony"] },
  { id: "broad_standardized_cost", label: loc("Coste amplio estandarizado", "Broad standardized cost"), familyId: "broad_players", scope: "broad", advantage: "cost", standardization: "standardized", examples: ["Matsushita"] },
  { id: "broad_adaptive_differentiator", label: loc("Diferenciador amplio adaptativo", "Broad adaptive differentiator"), familyId: "broad_players", scope: "broad", advantage: "differentiated", standardization: "adaptive", examples: ["Unilever", "P&G", "Philips"] },
  { id: "broad_adaptive_cost_leader", label: loc("Líder en coste amplio adaptativo", "Broad adaptive cost leader"), familyId: "broad_players", scope: "broad", advantage: "cost", standardization: "adaptive", examples: ["Electrolux"] },
];

export const POSITIONINGS_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, Tabla 5.4, p. 190",
  "Lasserre and Monteiro, Table 5.4, p. 190"
);

/* ------------------------------------------------------------------------------------ */
/* Capacidades y ventaja competitiva — Tablas 5.5 (p. 194) y 5.7 (p. 197)                */
/* ------------------------------------------------------------------------------------ */

export type CapabilityTypeId = "differentiation" | "cost_leadership" | "innovative" | "time_based" | "blue_ocean";

export const CAPABILITY_TYPES: { id: CapabilityTypeId; label: Localized; definition: Localized; items: Localized[] }[] = [
  {
    id: "differentiation",
    label: loc("Diferenciación", "Differentiation"),
    definition: loc(
      "Capacidades que aumentan el valor percibido por el cliente.",
      "Capabilities that increase the value perceived by the customer."
    ),
    items: [
      loc("Tecnología superior", "Superior technology"),
      loc("Calidad superior", "Superior quality"),
      loc("Diseño innovador", "Innovative design"),
      loc("Mejor funcionalidad", "Better functionality"),
      loc("Personalización", "Customization"),
      loc("Mejores servicios asociados", "Better associated services"),
      loc("Compra en un solo punto", "One-stop shopping"),
      loc("Venta de soluciones", "Solution selling"),
      loc("Imagen de marca", "Brand image"),
      loc("Distribución con capacidad de respuesta", "Responsive distribution"),
      loc("Relaciones con clientes", "Customer relationships"),
      loc("Servicios al cliente", "Customer services"),
      loc("Financiación", "Financing"),
    ],
  },
  {
    id: "cost_leadership",
    label: loc("Liderazgo en costes", "Cost leadership"),
    definition: loc(
      "Capacidades que permiten una posición de bajo coste.",
      "Capabilities that deliver a low-cost position."
    ),
    items: [
      loc("Materia prima barata", "Cheap raw materials"),
      loc("Mano de obra barata", "Cheap labour"),
      loc("Economías de escala", "Economies of scale"),
      loc("Economías de alcance", "Economies of scope"),
      loc("Volumen acumulado", "Accumulated volume"),
      loc("Base de clientes", "Customer base"),
      loc("Externalidades de red", "Network externalities"),
      loc("Tecnología de proceso eficiente", "Efficient process technology"),
      loc("Gestión del tiempo", "Time management"),
      loc("Gestión de la productividad", "Productivity management"),
    ],
  },
  {
    id: "innovative",
    label: loc("Ventaja innovadora", "Innovative advantage"),
    definition: loc(
      "Capacidades que permiten ir por delante en el desarrollo de nuevos productos o servicios.",
      "Capabilities that keep the firm ahead in developing new products or services."
    ),
    items: [
      loc("Crear nuevos espacios de mercado", "Creating new market spaces"),
      loc("Encontrar soluciones nuevas", "Finding new solutions"),
      loc("Cambio radical en la gestión de la cadena de valor", "Radical change in value chain management"),
      loc("Crear nuevos diseños de negocio", "Creating new business designs"),
    ],
  },
  {
    id: "time_based",
    label: loc("Ventaja de tiempo", "Time-based advantage"),
    definition: loc(
      "Capacidades que hacen a la empresa más rápida en adaptarse y entregar valor.",
      "Capabilities that make the firm faster at adapting and delivering value."
    ),
    items: [
      loc("I+D más rápida", "Faster R&D"),
      loc("Logística más rápida", "Faster logistics"),
      loc("Tiempo de respuesta corto", "Short response time"),
    ],
  },
  {
    id: "blue_ocean",
    label: loc("Estrategia de océano azul", "Blue ocean strategy"),
    definition: loc(
      "Capacidad de crear un espacio de mercado nuevo con una curva de valor distinta.",
      "The ability to create a new market space with a different value curve."
    ),
    items: [
      loc("Eliminar elementos que no añaden valor", "Eliminate elements that add no value"),
      loc("Reducir elementos menos importantes", "Reduce less important elements"),
      loc("Aumentar elementos que necesitan énfasis", "Raise elements that need emphasis"),
      loc("Crear elementos nuevos", "Create new elements"),
    ],
  },
];

export const CAPABILITY_TYPES_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, Tabla 5.5, p. 194",
  "Lasserre and Monteiro, Table 5.5, p. 194"
);

export type SustainabilityTypeId = "customer_loyalty" | "network_externalities" | "accumulated_volume" | "pre_emption";
export type BuildingModeId = "first_mover" | "leverage";

export const SUSTAINABILITY_TYPES: { id: SustainabilityTypeId; label: Localized; definition: Localized }[] = [
  {
    id: "customer_loyalty",
    label: loc("Lealtad del cliente", "Customer loyalty"),
    definition: loc(
      "Marca fuerte o valor único para el cliente, o altos costes de cambio.",
      "A strong brand or unique customer value, or high switching costs."
    ),
  },
  {
    id: "network_externalities",
    label: loc("Externalidades de red", "Network externalities"),
    definition: loc(
      "Retroalimentación positiva por efectos de red o efecto experiencia.",
      "Positive feedback from network effects or the experience effect."
    ),
  },
  {
    id: "accumulated_volume",
    label: loc("Volumen acumulado", "Accumulated volume"),
    definition: loc(
      "Efecto experiencia derivado de operar a escala global.",
      "The experience effect that comes from operating at global scale."
    ),
  },
  {
    id: "pre_emption",
    label: loc("Pre-emption", "Pre-emption"),
    definition: loc(
      "Apropiación anticipada de recursos clave: ubicaciones, personal, distribución, patentes.",
      "Capturing key resources ahead of rivals: locations, people, distribution, patents."
    ),
  },
];

export const BUILDING_MODES: { id: BuildingModeId; label: Localized; definition: Localized }[] = [
  {
    id: "first_mover",
    label: loc("Primer entrante", "First mover"),
    definition: loc(
      "Estar entre los primeros competidores en entrar en un mercado dado.",
      "Being among the first competitors to enter a given market."
    ),
  },
  {
    id: "leverage",
    label: loc("Apalancamiento", "Leverage"),
    definition: loc(
      "Explotar capacidades ya construidas en otros países para desplazar a los competidores establecidos.",
      "Exploiting capabilities already built in other countries to displace established competitors."
    ),
  },
];

/** Tabla 5.7, «Building global sustainable advantage», p. 197. Celdas del original. */
export const SUSTAINABILITY_MATRIX: Record<BuildingModeId, Partial<Record<SustainabilityTypeId, Localized>>> = {
  first_mover: {
    customer_loyalty: loc(
      "Introducir un concepto o producto nuevo; crear marca nueva.",
      "Introduce a new concept or product; build a new brand."
    ),
    network_externalities: loc(
      "Crear el estándar en los países clave al principio del ciclo de vida del producto.",
      "Set the standard in key countries early in the product life cycle."
    ),
    accumulated_volume: loc("Construir volumen deprisa.", "Build volume fast."),
    pre_emption: loc(
      "Capturar ubicaciones, distribución, talento disponible, socios.",
      "Capture locations, distribution, available talent, partners."
    ),
  },
  leverage: {
    customer_loyalty: loc(
      "Usar la marca global; apalancar la I+D para innovar y diferenciar.",
      "Use the global brand; leverage R&D to innovate and differentiate."
    ),
    network_externalities: loc(
      "Usar la base de clientes global existente para expandirse.",
      "Use the existing global customer base to expand."
    ),
    accumulated_volume: loc(
      "Usar el efecto experiencia de las operaciones globales para ser líder en coste.",
      "Use the experience effect of global operations to lead on cost."
    ),
  },
};

/* ------------------------------------------------------------------------------------ */
/* Configuración de la cadena de valor — Fig. 5.12 (p. 193) y pp. 197-198                */
/* ------------------------------------------------------------------------------------ */

export type ValueChainFunctionId = "rnd" | "sourcing_production" | "marketing" | "customer_services" | "finances" | "hrm";
export type ValueChainLevel = "global" | "regional" | "local";

export const VALUE_CHAIN_LEVELS: { id: ValueChainLevel; label: Localized }[] = [
  { id: "global", label: loc("Global", "Global") },
  { id: "regional", label: loc("Regional", "Regional") },
  { id: "local", label: loc("Local", "Local") },
];

export function valueChainLevelLabel(id: ValueChainLevel): Localized {
  return VALUE_CHAIN_LEVELS.find((level) => level.id === id)?.label ?? loc(id, id);
}

/** Fig. 5.12: los ejemplos de cada celda se usan como pista en la interfaz. */
export const VALUE_CHAIN_FUNCTIONS: { id: ValueChainFunctionId; label: Localized; hints: Record<ValueChainLevel, Localized> }[] = [
  {
    id: "rnd",
    label: loc("Investigación y desarrollo", "Research and development"),
    hints: {
      global: loc(
        "I+D central, estrategia técnica, tecnología y productos núcleo, inteligencia tecnológica",
        "Central R&D, technical strategy, core technology and products, technology intelligence"
      ),
      regional: loc(
        "Desarrollo de productos regionales, inteligencia regional, seminarios regionales",
        "Regional product development, regional intelligence, regional seminars"
      ),
      local: loc("Laboratorios locales", "Local laboratories"),
    },
  },
  {
    id: "sourcing_production",
    label: loc("Aprovisionamiento y producción", "Sourcing and production"),
    hints: {
      global: loc(
        "Fábricas globales, flujo global de materiales, ingeniería de procesos, compras centrales",
        "Global plants, global material flow, process engineering, central purchasing"
      ),
      regional: loc("Fábricas regionales, aprovisionamiento regional", "Regional plants, regional sourcing"),
      local: loc("Producción local, aprovisionamiento local", "Local production, local sourcing"),
    },
  },
  {
    id: "marketing",
    label: loc("Marketing", "Marketing"),
    hints: {
      global: loc(
        "Estrategia global de marketing, comunicación global, posicionamiento global",
        "Global marketing strategy, global communication, global positioning"
      ),
      regional: loc(
        "Inteligencia regional, gestión regional de producto, cuentas regionales, licitación regional",
        "Regional intelligence, regional product management, regional accounts, regional bidding"
      ),
      local: loc("Distribución, promoción, ventas", "Distribution, promotion, sales"),
    },
  },
  {
    id: "customer_services",
    label: loc("Servicio al cliente", "Customer services"),
    hints: {
      global: loc("Políticas, procedimientos, sistema de información", "Policies, procedures, information system"),
      regional: loc(
        "Soporte regional al cliente, logística, mantenimiento",
        "Regional customer support, logistics, maintenance"
      ),
      local: loc("Servicio posventa", "After-sales service"),
    },
  },
  {
    id: "finances",
    label: loc("Finanzas", "Finances"),
    hints: {
      global: loc("Finanzas corporativas, tesorería global, control", "Corporate finance, global treasury, control"),
      regional: loc("Financiación de deuda regional, control regional", "Regional debt financing, regional control"),
      local: loc("Endeudamiento local", "Local borrowing"),
    },
  },
  {
    id: "hrm",
    label: loc("Recursos humanos", "Human resources"),
    hints: {
      global: loc("Gestión internacional de personas", "International people management"),
      regional: loc("Carreras y formación regionales", "Regional careers and training"),
      local: loc("Carreras y formación locales", "Local careers and training"),
    },
  },
];

export type ConfigurationId = "global" | "regional" | "multinational";

export const CONFIGURATIONS: { id: ConfigurationId; label: Localized; definition: Localized; provenance: Localized }[] = [
  {
    id: "global",
    label: loc("Configuración global", "Global configuration"),
    definition: loc(
      "El mundo se considera un solo mercado: productos estandarizados y organización centralizada.",
      "The world is treated as a single market: standardized products and a centralized organization."
    ),
    provenance: loc("p. 197", "p. 197"),
  },
  {
    id: "regional",
    label: loc("Configuración regional", "Regional configuration"),
    definition: loc(
      "El enfoque competitivo se diferencia por características regionales y la estructura se diseña alrededor de las regiones.",
      "The competitive approach is differentiated by regional characteristics and the structure is built around regions."
    ),
    provenance: loc("p. 198", "p. 198"),
  },
  {
    id: "multinational",
    label: loc("Configuración multinacional", "Multinational configuration"),
    definition: loc(
      "El mundo es un conjunto de países distintos y la estrategia competitiva se adapta a cada entorno.",
      "The world is a set of distinct countries and the competitive strategy is adapted to each environment."
    ),
    provenance: loc("p. 198", "p. 198"),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Transfer, Adapt, Create — Fig. 5.14 (p. 199)                                          */
/* ------------------------------------------------------------------------------------ */

export type TacTag = "transfer" | "adapt" | "create";
export type CapabilityKind = "resource" | "asset" | "competency";

export const TAC_TAGS: { id: TacTag; label: Localized; definition: Localized }[] = [
  { id: "transfer", label: loc("Transferir", "Transfer"), definition: loc("Se traslada al nuevo territorio sin cambios.", "It moves to the new territory unchanged.") },
  { id: "adapt", label: loc("Adaptar", "Adapt"), definition: loc("Se traslada con adaptación a las condiciones locales.", "It moves with adaptation to local conditions.") },
  { id: "create", label: loc("Crear", "Create"), definition: loc("Hay que construirlo desde cero en el país de entrada.", "It has to be built from scratch in the country of entry.") },
];

export const CAPABILITY_KINDS: { id: CapabilityKind; label: Localized; definition: Localized }[] = [
  {
    id: "resource",
    label: loc("Recurso", "Resource"),
    definition: loc(
      "Personas, finanzas, materias primas, información, contactos, infraestructura externa.",
      "People, finance, raw materials, information, contacts, external infrastructure."
    ),
  },
  {
    id: "asset",
    label: loc("Activo", "Asset"),
    definition: loc(
      "Instalaciones, equipos, logística, puntos de distribución, sistemas, marca, fondo de comercio.",
      "Facilities, equipment, logistics, distribution outlets, systems, brand, goodwill."
    ),
  },
  {
    id: "competency",
    label: loc("Competencia", "Competency"),
    definition: loc(
      "Saber hacer técnico, gestión de proyectos, del tiempo, de la información, de la calidad, del servicio.",
      "Technical know-how, project, time, information, quality and service management."
    ),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Curva de valor, ERRC y mapa de utilidad — módulo 10 del programa (Kim y Mauborgne)    */
/* ------------------------------------------------------------------------------------ */

export type ErrcAction = "eliminate" | "reduce" | "raise" | "create" | "keep";

export const ERRC_ACTIONS: { id: ErrcAction; label: Localized; definition: Localized }[] = [
  {
    id: "eliminate",
    label: loc("Eliminar", "Eliminate"),
    definition: loc(
      "Atributos que el sector da por supuestos y que pueden suprimirse.",
      "Attributes the industry takes for granted that can be dropped."
    ),
  },
  {
    id: "reduce",
    label: loc("Reducir", "Reduce"),
    definition: loc(
      "Atributos sobredimensionados respecto a lo que el cliente valora.",
      "Attributes over-delivered relative to what the customer values."
    ),
  },
  {
    id: "raise",
    label: loc("Aumentar", "Raise"),
    definition: loc(
      "Atributos que el sector ofrece por debajo de lo que el cliente necesita.",
      "Attributes the industry under-delivers relative to what the customer needs."
    ),
  },
  {
    id: "create",
    label: loc("Crear", "Create"),
    definition: loc(
      "Atributos nuevos que el sector no ofrece todavía.",
      "New attributes the industry does not yet offer."
    ),
  },
  {
    id: "keep",
    label: loc("Mantener", "Keep"),
    definition: loc(
      "Atributos que no cambian entre la curva actual y la propuesta.",
      "Attributes unchanged between the as-is and the to-be curve."
    ),
  },
];

export const BUYER_EXPERIENCE_STAGES = [
  { id: "purchase", label: loc("Compra", "Purchase") },
  { id: "delivery", label: loc("Entrega", "Delivery") },
  { id: "use", label: loc("Uso", "Use") },
  { id: "supplements", label: loc("Complementos", "Supplements") },
  { id: "maintenance", label: loc("Mantenimiento", "Maintenance") },
  { id: "disposal", label: loc("Eliminación", "Disposal") },
] as const;

export const BUYER_UTILITY_LEVERS = [
  { id: "productivity", label: loc("Productividad del cliente", "Customer productivity") },
  { id: "simplicity", label: loc("Simplicidad", "Simplicity") },
  { id: "convenience", label: loc("Comodidad", "Convenience") },
  { id: "risk", label: loc("Reducción de riesgo", "Risk reduction") },
  { id: "fun_image", label: loc("Diversión e imagen", "Fun and image") },
  { id: "environment", label: loc("Respeto ambiental", "Environmental friendliness") },
] as const;

export const BUYER_UTILITY_PROVENANCE: Localized = loc(
  "Módulo 10 del programa INSEAD CSO (Kim y Mauborgne); el libro lo cita como quinta tipología en la Tabla 5.5, p. 194",
  "Module 10 of the INSEAD CSO programme (Kim and Mauborgne); the book lists it as the fifth typology in Table 5.5, p. 194"
);

/* ------------------------------------------------------------------------------------ */
/* Entrada del módulo                                                                    */
/* ------------------------------------------------------------------------------------ */

export type ValueCurveAttribute = {
  id: string;
  /** Lo escribe quien analiza, en su idioma: aquí no hay par bilingüe que valga. */
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
