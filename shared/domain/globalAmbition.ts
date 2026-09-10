/**
 * Módulo 1 — Ambición global.
 *
 * Capítulo 5 de Lasserre y Monteiro, *Global Strategic Management*, 5ª ed., pp. 181-188 y
 * el resumen de pp. 218-219. Cada tabla lleva su procedencia porque el criterio de la v2
 * es que ningún número de la herramienta carezca de origen citable.
 */

/* ------------------------------------------------------------------------------------ */
/* Regiones                                                                              */
/* ------------------------------------------------------------------------------------ */

/**
 * El libro no usa una única partición del mundo: la Tabla 5.2 (p. 183) trabaja con cuatro
 * regiones y el learning assignment 1 (p. 220) con tres. El conjunto de regiones es por
 * tanto una elección del análisis, no una constante.
 */
export type RegionSetId = "four_regions" | "three_regions";

export type RegionDefinition = { id: string; label: string };

export type RegionSet = {
  id: RegionSetId;
  label: string;
  provenance: string;
  regions: RegionDefinition[];
};

export const REGION_SETS: RegionSet[] = [
  {
    id: "four_regions",
    label: "Cuatro regiones",
    provenance: "Tabla 5.2, p. 183",
    regions: [
      { id: "asia_pacific", label: "Asia Pacífico" },
      { id: "europe", label: "Europa" },
      { id: "americas", label: "Américas" },
      { id: "mea", label: "Oriente Medio y África" },
    ],
  },
  {
    id: "three_regions",
    label: "Tres regiones",
    provenance: "Learning assignment 1, p. 220",
    regions: [
      { id: "americas", label: "Américas" },
      { id: "europe", label: "Europa" },
      { id: "asia_row", label: "Asia y resto del mundo" },
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
  label: string;
  /** Porcentaje del valor mundial en dólares, 2019. Claves del conjunto `four_regions`. */
  shares: Record<string, number>;
};

/**
 * Tabla 5.2, p. 183: «Distribution of the world market by regions in selected industries,
 * 2019 (as a percentage of US$ value)». Los porcentajes son los del libro y algunas filas
 * no suman exactamente 100 por redondeo; se dejan tal cual y se normalizan al calcular.
 */
export const INDUSTRY_DEMAND_TABLE: IndustryDemandRow[] = [
  { id: "advertising", label: "Publicidad", shares: { asia_pacific: 35, europe: 20, americas: 38, mea: 7 } },
  { id: "apparel_footwear", label: "Confección y calzado", shares: { asia_pacific: 39, europe: 26, americas: 29, mea: 7 } },
  { id: "appliances", label: "Electrodomésticos", shares: { asia_pacific: 48, europe: 19, americas: 28, mea: 5 } },
  { id: "automotive_components", label: "Componentes de automoción", shares: { asia_pacific: 35, europe: 25, americas: 36, mea: 4 } },
  { id: "chemicals", label: "Química", shares: { asia_pacific: 60, europe: 18, americas: 14, mea: 8 } },
  { id: "construction", label: "Construcción", shares: { asia_pacific: 53, europe: 21, americas: 24, mea: 2 } },
  { id: "consumer_electronics", label: "Electrónica de consumo", shares: { asia_pacific: 47, europe: 19, americas: 26, mea: 7 } },
  { id: "defense", label: "Defensa", shares: { asia_pacific: 31, europe: 22, americas: 39, mea: 8 } },
  { id: "it_services", label: "Servicios TI", shares: { asia_pacific: 24, europe: 31, americas: 44, mea: 1 } },
  { id: "life_insurance", label: "Seguros de vida", shares: { asia_pacific: 42, europe: 31, americas: 25, mea: 2 } },
  { id: "medical_equipment", label: "Equipamiento médico", shares: { asia_pacific: 37, europe: 30, americas: 26, mea: 7 } },
  { id: "personal_care", label: "Cuidado personal", shares: { asia_pacific: 36, europe: 25, americas: 33, mea: 6 } },
  { id: "retailing", label: "Distribución minorista", shares: { asia_pacific: 38, europe: 25, americas: 30, mea: 7 } },
  { id: "telecom_services", label: "Servicios de telecomunicaciones", shares: { asia_pacific: 40, europe: 22, americas: 26, mea: 12 } },
  { id: "tyres", label: "Neumáticos", shares: { asia_pacific: 42, europe: 26, americas: 28, mea: 4 } },
  { id: "gdp_2019", label: "PIB mundial (2019), como referencia", shares: { asia_pacific: 35, europe: 26, americas: 33, mea: 6 } },
];

export const INDUSTRY_DEMAND_PROVENANCE = "Lasserre y Monteiro, Tabla 5.2, p. 183 (datos de 2019)";

/* ------------------------------------------------------------------------------------ */
/* Motivos de globalización — Fig. 5.3 y p. 181 (Dunning)                                */
/* ------------------------------------------------------------------------------------ */

export type MotiveId = "market_seeking" | "resource_seeking" | "capability_seeking";

export const GLOBALIZATION_MOTIVES: { id: MotiveId; label: string; description: string; provenance: string }[] = [
  {
    id: "market_seeking",
    label: "Búsqueda de mercado",
    description: "Expansión de ventas en territorios internacionales, por exportación o por filiales operativas locales.",
    provenance: "p. 181",
  },
  {
    id: "resource_seeking",
    label: "Búsqueda de recursos",
    description: "Acceso a recursos naturales y humanos para sostener la competitividad global: sourcing contractual, explotación directa o centros de producción deslocalizados.",
    provenance: "p. 181",
  },
  {
    id: "capability_seeking",
    label: "Búsqueda de capacidades",
    description: "Captura de capacidades innovadoras o logísticas: centros de I+D locales, hubs, alianzas de investigación u oficinas de inteligencia.",
    provenance: "p. 181",
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

export const GLOBAL_ROLES: { id: GlobalRoleId; label: string; description: string; provenance: string }[] = [
  {
    id: "global_player",
    label: "Jugador global",
    description: "Aspira a una posición competitiva sostenible en los mercados clave del mundo y a un sistema de negocio integrado repartido entre ellos.",
    provenance: "p. 182",
  },
  {
    id: "regional_player",
    label: "Jugador regional",
    description: "Busca una ventaja competitiva fuerte en una de las regiones clave del mundo y sigue siendo marginal o débil en las demás.",
    provenance: "p. 182",
  },
  {
    id: "global_exporter",
    label: "Exportador global",
    description: "Vende en los mercados clave del mundo productos fabricados u operados en su país de origen, y solo monta operaciones exteriores de apoyo a la exportación.",
    provenance: "p. 182",
  },
  {
    id: "global_sourcer",
    label: "Aprovisionador global",
    description: "Compra fuera de su mercado base una fracción grande de sus componentes y concentra las ventas en su mercado doméstico.",
    provenance: "p. 182",
  },
  {
    id: "regional_dominant_global_player",
    label: "Jugador global de dominante regional",
    description: "Zona intermedia del mapa: presencia global real pero con el centro de gravedad todavía en una región.",
    provenance: "Fig. 5.5, p. 185",
  },
];

/* ------------------------------------------------------------------------------------ */
/* Roles de país — pp. 187-188                                                           */
/* ------------------------------------------------------------------------------------ */

export type CountryRoleId = "key" | "emerging" | "platform" | "marketing" | "sourcing";

export const COUNTRY_ROLES: { id: CountryRoleId; label: string; criterion: string; provenance: string }[] = [
  {
    id: "key",
    label: "País clave",
    criterion: "Crítico para la competitividad a largo plazo por tamaño, crecimiento o calidad de sus recursos. No estar presente es un handicap serio para quien quiera ser jugador global.",
    provenance: "pp. 187-188",
  },
  {
    id: "emerging",
    label: "País emergente",
    criterion: "Alta tasa de crecimiento que lo hace estratégicamente atractivo a corto plazo.",
    provenance: "p. 188",
  },
  {
    id: "platform",
    label: "País plataforma",
    criterion: "Por ventaja de localización e infraestructura logística, financiera, regulatoria y legal, sirve de hub para centros regionales.",
    provenance: "p. 188",
  },
  {
    id: "marketing",
    label: "País de mercado",
    criterion: "Mercado atractivo sin ser estratégicamente crítico. Interesante desde el punto de vista comercial, no industrial ni de inversión.",
    provenance: "p. 188",
  },
  {
    id: "sourcing",
    label: "País de aprovisionamiento",
    criterion: "Base de recursos fuerte y perspectivas de mercado limitadas.",
    provenance: "p. 188",
  },
];

/* ------------------------------------------------------------------------------------ */
/* Etapas de globalización — Fig. 5.11 (p. 192) y Tabla 5.8 (pp. 200-202)                */
/* ------------------------------------------------------------------------------------ */

export type GlobalizationStageId = "export" | "multinational" | "global";

export const GLOBALIZATION_STAGES: { id: GlobalizationStageId; label: string; description: string; provenance: string }[] = [
  {
    id: "export",
    label: "Exportación",
    description: "El único elemento de la cadena de valor implantado fuera es la venta, y no por inversión directa sino por distribuidores, agentes o licencias.",
    provenance: "p. 192 y p. 219",
  },
  {
    id: "multinational",
    label: "Multinacional",
    description: "Cartera de filiales mundiales relativamente independientes, propias o en empresa conjunta.",
    provenance: "p. 192 y p. 219",
  },
  {
    id: "global",
    label: "Global",
    description: "Operaciones mundiales integradas y coordinadas para aprovechar escala, transferencia de conocimiento y optimización de recursos, con actividades globales, regionales y locales entrelazadas.",
    provenance: "p. 193 y p. 219",
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
  label: string;
  structure: string;
  process: string;
  culture: string;
}[] = [
  {
    id: "early_export",
    label: "Exportación inicial",
    structure: "Departamento de exportación dentro de marketing y ventas; toda la actividad en casa; distribuidores y agentes en el exterior; posibles oficinas de representación.",
    process: "Procesos domésticos más base de datos internacional, financiación internacional e instrumentos de comercio exterior.",
    culture: "Domina la cultura corporativa doméstica; fase pionera; los responsables de exportación actúan como misioneros.",
  },
  {
    id: "large_export_early_multinational",
    label: "Exportación amplia y primeras filiales",
    structure: "División internacional separada de la actividad doméstica; las filiales reportan a esa división país por país.",
    process: "Planificación y control específicos para las operaciones internacionales; carreras internacionales separadas de las domésticas.",
    culture: "Cultura etnocéntrica; dominio de expatriados; alto grado de autonomía operativa en las filiales.",
  },
  {
    id: "full_multinational",
    label: "Multinacional plena",
    structure: "Estructura geográfica: el mundo se organiza por regiones; la empresa es una confederación de unidades nacionales.",
    process: "Localización: procesos ajustados a los requisitos nacionales y pocas políticas centrales.",
    culture: "Pluricéntrica: cada entidad nacional refleja su cultura; prevalece la diversidad internacional.",
  },
  {
    id: "global",
    label: "Global",
    structure: "Enfoques integrados: estructura global funcional, matriz única o red transnacional.",
    process: "Estandarización global, procesos y procedimientos comunes, coordinación central y sinergias sistematizadas.",
    culture: "Mentalidad global: valores corporativos fuertes por encima de cualquier cultura nacional.",
  },
  {
    id: "global_multi_business",
    label: "Global multinegocio",
    structure: "Estructura geográfica multinegocio, estructura global de negocio o matriz de negocio, según el contexto competitivo de cada industria.",
    process: "Responsabilidades de resultado repartidas entre responsables de negocio globales y responsables nacionales.",
    culture: "Requiere cultura negociadora y mecanismos explícitos de resolución de conflictos.",
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
