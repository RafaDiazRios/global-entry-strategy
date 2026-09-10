/**
 * Ruta guiada: el camino que la herramienta no tenía.
 *
 * Los cinco módulos anteriores son fieles al libro pero no dicen por dónde empezar. Esta
 * ruta ordena el trabajo en doce pasos y, en cada uno, responde a las cuatro preguntas que
 * un aprendiz necesita y un experto agradece: qué se decide aquí, por qué importa, qué
 * aspecto tiene una respuesta buena y cuándo se puede pasar al siguiente.
 *
 * El orden no es arbitrario: es el del propio libro. La Parte II va de la ambición global
 * (cap. 5) al atractivo de países (cap. 6), de ahí a la estrategia de entrada (cap. 7) y a
 * la vía de acceso (cap. 8), y termina en la economía de la decisión. Saltarse el orden se
 * puede —las pestañas siguen ahí— pero la ruta dice lo que se está saltando.
 */

export type StepId =
  | "case"
  | "material"
  | "brief"
  | "ambition_motives"
  | "ambition_indices"
  | "positioning"
  | "value_chain"
  | "countries"
  | "assessment"
  | "entry"
  | "partnering"
  | "economics";

/** Pestaña de la aplicación donde se trabaja el paso. */
export type StepTarget = "case" | "brief" | "ambition" | "screen" | "calibrate" | "finance" | "compare" | "decision" | "approval";

export type GuidedStep = {
  id: StepId;
  order: number;
  title: string;
  /** Qué se decide aquí, en una frase. */
  decision: string;
  /** Por qué importa, en dos frases como mucho. */
  why: string;
  /** Ejemplo del propio libro, con su página. */
  example: { text: string; source: string };
  /** Qué distingue una respuesta buena de una vacía. */
  quality: string[];
  target: StepTarget;
  /** Sub-pestaña dentro del panel de estrategia global, cuando aplica. */
  subTab?: "ambition" | "positioning" | "entry" | "partnering";
};

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: "case",
    order: 1,
    title: "Abrir el caso y escribir el mandato",
    decision: "Qué hay que decidir, en una sola frase.",
    why: "Un análisis sin mandato explícito se convierte en una recopilación de datos que nunca termina. La frase del mandato es la que decide después qué evidencia es relevante y cuál no.",
    example: {
      text: "«¿Debe Lubricador SA entrar en el mercado chino de aditivos para frenos y, si entra, con qué modo?» Esa es la pregunta del mini-caso: nombra la empresa, el mercado y las dos decisiones encadenadas.",
      source: "Mini-caso 7.3, pp. 275-276",
    },
    quality: [
      "Nombra la empresa, el país o cluster y el sector concreto",
      "Es una pregunta, no un tema",
      "Se puede responder con «sí, así» o «no, por esto»",
    ],
    target: "case",
  },
  {
    id: "material",
    order: 2,
    title: "Cargar el material y extraer evidencias",
    decision: "Sobre qué hechos se va a sostener el análisis.",
    why: "Toda la herramienta distingue entre lo que sabe y lo que supone. Sin evidencias cargadas, cada juicio posterior es una opinión con aspecto de dato.",
    example: {
      text: "En el mini-caso de Schneider Electric en India, el material da la cuota del 9,4% en UPS, el tamaño de 530 millones de dólares y el crecimiento del 7%: tres cifras que después sostienen la evaluación del mercado.",
      source: "Mini-caso 7.1, pp. 273-274",
    },
    quality: [
      "Cada evidencia lleva su cita literal y su localizador",
      "Lo que propone el copiloto entra como sugerencia y se acepta una por una",
      "Un supuesto sin fuente se marca como supuesto, no se disfraza de dato",
    ],
    target: "case",
  },
  {
    id: "brief",
    order: 3,
    title: "Perfil de la empresa y objetivo de entrada",
    decision: "Quién entra, desde dónde, con qué modelo de negocio y buscando qué.",
    why: "El objetivo de entrada determina el tipo de país que interesa, el momento apropiado y los modos que tienen sentido. Cambiarlo a mitad de análisis invalida todo lo anterior.",
    example: {
      text: "Cargill combina búsqueda de recursos y de mercado: invierte en Brasil por el cacao y el azúcar, y en India vende alimentos producidos localmente además de exportar maíz y algodón.",
      source: "Ejemplo 7.2, p. 259",
    },
    quality: [
      "El modelo de negocio está descrito, no solo el sector",
      "El horizonte es coherente con el objetivo: aprender lleva menos años que construir cuota",
    ],
    target: "brief",
  },
  {
    id: "ambition_motives",
    order: 4,
    title: "Ambición: motivos y rol global",
    decision: "Qué papel quiere jugar la empresa en el mundo, hoy y dentro de N años.",
    why: "Sin ambición declarada no hay forma de saber si un país concreto merece inversión o basta una oficina. Es la pregunta que ordena todas las demás.",
    example: {
      text: "Whirlpool era un operador regional estadounidense en 1980 con GRI 0,35. Al ver que Asia Pacífico llegaría al 40% de las ventas mundiales de electrodomésticos, fijó como objetivo ser jugador global y lo alcanzó hacia 2010.",
      source: "Ejemplo 5.2, pp. 186-187",
    },
    quality: [
      "Cada motivo marcado lleva una justificación específica de esta empresa",
      "El rol objetivo es distinto del actual, o se explica por qué no",
      "La desventaja por ser extranjero está nombrada y compensada",
    ],
    target: "ambition",
    subTab: "ambition",
  },
  {
    id: "ambition_indices",
    order: 5,
    title: "Ambición: índices y brecha",
    decision: "Dónde está la empresa de verdad en el mapa de ambición.",
    why: "Los índices contrastan lo que la empresa dice ser con cómo reparte sus ventas y sus activos. Es habitual que una empresa que se llama global resulte ser un exportador.",
    example: {
      text: "Air Liquide reparte sus ventas casi como el mercado mundial del gas industrial, pero concentra el 60% de sus activos en América: alto GRI y GCI claramente menor.",
      source: "Learning assignment 1, p. 220",
    },
    quality: [
      "La demanda de la industria sale de la Tabla 5.2 o de una fuente citada",
      "Ventas y activos entran por regiones, en cualquier unidad",
      "Si el rol declarado no coincide con el observado, la contradicción se resuelve",
    ],
    target: "ambition",
    subTab: "ambition",
  },
  {
    id: "positioning",
    order: 6,
    title: "Posicionamiento y curva de valor",
    decision: "Con qué propuesta de valor se compite y en qué se separa de los demás.",
    why: "Las tres dimensiones dan una de las ocho posiciones del libro, y esa posición dicta qué capacidades hacen falta. La curva de valor comprueba que la propuesta se distingue de algo.",
    example: {
      text: "Yellow Tail entró en Estados Unidos eliminando el lenguaje enológico, reduciendo la gama a dos vinos, subiendo la accesibilidad del precio y creando distribución en supermercado.",
      source: "Ejemplo 5.3, p. 195",
    },
    quality: [
      "Hay al menos un competidor en la curva: sin comparación no hay curva",
      "La curva propuesta se separa de la del competidor más cercano",
      "La rejilla ERRC sale sola de las dos curvas; si sale vacía, no hay propuesta nueva",
    ],
    target: "ambition",
    subTab: "positioning",
  },
  {
    id: "value_chain",
    order: 7,
    title: "Cadena de valor y qué hay que crear",
    decision: "Qué actividades se gestionan global, regional o localmente, y qué capacidades no viajan.",
    why: "Aquí sale la lista de lo que hay que construir o conseguir de un socio en el país de destino. Esa lista es la entrada de la decisión de entrada y de la de socio.",
    example: {
      text: "En la distribución masiva, el procesamiento electrónico de datos se transfiere sin cambios, casi toda competencia se adapta al comportamiento local, y los activos físicos y la marca hay que crearlos en el sitio.",
      source: "Fig. 5.14, p. 199",
    },
    quality: [
      "Las seis funciones tienen nivel actual y nivel objetivo",
      "Ninguna capacidad queda sin etiquetar como transferir, adaptar o crear",
      "Lo etiquetado «crear» es concreto: «red de almacenes», no «capacidades logísticas»",
    ],
    target: "ambition",
    subTab: "positioning",
  },
  {
    id: "countries",
    order: 8,
    title: "Universo de países y cribado",
    decision: "Qué mercados entran en la comparación y cuáles quedan fuera desde el principio.",
    why: "Comparar doce países mal es peor que comparar tres bien. El cribado por tamaño y crecimiento deja fuera lo que no merece el trabajo de evaluar.",
    example: {
      text: "En automoción, Japón, Corea y China son países clave en Asia; en pulpa y papel lo es Indonesia por sus recursos; para los jugadores de internet, California. La condición de «clave» es específica de cada industria.",
      source: "pp. 187-188",
    },
    quality: [
      "Cada país tiene un rol asignado: clave, emergente, plataforma, de mercado o de aprovisionamiento",
      "Los indicadores públicos se han descargado y los huecos están declarados",
    ],
    target: "screen",
  },
  {
    id: "assessment",
    order: 9,
    title: "Evaluar cada país con el capítulo 6",
    decision: "Cuán atractivo y cuán arriesgado es cada mercado, dimensión por dimensión.",
    why: "Es el bloque más largo y el que sostiene todo lo demás. Un país evaluado a ojo contamina la comparación, el caso económico y la decisión final.",
    example: {
      text: "El caso de Izmir Industrial Electric evalúa un mercado con su tamaño, su crecimiento, la estructura competitiva y el riesgo país, y llega a una recomendación distinta de la intuitiva.",
      source: "Tabla 6.7 y mini-caso 6.2, pp. 249-251",
    },
    quality: [
      "Cada juicio lleva la fuente u observación que lo sostiene",
      "Los ítems sin evidencia se dejan sin contestar en lugar de rellenarse por simetría",
      "La confianza que muestra la herramienta refleja la evidencia real, no el número de deslizadores movidos",
    ],
    target: "calibrate",
  },
  {
    id: "entry",
    order: 10,
    title: "Estrategia de entrada: cuándo y cómo",
    decision: "En qué fase está la ventana, qué posición se toma ante el momento y con qué modo se entra.",
    why: "El modo no se elige por preferencia sino por la combinación de fase, riesgo, requisitos del gobierno y capacidades. Un modo fuera de fase es la forma más cara de equivocarse.",
    example: {
      text: "IKEA esperó desde 2006 hasta 2018 para abrir en India: la norma exigía empresa conjunta con un máximo del 50%, y su política era filial propia. Entró cuando el gobierno permitió el 100%.",
      source: "Ejemplo 7.1, pp. 258-259",
    },
    quality: [
      "La fase de la ventana se sostiene en evidencia de crecimiento y competencia, no en impresión",
      "Los seis factores de ritmo están contestados",
      "Si el modo elegido queda fuera de lo que sugiere el mapa, se explica por qué",
    ],
    target: "ambition",
    subTab: "entry",
  },
  {
    id: "partnering",
    order: 11,
    title: "Vía de acceso y socio",
    decision: "Si lo que falta se construye, se alquila o se compra, y con quién.",
    why: "La mayoría de las entradas fallan aquí y no en el análisis de mercado. El encaje más débil con el socio hunde la alianza por bueno que sea el resto.",
    example: {
      text: "Aliarse con un competidor da acceso a mercado, activos y personas, pero expone a la copia y a la fuga tecnológica. Aliarse con un inversor da capital y cumplimiento legal, y ningún apoyo operativo.",
      source: "Tabla 7.3, p. 267",
    },
    quality: [
      "Cada capacidad a conseguir pasa por los cuatro ejes del árbol",
      "Las cuatro pruebas de encaje están puntuadas y con evidencia",
      "Si hay inversión preliminar, la opción tiene señales con umbral y dos salidas",
    ],
    target: "ambition",
    subTab: "partnering",
  },
  {
    id: "economics",
    order: 12,
    title: "Caso económico y decisión",
    decision: "Cuánto vale cada alternativa y cuál se recomienda, con sus condiciones.",
    why: "Es donde el análisis se convierte en una cifra defendible y en una recomendación con puertas de revisión. Sin esto, todo lo anterior es una descripción.",
    example: {
      text: "Lubricador SA compara greenfield, comprar al competidor japonés, empresa conjunta al 50% y licencia, con un coste de capital del 15%. Las cuatro dan cifras muy distintas y ninguna domina en todo.",
      source: "Mini-caso 7.3, pp. 275-276",
    },
    quality: [
      "Los supuestos económicos están completos para al menos un país",
      "Se ha generado la evaluación y se han leído las alertas",
      "La alternativa preferida tiene una puerta de decisión con responsable y fecha",
    ],
    target: "finance",
  },
];

/* ------------------------------------------------------------------------------------ */
/* Estado de la ruta                                                                     */
/* ------------------------------------------------------------------------------------ */

export type ModuleProgress = { answered: number; total: number; complete: boolean };

/**
 * Lo que la ruta necesita saber del estado actual. Se compone en el cliente a partir de lo
 * que ya tiene en pantalla y de lo que devuelven los módulos, para que el progreso sea el
 * de ahora mismo y no el del último guardado.
 */
export type RouteSnapshot = {
  caseId: number | null;
  hasDecisionQuestion: boolean;
  documentCount: number;
  acceptedEvidenceCount: number;
  briefComplete: boolean;
  ambition: ModuleProgress | null;
  ambitionIndicesReady: boolean;
  positioning: ModuleProgress | null;
  valueChainReady: boolean;
  candidateCount: number;
  screenedCount: number;
  assessedCountries: number;
  entry: ModuleProgress | null;
  partnering: ModuleProgress | null;
  financialReady: boolean;
  hasResult: boolean;
  approvalCount: number;
};

export type StepStatus = "done" | "in_progress" | "pending" | "blocked";

export type StepState = {
  step: GuidedStep;
  status: StepStatus;
  /** Qué falta exactamente para darlo por hecho. */
  missing: string[];
  /** Progreso 0-1 cuando el paso lo tiene medido. */
  progress: number | null;
};

export type RouteState = {
  steps: StepState[];
  /** El paso en el que hay que trabajar ahora. Null cuando está todo hecho. */
  current: StepState | null;
  doneCount: number;
  total: number;
};

function fromModule(progress: ModuleProgress | null, label: string): { done: boolean; missing: string[]; ratio: number | null } {
  if (!progress) return { done: false, missing: [`${label} sin empezar`], ratio: null };
  return {
    done: progress.complete,
    missing: progress.complete ? [] : [`${progress.answered} de ${progress.total} apartados contestados`],
    ratio: progress.total ? progress.answered / progress.total : null,
  };
}

/** Evalúa la ruta entera. Función pura: la misma entrada da siempre el mismo camino. */
export function evaluateRoute(snapshot: RouteSnapshot): RouteState {
  const states: StepState[] = GUIDED_STEPS.map((step) => {
    let done = false;
    let missing: string[] = [];
    let progress: number | null = null;

    switch (step.id) {
      case "case":
        done = snapshot.caseId !== null && snapshot.hasDecisionQuestion;
        if (snapshot.caseId === null) missing.push("Crear o seleccionar un caso");
        else if (!snapshot.hasDecisionQuestion) missing.push("Escribir el mandato: qué hay que decidir");
        break;
      case "material":
        done = snapshot.documentCount > 0 && snapshot.acceptedEvidenceCount > 0;
        if (!snapshot.documentCount) missing.push("Cargar al menos un documento o pegar el texto del caso");
        else if (!snapshot.acceptedEvidenceCount) missing.push("Aceptar al menos una evidencia");
        break;
      case "brief":
        done = snapshot.briefComplete;
        if (!done) missing.push("Completar empresa, país de origen, industria, modelo de negocio y objetivo");
        break;
      case "ambition_motives": {
        const module = fromModule(snapshot.ambition, "Ambición");
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "ambition_indices":
        done = snapshot.ambitionIndicesReady;
        if (!done) missing.push("Introducir demanda de la industria, ventas y activos por regiones");
        break;
      case "positioning": {
        const module = fromModule(snapshot.positioning, "Posicionamiento");
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "value_chain":
        done = snapshot.valueChainReady;
        if (!done) missing.push("Completar la matriz de configuración y etiquetar las capacidades como transferir, adaptar o crear");
        break;
      case "countries":
        done = snapshot.screenedCount > 0;
        if (!snapshot.candidateCount) missing.push("Añadir al menos un país candidato");
        else if (!snapshot.screenedCount) missing.push("El filtro deja fuera a todos los candidatos: revíselo");
        break;
      case "assessment":
        done = snapshot.assessedCountries > 0 && snapshot.assessedCountries >= snapshot.screenedCount;
        if (!snapshot.assessedCountries) missing.push("Evaluar al menos un país con el marco del capítulo 6");
        else if (snapshot.assessedCountries < snapshot.screenedCount) missing.push(`Quedan ${snapshot.screenedCount - snapshot.assessedCountries} país(es) sin evaluar`);
        progress = snapshot.screenedCount ? Math.min(1, snapshot.assessedCountries / snapshot.screenedCount) : null;
        break;
      case "entry": {
        const module = fromModule(snapshot.entry, "Estrategia de entrada");
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "partnering": {
        const module = fromModule(snapshot.partnering, "Vía de acceso y socio");
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "economics":
        done = snapshot.financialReady && snapshot.hasResult && snapshot.approvalCount > 0;
        if (!snapshot.financialReady) missing.push("Completar los supuestos económicos de al menos un país");
        else if (!snapshot.hasResult) missing.push("Generar la evaluación");
        else if (!snapshot.approvalCount) missing.push("Abrir una puerta de decisión para la alternativa preferida");
        break;
    }

    return { step, status: done ? "done" : "pending", missing, progress };
  });

  // El paso actual es el primero sin terminar; los anteriores hechos y los posteriores en
  // espera. No se bloquea nada: se puede trabajar fuera de orden y la ruta lo refleja.
  const currentIndex = states.findIndex((state) => state.status !== "done");
  if (currentIndex >= 0) states[currentIndex].status = "in_progress";

  return {
    steps: states,
    current: currentIndex >= 0 ? states[currentIndex] : null,
    doneCount: states.filter((state) => state.status === "done").length,
    total: states.length,
  };
}
