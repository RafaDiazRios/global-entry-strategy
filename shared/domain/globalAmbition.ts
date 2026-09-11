/**
 * Módulo 1 — Ambición global.
 *
 * Capítulo 5 de Lasserre y Monteiro, *Global Strategic Management*, 5ª ed., pp. 181-188 y
 * el resumen de pp. 218-219. Cada tabla lleva su procedencia porque el criterio de la v2
 * es que ningún número de la herramienta carezca de origen citable.
 *
 * Bilingüe: el texto de cada fila vive junto a la fila, en un par `{ es, en }`. El inglés no
 * es una traducción del español sino el término del original, que está en inglés.
 */

import { loc, type Localized } from "../i18n";

/* ------------------------------------------------------------------------------------ */
/* Regiones                                                                              */
/* ------------------------------------------------------------------------------------ */

/**
 * El libro no usa una única partición del mundo: la Tabla 5.2 (p. 183) trabaja con cuatro
 * regiones y el learning assignment 1 (p. 220) con tres. El conjunto de regiones es por
 * tanto una elección del análisis, no una constante.
 */
export type RegionSetId = "four_regions" | "three_regions";

export type RegionDefinition = { id: string; label: Localized };

export type RegionSet = {
  id: RegionSetId;
  label: Localized;
  provenance: Localized;
  regions: RegionDefinition[];
};

export const REGION_SETS: RegionSet[] = [
  {
    id: "four_regions",
    label: loc("Cuatro regiones", "Four regions"),
    provenance: loc("Tabla 5.2, p. 183", "Table 5.2, p. 183"),
    regions: [
      { id: "asia_pacific", label: loc("Asia Pacífico", "Asia Pacific") },
      { id: "europe", label: loc("Europa", "Europe") },
      { id: "americas", label: loc("Américas", "Americas") },
      { id: "mea", label: loc("Oriente Medio y África", "Middle East and Africa") },
    ],
  },
  {
    id: "three_regions",
    label: loc("Tres regiones", "Three regions"),
    provenance: loc("Learning assignment 1, p. 220", "Learning assignment 1, p. 220"),
    regions: [
      { id: "americas", label: loc("Américas", "Americas") },
      { id: "europe", label: loc("Europa", "Europe") },
      { id: "asia_row", label: loc("Asia y resto del mundo", "Asia and rest of the world") },
    ],
  },
];

export function regionSet(id: RegionSetId): RegionSet {
  const found = REGION_SETS.find((set) => set.id === id);
  if (!found) throw new Error(`Conjunto de regiones desconocido: ${id}`);
  return found;
}

/* ------------------------------------------------------------------------------------ */
/* Tabla 5.2 — distribución del mercado mundial por regiones                             */
/* ------------------------------------------------------------------------------------ */

export type IndustryDemandRow = {
  id: string;
  label: Localized;
  /** Porcentaje del valor mundial en dólares, 2019. Claves del conjunto `four_regions`. */
  shares: Record<string, number>;
};

/**
 * Tabla 5.2, p. 183: «Distribution of the world market by regions in selected industries,
 * 2019 (as a percentage of US$ value)». Los porcentajes son los del libro y algunas filas
 * no suman exactamente 100 por redondeo; se dejan tal cual y se normalizan al calcular.
 * Los nombres en inglés son los del original.
 */
export const INDUSTRY_DEMAND_TABLE: IndustryDemandRow[] = [
  { id: "advertising", label: loc("Publicidad", "Advertising"), shares: { asia_pacific: 35, europe: 20, americas: 38, mea: 7 } },
  { id: "apparel_footwear", label: loc("Confección y calzado", "Apparel and footwear"), shares: { asia_pacific: 39, europe: 26, americas: 29, mea: 7 } },
  { id: "appliances", label: loc("Electrodomésticos", "Appliances"), shares: { asia_pacific: 48, europe: 19, americas: 28, mea: 5 } },
  { id: "automotive_components", label: loc("Componentes de automoción", "Automotive components"), shares: { asia_pacific: 35, europe: 25, americas: 36, mea: 4 } },
  { id: "chemicals", label: loc("Química", "Chemicals"), shares: { asia_pacific: 60, europe: 18, americas: 14, mea: 8 } },
  { id: "construction", label: loc("Construcción", "Construction"), shares: { asia_pacific: 53, europe: 21, americas: 24, mea: 2 } },
  { id: "consumer_electronics", label: loc("Electrónica de consumo", "Consumer electronics"), shares: { asia_pacific: 47, europe: 19, americas: 26, mea: 7 } },
  { id: "defense", label: loc("Defensa", "Defense"), shares: { asia_pacific: 31, europe: 22, americas: 39, mea: 8 } },
  { id: "it_services", label: loc("Servicios TI", "IT services"), shares: { asia_pacific: 24, europe: 31, americas: 44, mea: 1 } },
  { id: "life_insurance", label: loc("Seguros de vida", "Life insurance"), shares: { asia_pacific: 42, europe: 31, americas: 25, mea: 2 } },
  { id: "medical_equipment", label: loc("Equipamiento médico", "Medical equipment"), shares: { asia_pacific: 37, europe: 30, americas: 26, mea: 7 } },
  { id: "personal_care", label: loc("Cuidado personal", "Personal care"), shares: { asia_pacific: 36, europe: 25, americas: 33, mea: 6 } },
  { id: "retailing", label: loc("Distribución minorista", "Retailing"), shares: { asia_pacific: 38, europe: 25, americas: 30, mea: 7 } },
  { id: "telecom_services", label: loc("Servicios de telecomunicaciones", "Telecom services"), shares: { asia_pacific: 40, europe: 22, americas: 26, mea: 12 } },
  { id: "tyres", label: loc("Neumáticos", "Tyres"), shares: { asia_pacific: 42, europe: 26, americas: 28, mea: 4 } },
  { id: "gdp_2019", label: loc("PIB mundial (2019), como referencia", "World GDP (2019), for reference"), shares: { asia_pacific: 35, europe: 26, americas: 33, mea: 6 } },
];

export const INDUSTRY_DEMAND_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, Tabla 5.2, p. 183 (datos de 2019)",
  "Lasserre and Monteiro, Table 5.2, p. 183 (2019 data)"
);

/* ------------------------------------------------------------------------------------ */
/* Motivos de globalización — Fig. 5.3 y p. 181 (Dunning)                                */
/* ------------------------------------------------------------------------------------ */

export type MotiveId = "market_seeking" | "resource_seeking" | "capability_seeking";

export const GLOBALIZATION_MOTIVES: { id: MotiveId; label: Localized; description: Localized; provenance: Localized }[] = [
  {
    id: "market_seeking",
    label: loc("Búsqueda de mercado", "Market seeking"),
    description: loc(
      "Expansión de ventas en territorios internacionales, por exportación o por filiales operativas locales.",
      "Expanding sales into international territories, through exports or through local operating subsidiaries."
    ),
    provenance: loc("p. 181", "p. 181"),
  },
  {
    id: "resource_seeking",
    label: loc("Búsqueda de recursos", "Resource seeking"),
    description: loc(
      "Acceso a recursos naturales y humanos para sostener la competitividad global: sourcing contractual, explotación directa o centros de producción deslocalizados.",
      "Access to natural and human resources that sustain global competitiveness: contractual sourcing, direct exploitation or offshore production centres."
    ),
    provenance: loc("p. 181", "p. 181"),
  },
  {
    id: "capability_seeking",
    label: loc("Búsqueda de capacidades", "Capability seeking"),
    description: loc(
      "Captura de capacidades innovadoras o logísticas: centros de I+D locales, hubs, alianzas de investigación u oficinas de inteligencia.",
      "Capturing innovative or logistical capabilities: local R&D centres, hubs, research alliances or intelligence offices."
    ),
    provenance: loc("p. 181", "p. 181"),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Roles globales — pp. 181-182 y Fig. 5.5, p. 185                                       */
/* ------------------------------------------------------------------------------------ */

export type GlobalRoleId =
  | "global_player"
  | "regional_player"
  | "global_exporter"
  | "global_sourcer"
  | "regional_dominant_global_player";

export const GLOBAL_ROLES: { id: GlobalRoleId; label: Localized; description: Localized; provenance: Localized }[] = [
  {
    id: "global_player",
    label: loc("Jugador global", "Global player"),
    description: loc(
      "Aspira a una posición competitiva sostenible en los mercados clave del mundo y a un sistema de negocio integrado repartido entre ellos.",
      "Aims at a sustainable competitive position in the world's key markets and at an integrated business system spread across them."
    ),
    provenance: loc("p. 182", "p. 182"),
  },
  {
    id: "regional_player",
    label: loc("Jugador regional", "Regional player"),
    description: loc(
      "Busca una ventaja competitiva fuerte en una de las regiones clave del mundo y sigue siendo marginal o débil en las demás.",
      "Seeks a strong competitive advantage in one of the world's key regions and remains marginal or weak in the others."
    ),
    provenance: loc("p. 182", "p. 182"),
  },
  {
    id: "global_exporter",
    label: loc("Exportador global", "Global exporter"),
    description: loc(
      "Vende en los mercados clave del mundo productos fabricados u operados en su país de origen, y solo monta operaciones exteriores de apoyo a la exportación.",
      "Sells in the world's key markets products made or operated in its home country, and sets up foreign operations only to support exports."
    ),
    provenance: loc("p. 182", "p. 182"),
  },
  {
    id: "global_sourcer",
    label: loc("Aprovisionador global", "Global sourcer"),
    description: loc(
      "Compra fuera de su mercado base una fracción grande de sus componentes y concentra las ventas en su mercado doméstico.",
      "Buys a large share of its components outside its home market and concentrates sales in its domestic market."
    ),
    provenance: loc("p. 182", "p. 182"),
  },
  {
    id: "regional_dominant_global_player",
    label: loc("Jugador global de dominante regional", "Regional dominant global player"),
    description: loc(
      "Zona intermedia del mapa: presencia global real pero con el centro de gravedad todavía en una región.",
      "The middle zone of the map: genuine global presence but with the centre of gravity still in one region."
    ),
    provenance: loc("Fig. 5.5, p. 185", "Fig. 5.5, p. 185"),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Roles de país — pp. 187-188                                                           */
/* ------------------------------------------------------------------------------------ */

export type CountryRoleId = "key" | "emerging" | "platform" | "marketing" | "sourcing";

export const COUNTRY_ROLES: { id: CountryRoleId; label: Localized; criterion: Localized; provenance: Localized }[] = [
  {
    id: "key",
    label: loc("País clave", "Key country"),
    criterion: loc(
      "Crítico para la competitividad a largo plazo por tamaño, crecimiento o calidad de sus recursos. No estar presente es un handicap serio para quien quiera ser jugador global.",
      "Critical for long-term competitiveness through its size, growth or the quality of its resources. Not being present there is a serious handicap for anyone aiming to be a global player."
    ),
    provenance: loc("pp. 187-188", "pp. 187-188"),
  },
  {
    id: "emerging",
    label: loc("País emergente", "Emerging country"),
    criterion: loc(
      "Alta tasa de crecimiento que lo hace estratégicamente atractivo a corto plazo.",
      "A high growth rate that makes it strategically attractive in the short term."
    ),
    provenance: loc("p. 188", "p. 188"),
  },
  {
    id: "platform",
    label: loc("País plataforma", "Platform country"),
    criterion: loc(
      "Por ventaja de localización e infraestructura logística, financiera, regulatoria y legal, sirve de hub para centros regionales.",
      "Through locational advantage and logistical, financial, regulatory and legal infrastructure, it serves as a hub for regional centres."
    ),
    provenance: loc("p. 188", "p. 188"),
  },
  {
    id: "marketing",
    label: loc("País de mercado", "Marketing country"),
    criterion: loc(
      "Mercado atractivo sin ser estratégicamente crítico. Interesante desde el punto de vista comercial, no industrial ni de inversión.",
      "An attractive market without being strategically critical. Interesting commercially, not industrially or as an investment."
    ),
    provenance: loc("p. 188", "p. 188"),
  },
  {
    id: "sourcing",
    label: loc("País de aprovisionamiento", "Sourcing country"),
    criterion: loc(
      "Base de recursos fuerte y perspectivas de mercado limitadas.",
      "A strong resource base and limited market prospects."
    ),
    provenance: loc("p. 188", "p. 188"),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Etapas de globalización — Fig. 5.11 (p. 192) y Tabla 5.8 (pp. 200-202)                */
/* ------------------------------------------------------------------------------------ */

export type GlobalizationStageId = "export" | "multinational" | "global";

export const GLOBALIZATION_STAGES: { id: GlobalizationStageId; label: Localized; description: Localized; provenance: Localized }[] = [
  {
    id: "export",
    label: loc("Exportación", "Export"),
    description: loc(
      "El único elemento de la cadena de valor implantado fuera es la venta, y no por inversión directa sino por distribuidores, agentes o licencias.",
      "The only element of the value chain located abroad is selling, and not through direct investment but through distributors, agents or licences."
    ),
    provenance: loc("p. 192 y p. 219", "p. 192 and p. 219"),
  },
  {
    id: "multinational",
    label: loc("Multinacional", "Multinational"),
    description: loc(
      "Cartera de filiales mundiales relativamente independientes, propias o en empresa conjunta.",
      "A portfolio of relatively independent worldwide subsidiaries, wholly owned or joint ventures."
    ),
    provenance: loc("p. 192 y p. 219", "p. 192 and p. 219"),
  },
  {
    id: "global",
    label: loc("Global", "Global"),
    description: loc(
      "Operaciones mundiales integradas y coordinadas para aprovechar escala, transferencia de conocimiento y optimización de recursos, con actividades globales, regionales y locales entrelazadas.",
      "Worldwide operations integrated and coordinated to capture scale, knowledge transfer and resource optimization, with global, regional and local activities interwoven."
    ),
    provenance: loc("p. 193 y p. 219", "p. 193 and p. 219"),
  },
];

export type OrganizationalPhaseId =
  | "early_export"
  | "large_export_early_multinational"
  | "full_multinational"
  | "global"
  | "global_multi_business";

/** Tabla 5.8, «Organizational designs for global strategies», pp. 200-202. Resumido. */
export const ORGANIZATIONAL_DESIGNS: {
  id: OrganizationalPhaseId;
  label: Localized;
  structure: Localized;
  process: Localized;
  culture: Localized;
}[] = [
  {
    id: "early_export",
    label: loc("Exportación inicial", "Early export"),
    structure: loc(
      "Departamento de exportación dentro de marketing y ventas; toda la actividad en casa; distribuidores y agentes en el exterior; posibles oficinas de representación.",
      "Export department inside marketing and sales; all activity at home; distributors and agents abroad; possibly representative offices."
    ),
    process: loc(
      "Procesos domésticos más base de datos internacional, financiación internacional e instrumentos de comercio exterior.",
      "Domestic processes plus an international database, international financing and foreign-trade instruments."
    ),
    culture: loc(
      "Domina la cultura corporativa doméstica; fase pionera; los responsables de exportación actúan como misioneros.",
      "The domestic corporate culture dominates; a pioneering phase; export managers act as missionaries."
    ),
  },
  {
    id: "large_export_early_multinational",
    label: loc("Exportación amplia y primeras filiales", "Large export and early multinational"),
    structure: loc(
      "División internacional separada de la actividad doméstica; las filiales reportan a esa división país por país.",
      "An international division separate from domestic activity; subsidiaries report to that division country by country."
    ),
    process: loc(
      "Planificación y control específicos para las operaciones internacionales; carreras internacionales separadas de las domésticas.",
      "Planning and control specific to international operations; international careers kept separate from domestic ones."
    ),
    culture: loc(
      "Cultura etnocéntrica; dominio de expatriados; alto grado de autonomía operativa en las filiales.",
      "Ethnocentric culture; expatriates dominate; a high degree of operating autonomy in the subsidiaries."
    ),
  },
  {
    id: "full_multinational",
    label: loc("Multinacional plena", "Full multinational"),
    structure: loc(
      "Estructura geográfica: el mundo se organiza por regiones; la empresa es una confederación de unidades nacionales.",
      "Geographic structure: the world is organized by regions; the firm is a confederation of national units."
    ),
    process: loc(
      "Localización: procesos ajustados a los requisitos nacionales y pocas políticas centrales.",
      "Localization: processes fitted to national requirements and few central policies."
    ),
    culture: loc(
      "Pluricéntrica: cada entidad nacional refleja su cultura; prevalece la diversidad internacional.",
      "Polycentric: each national entity mirrors its own culture; international diversity prevails."
    ),
  },
  {
    id: "global",
    label: loc("Global", "Global"),
    structure: loc(
      "Enfoques integrados: estructura global funcional, matriz única o red transnacional.",
      "Integrated approaches: global functional structure, single matrix or transnational network."
    ),
    process: loc(
      "Estandarización global, procesos y procedimientos comunes, coordinación central y sinergias sistematizadas.",
      "Global standardization, common processes and procedures, central coordination and systematized synergies."
    ),
    culture: loc(
      "Mentalidad global: valores corporativos fuertes por encima de cualquier cultura nacional.",
      "Global mindset: strong corporate values above any national culture."
    ),
  },
  {
    id: "global_multi_business",
    label: loc("Global multinegocio", "Global multi-business"),
    structure: loc(
      "Estructura geográfica multinegocio, estructura global de negocio o matriz de negocio, según el contexto competitivo de cada industria.",
      "Multi-business geographic structure, global business structure or business matrix, depending on each industry's competitive context."
    ),
    process: loc(
      "Responsabilidades de resultado repartidas entre responsables de negocio globales y responsables nacionales.",
      "Bottom-line responsibilities split between global business managers and country managers."
    ),
    culture: loc(
      "Requiere cultura negociadora y mecanismos explícitos de resolución de conflictos.",
      "Requires a negotiating culture and explicit conflict-resolution mechanisms."
    ),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Entrada del módulo                                                                    */
/* ------------------------------------------------------------------------------------ */

export type RegionalFigures = Record<string, number | null>;

export type AmbitionInput = {
  regionSetId: RegionSetId;
  motives: { id: MotiveId; selected: boolean; justification: string | null }[];
  currentRole: GlobalRoleId | null;
  targetRole: GlobalRoleId | null;
  targetHorizonYears: number | null;
  /** Referencia de demanda de la industria. `industryId` apunta a la Tabla 5.2 cuando se usa. */
  industryId: string | null;
  industryDemand: RegionalFigures;
  /** Ventas de la empresa por región, en la unidad que sea: se normaliza a porcentaje. */
  companyRevenue: RegionalFigures;
  /** Activos o empleo por región. El libro admite ambos (p. 185). */
  companyCapability: RegionalFigures;
  capabilityBasis: "assets" | "personnel";
  stage: GlobalizationStageId | null;
  organizationalPhase: OrganizationalPhaseId | null;
  countryRoles: { countryCode: string; role: CountryRoleId | null; justification: string | null }[];
  liabilityOfForeignness: string | null;
};

export function emptyAmbitionInput(regionSetId: RegionSetId = "four_regions"): AmbitionInput {
  const blank: RegionalFigures = {};
  for (const region of regionSet(regionSetId).regions) blank[region.id] = null;
  return {
    regionSetId,
    motives: GLOBALIZATION_MOTIVES.map((motive) => ({ id: motive.id, selected: false, justification: null })),
    currentRole: null,
    targetRole: null,
    targetHorizonYears: null,
    industryId: null,
    industryDemand: { ...blank },
    companyRevenue: { ...blank },
    companyCapability: { ...blank },
    capabilityBasis: "assets",
    stage: null,
    organizationalPhase: null,
    countryRoles: [],
    liabilityOfForeignness: null,
  };
}

/** Traslada una fila de la Tabla 5.2 al conjunto de regiones activo. */
export function industryDemandFor(industryId: string, targetSet: RegionSetId): RegionalFigures | null {
  const row = INDUSTRY_DEMAND_TABLE.find((entry) => entry.id === industryId);
  if (!row) return null;
  if (targetSet === "four_regions") return { ...row.shares };
  // Las tres regiones del assignment agregan Asia Pacífico con Oriente Medio y África.
  return {
    americas: row.shares.americas,
    europe: row.shares.europe,
    asia_row: row.shares.asia_pacific + row.shares.mea,
  };
}
