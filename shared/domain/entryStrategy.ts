/**
 * Módulo 4 — Estrategia de entrada, primera parte.
 *
 * Capítulo 7 de Lasserre y Monteiro, pp. 257-278. Cubre el porqué, el cuándo y el cómo:
 * objetivos, ventana de oportunidad, ritmo y elección de modo. La opción real y los modelos
 * económicos por modo llegan con la segunda entrega, junto al capítulo 8.
 *
 * Los perfiles de la Tabla 7.4 ya viven en `entryModes.ts` desde la Fase 1: aquí no se
 * repiten, se usan.
 *
 * Bilingüe: cada celda de las tablas lleva su par `{ es, en }`. En inglés se devuelve el
 * término del original, que es el idioma en que está escrito el libro.
 */

import { loc, type Localized } from "../i18n";

/* ------------------------------------------------------------------------------------ */
/* Por qué entrar — Tabla 7.1, pp. 260-261                                               */
/* ------------------------------------------------------------------------------------ */

export type EntryObjectiveId = "market" | "resources" | "learning" | "coordination";

export const ENTRY_OBJECTIVES: {
  id: EntryObjectiveId;
  label: Localized;
  expectations: Localized[];
  kpis: Localized[];
  timing: Localized;
  countryType: Localized;
  typicalModes: Localized[];
}[] = [
  {
    id: "market",
    label: loc("Desarrollo de mercado", "Market development"),
    expectations: [
      loc("Penetración y desarrollo de mercado", "Market penetration and development"),
      loc("Capturar cuota de mercado", "Capturing market share"),
    ],
    kpis: [loc("Crecimiento", "Growth"), loc("Cuota de mercado", "Market share"), loc("Margen bruto", "Gross margin")],
    timing: loc(
      "Ventana de oportunidad; primer entrante frente a seguidor",
      "Window of opportunity; first mover versus follower"
    ),
    countryType: loc(
      "Todos los países, priorizados según potencial de mercado, calidad y contexto competitivo",
      "All countries, prioritized by market potential, quality and competitive context"
    ),
    typicalModes: [
      loc(
        "Según riesgos, oportunidades, momento y capacidades: cualquier modo puede aplicar",
        "Depending on risks, opportunities, timing and capabilities: any mode can apply"
      ),
    ],
  },
  {
    id: "resources",
    label: loc("Acceso a recursos", "Resource access"),
    expectations: [
      loc("Acceso a recursos naturales", "Access to natural resources"),
      loc("Acceso a mano de obra cualificada de bajo coste", "Access to low-cost skilled labour"),
      loc("Acceso a proveedores", "Access to suppliers"),
    ],
    kpis: [loc("Costes", "Costs"), loc("Calidad", "Quality"), loc("Seguridad de suministro", "Security of supply")],
    timing: loc(
      "Primer entrante, para apropiarse de los recursos antes que otros",
      "First mover, to pre-empt the resources before others do"
    ),
    countryType: loc("Países ricos en recursos", "Resource-rich countries"),
    typicalModes: [
      loc("Filial propia si se permite y el riesgo es bajo", "Wholly owned subsidiary where allowed and risk is low"),
      loc("Empresa conjunta si se exige", "Joint venture where required"),
      loc("Contratos de suministro a largo plazo", "Long-term supply contracts"),
    ],
  },
  {
    id: "learning",
    label: loc("Aprendizaje", "Learning"),
    expectations: [
      loc("Entender la tecnología puntera", "Understanding leading-edge technology"),
      loc("Acercarse a las mejores prácticas", "Getting close to best practice"),
      loc("Aprender a competir en mercados difíciles y sofisticados", "Learning to compete in tough, sophisticated markets"),
    ],
    kpis: [loc("Saber hacer", "Know-how"), loc("Mejora de procesos", "Process improvement")],
    timing: loc(
      "En cuanto el país se reconozca como centro de competencia",
      "As soon as the country is recognized as a centre of competence"
    ),
    countryType: loc(
      "Países con infraestructura tecnológica y de conocimiento fuerte",
      "Countries with strong technological and knowledge infrastructure"
    ),
    typicalModes: [loc("Empresa conjunta", "Joint venture"), loc("Centro de I+D", "R&D centre"), loc("Observatorio", "Listening post")],
  },
  {
    id: "coordination",
    label: loc("Coordinación", "Coordination"),
    expectations: [
      loc("Base para el desarrollo global o regional", "Base for global or regional development"),
      loc("Centros logísticos cerca de instituciones financieras", "Logistics centres close to financial institutions"),
    ],
    kpis: [loc("Velocidad", "Speed"), loc("Control", "Control"), loc("Sinergias", "Synergies")],
    timing: loc("Tres etapas: iniciación, crecimiento, coordinación", "Three stages: initiation, growth, coordination"),
    countryType: loc("Hubs", "Hubs"),
    typicalModes: [
      loc("Oficina de representación", "Representative office"),
      loc("Sede global o regional", "Global or regional headquarters"),
      loc("Centro logístico", "Logistics centre"),
      loc("Centro de formación", "Training centre"),
      loc("Centro financiero", "Financial centre"),
    ],
  },
];

export const ENTRY_OBJECTIVES_PROVENANCE: Localized = loc(
  "Lasserre y Monteiro, Tabla 7.1, pp. 260-261",
  "Lasserre and Monteiro, Table 7.1, pp. 260-261"
);

/* ------------------------------------------------------------------------------------ */
/* Cuándo entrar — fases de la ventana, pp. 261-262 y p. 277                             */
/* ------------------------------------------------------------------------------------ */

export type WindowPhaseId = "premature" | "window" | "competitive_growth" | "mature";

export const WINDOW_PHASES: {
  id: WindowPhaseId;
  label: Localized;
  signal: Localized;
  /** Modos que el libro considera apropiados en esa fase. Claves de `entryModes.ts`. */
  appropriateModes: string[];
  guidance: Localized;
}[] = [
  {
    id: "premature",
    label: loc("Prematura", "Premature"),
    signal: loc(
      "No hay demanda suficiente: falta poder adquisitivo o el producto no encaja con el mercado.",
      "There is not enough demand: purchasing power is missing or the product does not fit the market."
    ),
    appropriateModes: ["office", "distributor"],
    guidance: loc(
      "Invertir en grande aquí no devuelve ingresos a largo plazo. Lo apropiado es oficina de representación, puesto de escucha o acuerdo de distribución.",
      "Investing heavily here does not return long-term revenue. What fits is a representative office, a listening post or a distribution agreement."
    ),
  },
  {
    id: "window",
    label: loc("Ventana de oportunidad", "Window of opportunity"),
    signal: loc(
      "El mercado despega y el panorama competitivo aún no está asentado.",
      "The market takes off and the competitive landscape is not yet settled."
    ),
    appropriateModes: ["greenfield", "alliance", "distributor", "licensing", "digital"],
    guidance: loc(
      "Es el momento en que la elección entre primer entrante y seguidor tiene sentido. Cualquier modo puede aplicar según riesgo y capacidades.",
      "This is when the choice between first mover and follower actually matters. Any mode can apply depending on risk and capabilities."
    ),
  },
  {
    id: "competitive_growth",
    label: loc("Crecimiento competitivo", "Competitive growth"),
    signal: loc(
      "Alto crecimiento, pero los competidores ya se han llevado las ventajas de primer entrante.",
      "High growth, but competitors have already taken the first-mover advantages."
    ),
    appropriateModes: ["acquisition", "alliance"],
    guidance: loc(
      "Entrar ahora es arriesgado salvo con recursos masivos o una estrategia muy diferenciada. La vía practicable es adquisición o empresa conjunta.",
      "Entering now is risky unless you bring massive resources or a highly differentiated strategy. The practicable route is acquisition or joint venture."
    ),
  },
  {
    id: "mature",
    label: loc("Madura", "Mature"),
    signal: loc("Competencia bien establecida.", "Well-established competition."),
    appropriateModes: ["acquisition", "greenfield"],
    guidance: loc(
      "Adquisición, o inversión directa con un producto innovador. Poco más funciona.",
      "Acquisition, or direct investment with an innovative product. Little else works."
    ),
  },
];

export const WINDOW_PHASES_PROVENANCE: Localized = loc(
  "pp. 261-262 y resumen de p. 277",
  "pp. 261-262 and the summary on p. 277"
);

/** Tabla 7.2, p. 262. */
export const FIRST_MOVER: { advantages: Localized[]; disadvantages: Localized[]; provenance: Localized } = {
  advantages: [
    loc(
      "Monopolizar recursos: distribución, ubicación, personas, contactos, proveedores",
      "Monopolizing resources: distribution, location, people, contacts, suppliers"
    ),
    loc("Establecer marca", "Establishing the brand"),
    loc("Establecer estándares", "Setting standards"),
    loc("Aprender sobre los clientes", "Learning about customers"),
  ],
  disadvantages: [
    loc(
      "Asumir el riesgo: inmadurez del mercado, encaje producto-mercado incierto, falta de infraestructura",
      "Bearing the risk: market immaturity, uncertain product-market fit, missing infrastructure"
    ),
    loc(
      "Trabajar ahora en beneficio de quien venga después",
      "Doing the work now for the benefit of whoever comes next"
    ),
  ],
  provenance: loc("Tabla 7.2, p. 262", "Table 7.2, p. 262"),
};

export type TimingStance = "first_mover" | "follower" | "acquirer";

export const TIMING_STANCES: { id: TimingStance; label: Localized; definition: Localized }[] = [
  {
    id: "first_mover",
    label: loc("Primer entrante", "First mover"),
    definition: loc(
      "Entrar antes que la competencia y asumir el riesgo de abrir el mercado.",
      "Enter ahead of the competition and carry the risk of opening the market."
    ),
  },
  {
    id: "follower",
    label: loc("Seguidor", "Follower"),
    definition: loc(
      "Entrar tras los primeros, con el mercado ya validado.",
      "Enter after the first movers, with the market already validated."
    ),
  },
  {
    id: "acquirer",
    label: loc("Adquirente", "Acquirer"),
    definition: loc(
      "Entrar comprando una posición ya construida, cuando la ventana se ha cerrado.",
      "Enter by buying a position that is already built, once the window has closed."
    ),
  },
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
export const PACE_FACTORS: { id: PaceFactorId; label: Localized; question: Localized; direction: "faster" | "slower" }[] = [
  {
    id: "past_experience",
    label: loc("Experiencia previa en países similares", "Past experience in similar countries"),
    question: loc(
      "¿Cuánta experiencia acumulada hay en mercados comparables?",
      "How much accumulated experience is there in comparable markets?"
    ),
    direction: "faster",
  },
  {
    id: "cultural_distance",
    label: loc("Distancia cultural (CAGE)", "Cultural distance (CAGE)"),
    question: loc(
      "¿Cuánta distancia cultural hay respecto al país de origen?",
      "How much cultural distance is there from the home country?"
    ),
    direction: "slower",
  },
  {
    id: "country_risk",
    label: loc("Riesgo país", "Country risk"),
    question: loc(
      "¿Cuál es el riesgo político y operativo del país?",
      "What is the political and operational risk of the country?"
    ),
    direction: "slower",
  },
  {
    id: "available_resources",
    label: loc("Recursos disponibles para comprometer", "Resources available to commit"),
    question: loc(
      "¿Cuántos recursos puede comprometer la empresa aquí?",
      "How many resources can the firm commit here?"
    ),
    direction: "faster",
  },
  {
    id: "entry_dispersion",
    label: loc("Dispersión de entradas simultáneas", "Dispersion of simultaneous entries"),
    question: loc("¿En cuántos países se está entrando a la vez?", "How many countries are being entered at once?"),
    direction: "slower",
  },
  {
    id: "resources_at_stake",
    label: loc("Volumen de recursos en juego", "Volume of resources at stake"),
    question: loc("¿Cuánto se pone en riesgo con esta entrada?", "How much is put at risk by this entry?"),
    direction: "slower",
  },
];

export const PACE_PROVENANCE: Localized = loc(
  "p. 262; el aviso sobre entradas apresuradas viene del caso de Whirlpool en China, pp. 262-263",
  "p. 262; the warning about rushed entries comes from the Whirlpool in China case, pp. 262-263"
);

/* ------------------------------------------------------------------------------------ */
/* Cómo entrar — Fig. 7.1 (p. 263) y Fig. 7.3 (p. 272)                                   */
/* ------------------------------------------------------------------------------------ */

/** Fig. 7.1: los modos ordenados por control y por intensidad de inversión. */
export const MODE_GRID: { control: "weak" | "strong"; intensity: "low" | "high"; modes: Localized[] }[] = [
  {
    control: "weak",
    intensity: "high",
    modes: [
      loc("Empresa conjunta minoritaria", "Minority joint venture"),
      loc("Consorcio", "Consortium"),
      loc("Adquisición minoritaria", "Minority acquisition"),
    ],
  },
  {
    control: "strong",
    intensity: "high",
    modes: [
      loc("Filial propia con inversión greenfield", "Wholly owned subsidiary through greenfield investment"),
      loc("Adquisición dominante", "Dominant acquisition"),
      loc("Empresa conjunta con mayoría absoluta", "Joint venture with outright majority"),
    ],
  },
  {
    control: "weak",
    intensity: "low",
    modes: [loc("Licencia", "Licensing"), loc("Distribución", "Distribution"), loc("Franquicia", "Franchising"), loc("Agente", "Agent")],
  },
  {
    control: "strong",
    intensity: "low",
    modes: [
      loc("Oficina de compras", "Purchasing office"),
      loc("Oficina de representación", "Representative office"),
      loc("Filial de marketing", "Marketing subsidiary"),
      loc("Observatorio técnico", "Technical listening post"),
      loc("Sede regional", "Regional headquarters"),
    ],
  },
];

export const MODE_GRID_PROVENANCE: Localized = loc("Fig. 7.1, p. 263", "Fig. 7.1, p. 263");

export type Band = "low" | "medium" | "high";
export type ClimateBand = "poor" | "medium" | "good";

/** Fig. 7.3, p. 272: atractivo del mercado × clima político de inversión. */
export const MODE_MAPPING: { attractiveness: Band; climate: ClimateBand; modes: Localized[] }[] = [
  {
    attractiveness: "high",
    climate: "poor",
    modes: [
      loc("Exposición financiera mínima", "Minimum financial exposure"),
      loc("Minoría en empresa conjunta", "Minority joint venture"),
      loc("Licencia", "Licensing"),
    ],
  },
  {
    attractiveness: "high",
    climate: "medium",
    modes: [
      loc("Filial propia", "Wholly owned subsidiary"),
      loc("Adquisición mayoritaria o empresa conjunta", "Majority acquisition or joint venture"),
    ],
  },
  {
    attractiveness: "high",
    climate: "good",
    modes: [
      loc("Compromiso máximo", "Maximum commitment"),
      loc("Filial propia", "Wholly owned subsidiary"),
      loc("Adquisición total", "Full acquisition"),
    ],
  },
  {
    attractiveness: "medium",
    climate: "poor",
    modes: [
      loc("Presencia limitada", "Limited presence"),
      loc("Distribuidor o agente", "Distributor or agent"),
      loc("Licencia", "Licensing"),
    ],
  },
  { attractiveness: "medium", climate: "medium", modes: [loc("Empresa conjunta", "Joint venture")] },
  {
    attractiveness: "medium",
    climate: "good",
    modes: [loc("Compromiso alto", "High commitment"), loc("Filial propia o adquisición", "Wholly owned subsidiary or acquisition")],
  },
  { attractiveness: "low", climate: "poor", modes: [loc("Exportación ocasional", "Opportunistic exports")] },
  {
    attractiveness: "low",
    climate: "medium",
    modes: [loc("Agente de exportación", "Export agent"), loc("Licencia", "Licensing")],
  },
  { attractiveness: "low", climate: "good", modes: [loc("Distribuidor independiente", "Independent distributor")] },
];

export const MODE_MAPPING_PROVENANCE: Localized = loc("Fig. 7.3, p. 272", "Fig. 7.3, p. 272");

/** Fig. 7.2, p. 264: los seis factores que determinan la elección de modo. */
export const MODE_FACTORS: Localized[] = [
  loc("Atractivo global del mercado", "Overall market attractiveness"),
  loc("Riesgos políticos y operativos", "Political and operational risks"),
  loc("Requisitos del gobierno", "Government requirements"),
  loc("Presión de tiempo", "Time pressure"),
  loc("Capacidades internas", "Internal capabilities"),
  loc("Objetivos estratégicos y retorno esperado", "Strategic objectives and expected return"),
];

/** Tabla 7.5, p. 272: los tres modelos de entrada en el espacio digital. */
export const DIGITAL_ENTRY_MODELS: { id: string; label: Localized; features: Localized[] }[] = [
  {
    id: "relational",
    label: loc("Relacional tradicional", "Traditional relational"),
    features: [
      loc("Distribuidores", "Distributors"),
      loc("Socios locales", "Local partners"),
      loc("Logística", "Logistics"),
      loc("Personal local", "Local staff"),
      loc("Inversiones productivas", "Productive investments"),
    ],
  },
  {
    id: "digital",
    label: loc("Digital", "Digital"),
    features: [
      loc("Entrega puramente digital", "Purely digital delivery"),
      loc("Envío directo o descarga", "Direct shipping or download"),
      loc("Computación en la nube", "Cloud computing"),
    ],
  },
  {
    id: "hybrid",
    label: loc("Híbrido", "Hybrid"),
    features: [
      loc("Plataformas B2B y B2C", "B2B and B2C platforms"),
      loc("Presencia física", "Physical presence"),
      loc("Plataformas de atención al cliente", "Customer-service platforms"),
      loc("Personal local", "Local staff"),
      loc("Alianzas", "Alliances"),
      loc("Socios locales", "Local partners"),
    ],
  },
];

export const DIGITAL_ENTRY_PROVENANCE: Localized = loc(
  "Tabla 7.5, p. 272, a partir de Watson, Weaven y Perkins (2017)",
  "Table 7.5, p. 272, after Watson, Weaven and Perkins (2017)"
);

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
