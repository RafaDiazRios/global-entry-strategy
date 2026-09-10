/**
 * Módulo 4 — Estrategia de entrada, primera parte.
 *
 * Capítulo 7 de Lasserre y Monteiro, pp. 257-278. Cubre el porqué, el cuándo y el cómo:
 * objetivos, ventana de oportunidad, ritmo y elección de modo. La opción real y los modelos
 * económicos por modo llegan con la segunda entrega, junto al capítulo 8.
 *
 * Los perfiles de la Tabla 7.4 ya viven en `entryModes.ts` desde la Fase 1: aquí no se
 * repiten, se usan.
 */

/* ------------------------------------------------------------------------------------ */
/* Por qué entrar — Tabla 7.1, pp. 260-261                                               */
/* ------------------------------------------------------------------------------------ */

export type EntryObjectiveId = "market" | "resources" | "learning" | "coordination";

export const ENTRY_OBJECTIVES: {
  id: EntryObjectiveId;
  label: string;
  expectations: string[];
  kpis: string[];
  timing: string;
  countryType: string;
  typicalModes: string[];
}[] = [
  {
    id: "market",
    label: "Desarrollo de mercado",
    expectations: ["Penetración y desarrollo de mercado", "Capturar cuota de mercado"],
    kpis: ["Crecimiento", "Cuota de mercado", "Margen bruto"],
    timing: "Ventana de oportunidad; primer entrante frente a seguidor",
    countryType: "Todos los países, priorizados según potencial de mercado, calidad y contexto competitivo",
    typicalModes: ["Según riesgos, oportunidades, momento y capacidades: cualquier modo puede aplicar"],
  },
  {
    id: "resources",
    label: "Acceso a recursos",
    expectations: ["Acceso a recursos naturales", "Acceso a mano de obra cualificada de bajo coste", "Acceso a proveedores"],
    kpis: ["Costes", "Calidad", "Seguridad de suministro"],
    timing: "Primer entrante, para apropiarse de los recursos antes que otros",
    countryType: "Países ricos en recursos",
    typicalModes: ["Filial propia si se permite y el riesgo es bajo", "Empresa conjunta si se exige", "Contratos de suministro a largo plazo"],
  },
  {
    id: "learning",
    label: "Aprendizaje",
    expectations: ["Entender la tecnología puntera", "Acercarse a las mejores prácticas", "Aprender a competir en mercados difíciles y sofisticados"],
    kpis: ["Saber hacer", "Mejora de procesos"],
    timing: "En cuanto el país se reconozca como centro de competencia",
    countryType: "Países con infraestructura tecnológica y de conocimiento fuerte",
    typicalModes: ["Empresa conjunta", "Centro de I+D", "Observatorio"],
  },
  {
    id: "coordination",
    label: "Coordinación",
    expectations: ["Base para el desarrollo global o regional", "Centros logísticos cerca de instituciones financieras"],
    kpis: ["Velocidad", "Control", "Sinergias"],
    timing: "Tres etapas: iniciación, crecimiento, coordinación",
    countryType: "Hubs",
    typicalModes: ["Oficina de representación", "Sede global o regional", "Centro logístico", "Centro de formación", "Centro financiero"],
  },
];

export const ENTRY_OBJECTIVES_PROVENANCE = "Lasserre y Monteiro, Tabla 7.1, pp. 260-261";

/* ------------------------------------------------------------------------------------ */
/* Cuándo entrar — fases de la ventana, pp. 261-262 y p. 277                             */
/* ------------------------------------------------------------------------------------ */

export type WindowPhaseId = "premature" | "window" | "competitive_growth" | "mature";

export const WINDOW_PHASES: {
  id: WindowPhaseId;
  label: string;
  signal: string;
  /** Modos que el libro considera apropiados en esa fase. Claves de `entryModes.ts`. */
  appropriateModes: string[];
  guidance: string;
}[] = [
  {
    id: "premature",
    label: "Prematura",
    signal: "No hay demanda suficiente: falta poder adquisitivo o el producto no encaja con el mercado.",
    appropriateModes: ["office", "distributor"],
    guidance: "Invertir en grande aquí no devuelve ingresos a largo plazo. Lo apropiado es oficina de representación, puesto de escucha o acuerdo de distribución.",
  },
  {
    id: "window",
    label: "Ventana de oportunidad",
    signal: "El mercado despega y el panorama competitivo aún no está asentado.",
    appropriateModes: ["greenfield", "alliance", "distributor", "licensing", "digital"],
    guidance: "Es el momento en que la elección entre primer entrante y seguidor tiene sentido. Cualquier modo puede aplicar según riesgo y capacidades.",
  },
  {
    id: "competitive_growth",
    label: "Crecimiento competitivo",
    signal: "Alto crecimiento, pero los competidores ya se han llevado las ventajas de primer entrante.",
    appropriateModes: ["acquisition", "alliance"],
    guidance: "Entrar ahora es arriesgado salvo con recursos masivos o una estrategia muy diferenciada. La vía practicable es adquisición o empresa conjunta.",
  },
  {
    id: "mature",
    label: "Madura",
    signal: "Competencia bien establecida.",
    appropriateModes: ["acquisition", "greenfield"],
    guidance: "Adquisición, o inversión directa con un producto innovador. Poco más funciona.",
  },
];

export const WINDOW_PHASES_PROVENANCE = "pp. 261-262 y resumen de p. 277";

/** Tabla 7.2, p. 262. */
export const FIRST_MOVER = {
  advantages: [
    "Monopolizar recursos: distribución, ubicación, personas, contactos, proveedores",
    "Establecer marca",
    "Establecer estándares",
    "Aprender sobre los clientes",
  ],
  disadvantages: [
    "Asumir el riesgo: inmadurez del mercado, encaje producto-mercado incierto, falta de infraestructura",
    "Trabajar ahora en beneficio de quien venga después",
  ],
  provenance: "Tabla 7.2, p. 262",
};

export type TimingStance = "first_mover" | "follower" | "acquirer";

export const TIMING_STANCES: { id: TimingStance; label: string; definition: string }[] = [
  { id: "first_mover", label: "Primer entrante", definition: "Entrar antes que la competencia y asumir el riesgo de abrir el mercado." },
  { id: "follower", label: "Seguidor", definition: "Entrar tras los primeros, con el mercado ya validado." },
  { id: "acquirer", label: "Adquirente", definition: "Entrar comprando una posición ya construida, cuando la ventana se ha cerrado." },
];

/* ------------------------------------------------------------------------------------ */
/* Ritmo de entrada — p. 262                                                             */
/* ------------------------------------------------------------------------------------ */

export type PaceFactorId =
  | "past_experience"
  | "cultural_distance"
  | "country_risk"
  | "available_resources"
  | "entry_dispersion"
  | "resources_at_stake";

/**
 * Los seis factores de la p. 262. `direction` dice hacia dónde empuja un valor alto:
 * «faster» hacia un compromiso rápido, «slower» hacia uno gradual.
 */
export const PACE_FACTORS: { id: PaceFactorId; label: string; question: string; direction: "faster" | "slower" }[] = [
  { id: "past_experience", label: "Experiencia previa en países similares", question: "¿Cuánta experiencia acumulada hay en mercados comparables?", direction: "faster" },
  { id: "cultural_distance", label: "Distancia cultural (CAGE)", question: "¿Cuánta distancia cultural hay respecto al país de origen?", direction: "slower" },
  { id: "country_risk", label: "Riesgo país", question: "¿Cuál es el riesgo político y operativo del país?", direction: "slower" },
  { id: "available_resources", label: "Recursos disponibles para comprometer", question: "¿Cuántos recursos puede comprometer la empresa aquí?", direction: "faster" },
  { id: "entry_dispersion", label: "Dispersión de entradas simultáneas", question: "¿En cuántos países se está entrando a la vez?", direction: "slower" },
  { id: "resources_at_stake", label: "Volumen de recursos en juego", question: "¿Cuánto se pone en riesgo con esta entrada?", direction: "slower" },
];

export const PACE_PROVENANCE = "p. 262; el aviso sobre entradas apresuradas viene del caso de Whirlpool en China, pp. 262-263";

/* ------------------------------------------------------------------------------------ */
/* Cómo entrar — Fig. 7.1 (p. 263) y Fig. 7.3 (p. 272)                                   */
/* ------------------------------------------------------------------------------------ */

/** Fig. 7.1: los modos ordenados por control y por intensidad de inversión. */
export const MODE_GRID: { control: "weak" | "strong"; intensity: "low" | "high"; modes: string[] }[] = [
  { control: "weak", intensity: "high", modes: ["Empresa conjunta minoritaria", "Consorcio", "Adquisición minoritaria"] },
  { control: "strong", intensity: "high", modes: ["Filial propia con inversión greenfield", "Adquisición dominante", "Empresa conjunta con mayoría absoluta"] },
  { control: "weak", intensity: "low", modes: ["Licencia", "Distribución", "Franquicia", "Agente"] },
  { control: "strong", intensity: "low", modes: ["Oficina de compras", "Oficina de representación", "Filial de marketing", "Observatorio técnico", "Sede regional"] },
];

export const MODE_GRID_PROVENANCE = "Fig. 7.1, p. 263";

export type Band = "low" | "medium" | "high";
export type ClimateBand = "poor" | "medium" | "good";

/** Fig. 7.3, p. 272: atractivo del mercado × clima político de inversión. */
export const MODE_MAPPING: { attractiveness: Band; climate: ClimateBand; modes: string[] }[] = [
  { attractiveness: "high", climate: "poor", modes: ["Exposición financiera mínima", "Minoría en empresa conjunta", "Licencia"] },
  { attractiveness: "high", climate: "medium", modes: ["Filial propia", "Adquisición mayoritaria o empresa conjunta"] },
  { attractiveness: "high", climate: "good", modes: ["Compromiso máximo", "Filial propia", "Adquisición total"] },
  { attractiveness: "medium", climate: "poor", modes: ["Presencia limitada", "Distribuidor o agente", "Licencia"] },
  { attractiveness: "medium", climate: "medium", modes: ["Empresa conjunta"] },
  { attractiveness: "medium", climate: "good", modes: ["Compromiso alto", "Filial propia o adquisición"] },
  { attractiveness: "low", climate: "poor", modes: ["Exportación ocasional"] },
  { attractiveness: "low", climate: "medium", modes: ["Agente de exportación", "Licencia"] },
  { attractiveness: "low", climate: "good", modes: ["Distribuidor independiente"] },
];

export const MODE_MAPPING_PROVENANCE = "Fig. 7.3, p. 272";

/** Fig. 7.2, p. 264: los seis factores que determinan la elección de modo. */
export const MODE_FACTORS = [
  "Atractivo global del mercado",
  "Riesgos políticos y operativos",
  "Requisitos del gobierno",
  "Presión de tiempo",
  "Capacidades internas",
  "Objetivos estratégicos y retorno esperado",
];

/** Tabla 7.5, p. 272: los tres modelos de entrada en el espacio digital. */
export const DIGITAL_ENTRY_MODELS: { id: string; label: string; features: string[] }[] = [
  { id: "relational", label: "Relacional tradicional", features: ["Distribuidores", "Socios locales", "Logística", "Personal local", "Inversiones productivas"] },
  { id: "digital", label: "Digital", features: ["Entrega puramente digital", "Envío directo o descarga", "Computación en la nube"] },
  { id: "hybrid", label: "Híbrido", features: ["Plataformas B2B y B2C", "Presencia física", "Plataformas de atención al cliente", "Personal local", "Alianzas", "Socios locales"] },
];

export const DIGITAL_ENTRY_PROVENANCE = "Tabla 7.5, p. 272, a partir de Watson, Weaven y Perkins (2017)";

/* ------------------------------------------------------------------------------------ */
/* Entrada del módulo                                                                    */
/* ------------------------------------------------------------------------------------ */

export type EntryStrategyInput = {
  countryCode: string | null;
  objectives: { id: EntryObjectiveId; selected: boolean; justification: string | null }[];
  phase: WindowPhaseId | null;
  phaseEvidence: string | null;
  timingStance: TimingStance | null;
  timingRationale: string | null;
  /** 0 a 4 por factor, como el resto de la herramienta. */
  paceFactors: Partial<Record<PaceFactorId, number | null>>;
  marketAttractiveness: Band | null;
  politicalClimate: ClimateBand | null;
  /** Modo preferido, con la clave del catálogo de `entryModes.ts`. */
  preferredMode: string | null;
  modeRationale: string | null;
  digitalModel: string | null;
  governmentRequirements: string | null;
};

export function emptyEntryStrategyInput(): EntryStrategyInput {
  return {
    countryCode: null,
    objectives: ENTRY_OBJECTIVES.map((objective) => ({ id: objective.id, selected: false, justification: null })),
    phase: null,
    phaseEvidence: null,
    timingStance: null,
    timingRationale: null,
    paceFactors: {},
    marketAttractiveness: null,
    politicalClimate: null,
    preferredMode: null,
    modeRationale: null,
    digitalModel: null,
    governmentRequirements: null,
  };
}
