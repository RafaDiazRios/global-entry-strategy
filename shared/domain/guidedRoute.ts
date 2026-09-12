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
 *
 * Lo que faltaba, y se añade aquí, son las otras dos preguntas que hace cualquiera que abre
 * la herramienta por primera vez: qué necesito tener antes de empezar este paso, y de dónde
 * saco lo que me pide.
 *
 * La primera se resuelve con dependencias declaradas —este paso necesita esto de aquel— que
 * la ruta comprueba contra el estado real del caso, no contra una lista fija. Decir «primero
 * el mandato» es un manual; decir «le falta el TAM de Países Bajos, y está en la fase 5» es
 * una herramienta.
 *
 * La segunda se resuelve diciendo de dónde sale cada dato, y eso importa más de lo que
 * parece: un número que se descarga del Banco Mundial y otro que hay que ir a pedirle al
 * director financiero no cuestan lo mismo ni valen lo mismo, y saber cuál es cuál antes de
 * empezar es la diferencia entre planificar el trabajo y descubrirlo.
 *
 * Lo que un paso desbloquea no se declara: se deriva invirtiendo las dependencias. Dos
 * listas que dicen lo mismo acaban divergiendo el día que alguien toca una.
 */

import { loc, type Localized } from "../i18n";

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

/**
 * De dónde sale un dato. Determina cuánto cuesta conseguirlo y cuánto pesa como evidencia,
 * que son las dos cosas que hay que saber antes de prometer una fecha.
 */
export type DataOrigin =
  | "public_source"
  | "case_material"
  | "company"
  | "group_decision"
  | "field_research"
  | "judgement";

export const DATA_ORIGINS: { id: DataOrigin; label: Localized; help: Localized }[] = [
  {
    id: "public_source",
    label: loc("Fuente pública", "Public source"),
    help: loc(
      "Se descarga solo. No hay que pedírselo a nadie y es verificable por cualquiera.",
      "It downloads on its own. Nobody has to be asked, and anyone can verify it."
    ),
  },
  {
    id: "case_material",
    label: loc("Material del caso", "Case material"),
    help: loc(
      "Está en los documentos que ha cargado. Sale con cita y localizador.",
      "It is in the documents you loaded. It comes with a quote and a locator."
    ),
  },
  {
    id: "company",
    label: loc("Datos de la empresa", "Company data"),
    help: loc(
      "Hay que pedirlo dentro de casa: cuentas, ventas por región, plantilla, activos.",
      "It has to be asked for internally: accounts, sales by region, headcount, assets."
    ),
  },
  {
    id: "group_decision",
    label: loc("Decisión ya tomada por el grupo", "A decision the group has already taken"),
    help: loc(
      "No es un juicio del analista: es una política que existe y que esta tesis respeta o contradice de forma explícita.",
      "It is not the analyst's judgement: it is an existing policy that this thesis either respects or explicitly contradicts."
    ),
  },
  {
    id: "field_research",
    label: loc("Investigación de campo", "Field research"),
    help: loc(
      "Entrevistas, visitas, asesor local, prueba comercial. Es lo que más tarda y lo que más pesa.",
      "Interviews, visits, a local adviser, a commercial test. It takes the longest and it carries the most weight."
    ),
  },
  {
    id: "judgement",
    label: loc("Juicio propio, con su razón escrita", "Your own judgement, with its reason written"),
    help: loc(
      "Legítimo y necesario, siempre que quede registrado de qué depende. Sin la razón escrita no es evidencia, es una corazonada.",
      "Legitimate and necessary, as long as what it rests on is recorded. Without the written reason it is not evidence, it is a hunch."
    ),
  },
];

/** Lo que este paso necesita de otro anterior. */
export type StepNeed = { from: StepId; what: Localized };

/** Un dato que hay que traer, con su procedencia y dónde encontrarlo. */
export type StepData = { what: Localized; origin: DataOrigin; where: Localized };

export type GuidedStep = {
  id: StepId;
  order: number;
  title: Localized;
  /** Qué se decide aquí, en una frase. */
  decision: Localized;
  /** Por qué importa, en dos frases como mucho. */
  why: Localized;
  /** Ejemplo del propio libro, con su página. */
  example: { text: Localized; source: string };
  /** Qué distingue una respuesta buena de una vacía. */
  quality: Localized[];
  target: StepTarget;
  /** Sub-pestaña dentro del panel de estrategia global, cuando aplica. */
  subTab?: "ambition" | "positioning" | "entry" | "partnering";
  /** De qué pasos depende, y de qué exactamente. Lo que desbloquea se deriva invirtiéndolo. */
  needs: StepNeed[];
  /** Qué hay que traer de fuera para poder contestarlo. */
  bring: StepData[];
};

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: "case",
    order: 1,
    title: loc("Abrir el caso y escribir el mandato", "Open the case and write the mandate"),
    decision: loc("Qué hay que decidir, en una sola frase.", "What has to be decided, in a single sentence."),
    why: loc(
      "Un análisis sin mandato explícito se convierte en una recopilación de datos que nunca termina. La frase del mandato es la que decide después qué evidencia es relevante y cuál no.",
      "An analysis without an explicit mandate turns into data gathering that never ends. The mandate is what later decides which evidence is relevant and which is not."
    ),
    example: {
      text: loc(
        "«¿Debe Lubricador SA entrar en el mercado chino de aditivos para frenos y, si entra, con qué modo?» Esa es la pregunta del mini-caso: nombra la empresa, el mercado y las dos decisiones encadenadas.",
        "\u201cShould Lubricador SA enter the Chinese brake-additive market and, if so, through which mode?\u201d That is the mini-case question: it names the company, the market and the two linked decisions."
      ),
      source: "Mini-case 7.3, pp. 275-276",
    },
    quality: [
      loc("Nombra la empresa, el país o cluster y el sector concreto", "It names the company, the country or cluster and the specific sector"),
      loc("Es una pregunta, no un tema", "It is a question, not a topic"),
      loc("Se puede responder con «sí, así» o «no, por esto»", "It can be answered with \u201cyes, this way\u201d or \u201cno, because of this\u201d"),
    ],
    target: "case",
    needs: [],
    bring: [
      { what: loc("La pregunta que alguien ha hecho y hay que contestar", "The question someone asked and that has to be answered"), origin: "group_decision", where: loc("El encargo: quién lo pide, qué espera y para cuándo.", "The brief: who is asking, what they expect and by when.") },
    ],
  },
  {
    id: "material",
    order: 2,
    title: loc("Cargar el material y extraer evidencias", "Load the material and extract evidence"),
    decision: loc("Sobre qué hechos se va a sostener el análisis.", "Which facts the analysis will rest on."),
    why: loc(
      "Toda la herramienta distingue entre lo que sabe y lo que supone. Sin evidencias cargadas, cada juicio posterior es una opinión con aspecto de dato.",
      "The whole tool separates what it knows from what it assumes. With no evidence loaded, every later judgement is an opinion dressed as a fact."
    ),
    example: {
      text: loc(
        "En el mini-caso de Schneider Electric en India, el material da la cuota del 9,4% en UPS, el tamaño de 530 millones de dólares y el crecimiento del 7%: tres cifras que después sostienen la evaluación del mercado.",
        "In the Schneider Electric mini-case, the material gives a 9.4% share in UPS, a market of 530 million dollars and 7% growth: three figures that later carry the market assessment."
      ),
      source: "Mini-case 7.1, pp. 273-274",
    },
    quality: [
      loc("Cada evidencia lleva su cita literal y su localizador", "Every piece of evidence carries its verbatim quote and its locator"),
      loc("Lo que propone el copiloto entra como sugerencia y se acepta una por una", "What the copilot proposes arrives as a suggestion and is accepted one by one"),
      loc("Un supuesto sin fuente se marca como supuesto, no se disfraza de dato", "An assumption without a source is marked as an assumption, not disguised as data"),
    ],
    target: "case",
    needs: [{ from: "case", what: loc("un caso abierto donde colgar los documentos", "an open case to hang the documents on") }],
    bring: [
      { what: loc("El texto del caso, un informe sectorial o las notas de la investigación", "The case text, a sector report or the research notes"), origin: "case_material", where: loc("Pegar el texto es mejor que subir el PDF: permite comprobar que cada cita aparece de verdad en el original.", "Pasting the text beats uploading the PDF: it lets each quote be checked against the original.") },
    ],
  },
  {
    id: "brief",
    order: 3,
    title: loc("Perfil de la empresa y objetivo de entrada", "Company profile and entry objective"),
    decision: loc("Quién entra, desde dónde, con qué modelo de negocio y buscando qué.", "Who is entering, from where, with what business model and looking for what."),
    why: loc(
      "El objetivo de entrada determina el tipo de país que interesa, el momento apropiado y los modos que tienen sentido. Cambiarlo a mitad de análisis invalida todo lo anterior.",
      "The entry objective determines which countries matter, the right timing and which modes make sense. Changing it halfway through invalidates everything before it."
    ),
    example: {
      text: loc(
        "Cargill combina búsqueda de recursos y de mercado: invierte en Brasil por el cacao y el azúcar, y en India vende alimentos producidos localmente además de exportar maíz y algodón.",
        "Cargill combines resource- and market-seeking: it invests in Brazil for cocoa and sugar, and in India it sells locally produced foods as well as exporting corn and cotton."
      ),
      source: "Example 7.2, p. 259",
    },
    quality: [
      loc("El modelo de negocio está descrito, no solo el sector", "The business model is described, not just the industry"),
      loc("El horizonte es coherente con el objetivo: aprender lleva menos años que construir cuota", "The horizon matches the objective: learning takes fewer years than building share"),
    ],
    target: "brief",
    needs: [{ from: "case", what: loc("la pregunta que hay que contestar", "the question that has to be answered") }],
    bring: [
      { what: loc("Empresa, país de origen, industria y modelo de negocio", "Company, home country, industry and business model"), origin: "company", where: loc("Lo sabe cualquiera de la casa; el modelo de negocio conviene acordarlo, no suponerlo.", "Anyone in the company knows it; the business model is worth agreeing rather than assuming.") },
      { what: loc("La propuesta de valor y qué activo la hace defendible", "The value proposition and the asset that makes it defensible"), origin: "judgement", where: loc("Es un juicio, y el que más condiciona todo lo demás. Escríbalo aunque le parezca obvio.", "It is a judgement, and the one that shapes everything else. Write it down even if it seems obvious.") },
      { what: loc("El horizonte y el objetivo de entrada", "The horizon and the entry objective"), origin: "group_decision", where: loc("Suele venir del plan estratégico: si no existe, decidirlo aquí y decir que se decidió aquí.", "It usually comes from the strategic plan: if there is none, decide it here and say that it was decided here.") },
    ],
  },
  {
    id: "ambition_motives",
    order: 4,
    title: loc("Ambición: motivos y rol global", "Ambition: motives and global role"),
    decision: loc("Qué papel quiere jugar la empresa en el mundo, hoy y dentro de N años.", "What role the company wants to play in the world, today and N years from now."),
    why: loc(
      "Sin ambición declarada no hay forma de saber si un país concreto merece inversión o basta una oficina. Es la pregunta que ordena todas las demás.",
      "Without a stated ambition there is no way to tell whether a country deserves investment or just an office. It is the question that orders all the others."
    ),
    example: {
      text: loc(
        "Whirlpool era un operador regional estadounidense en 1980 con GRI 0,35. Al ver que Asia Pacífico llegaría al 40% de las ventas mundiales de electrodomésticos, fijó como objetivo ser jugador global y lo alcanzó hacia 2010.",
        "Whirlpool was a US regional operator in 1980 with a GRI of 0.35. Seeing that Asia Pacific would reach 40% of world appliance sales, it set out to become a global player and got there by around 2010."
      ),
      source: "Example 5.2, pp. 186-187",
    },
    quality: [
      loc("Cada motivo marcado lleva una justificación específica de esta empresa", "Every motive ticked carries a justification specific to this company"),
      loc("El rol objetivo es distinto del actual, o se explica por qué no", "The target role differs from the current one, or the reason it does not is stated"),
      loc("La desventaja por ser extranjero está nombrada y compensada", "The liability of foreignness is named and offset"),
    ],
    target: "ambition",
    subTab: "ambition",
    needs: [{ from: "brief", what: loc("la industria y el objetivo, que determinan qué motivos son plausibles", "the industry and the objective, which determine which motives are plausible") }],
    bring: [
      { what: loc("Por qué la compañía quiere salir fuera, en sus propias palabras", "Why the company wants to go abroad, in its own words"), origin: "group_decision", where: loc("Actas del comité, plan estratégico o la conversación con quien encarga el trabajo.", "Committee minutes, the strategic plan, or the conversation with whoever commissioned the work.") },
    ],
  },
  {
    id: "ambition_indices",
    order: 5,
    title: loc("Ambición: índices y brecha", "Ambition: indices and gap"),
    decision: loc("Dónde está la empresa de verdad en el mapa de ambición.", "Where the company actually sits on the ambition map."),
    why: loc(
      "Los índices contrastan lo que la empresa dice ser con cómo reparte sus ventas y sus activos. Es habitual que una empresa que se llama global resulte ser un exportador.",
      "The indices test what the company claims to be against how it spreads its sales and assets. A company that calls itself global often turns out to be an exporter."
    ),
    example: {
      text: loc(
        "Air Liquide reparte sus ventas casi como el mercado mundial del gas industrial, pero concentra el 60% de sus activos en América: alto GRI y GCI claramente menor.",
        "Air Liquide spreads its sales almost like the world industrial-gas market, but concentrates 60% of its assets in the Americas: high GRI and a clearly lower GCI."
      ),
      source: "Learning assignment 1, p. 220",
    },
    quality: [
      loc("La demanda de la industria sale de la Tabla 5.2 o de una fuente citada", "Industry demand comes from Table 5.2 or from a cited source"),
      loc("Ventas y activos entran por regiones, en cualquier unidad", "Sales and assets are entered by region, in any unit"),
      loc("Si el rol declarado no coincide con el observado, la contradicción se resuelve", "If the declared role does not match the observed one, the contradiction is resolved"),
    ],
    target: "ambition",
    subTab: "ambition",
    needs: [{ from: "brief", what: loc("la industria, para poder comparar contra la demanda mundial del sector", "the industry, to compare against world demand in that sector") }],
    bring: [
      { what: loc("Ventas de la compañía por región", "Company sales by region"), origin: "company", where: loc("Control de gestión. Es el dato que más tarda en llegar: pídalo el primer día.", "Management accounting. It is the slowest figure to arrive: ask for it on day one.") },
      { what: loc("Activos y personal por región", "Assets and people by region"), origin: "company", where: loc("Cuentas consolidadas y recursos humanos.", "Consolidated accounts and human resources.") },
      { what: loc("Reparto de la demanda mundial de la industria por región", "How world demand for the industry splits by region"), origin: "public_source", where: loc("La tabla del libro sirve de referencia; una asociación sectorial da la cifra actual.", "The table in the book works as a reference; a trade association gives the current figure.") },
    ],
  },
  {
    id: "positioning",
    order: 6,
    title: loc("Posicionamiento y curva de valor", "Positioning and value curve"),
    decision: loc("Con qué propuesta de valor se compite y en qué se separa de los demás.", "Which value proposition competes here and how it differs from the rest."),
    why: loc(
      "Las tres dimensiones dan una de las ocho posiciones del libro, y esa posición dicta qué capacidades hacen falta. La curva de valor comprueba que la propuesta se distingue de algo.",
      "The three dimensions yield one of the book's eight positions, and that position dictates which capabilities are needed. The value curve checks that the proposition differs from something."
    ),
    example: {
      text: loc(
        "Yellow Tail entró en Estados Unidos eliminando el lenguaje enológico, reduciendo la gama a dos vinos, subiendo la accesibilidad del precio y creando distribución en supermercado.",
        "Yellow Tail entered the United States by eliminating wine jargon, cutting the range to two wines, raising price accessibility and creating supermarket distribution."
      ),
      source: "Example 5.3, p. 195",
    },
    quality: [
      loc("Hay al menos un competidor en la curva: sin comparación no hay curva", "There is at least one competitor on the curve: without comparison there is no curve"),
      loc("La curva propuesta se separa de la del competidor más cercano", "The proposed curve diverges from the closest competitor's"),
      loc("La rejilla ERRC sale sola de las dos curvas; si sale vacía, no hay propuesta nueva", "The ERRC grid follows from the two curves; if it comes out empty, there is no new proposition"),
    ],
    target: "ambition",
    subTab: "positioning",
    needs: [{ from: "brief", what: loc("la propuesta de valor, que es lo que la curva compara", "the value proposition, which is what the curve compares") }],
    bring: [
      { what: loc("Quiénes son los competidores relevantes y en qué se les compara", "Who the relevant competitors are and on what they are compared"), origin: "field_research", where: loc("Los atributos los eligen los clientes, no el catálogo. Si no ha hablado con ninguno, la curva es una hipótesis y conviene decirlo.", "Customers choose the attributes, not the catalogue. If you have spoken to none, the curve is a hypothesis and should be labelled as one.") },
    ],
  },
  {
    id: "value_chain",
    order: 7,
    title: loc("Cadena de valor y qué hay que crear", "Value chain and what must be created"),
    decision: loc("Qué actividades se gestionan global, regional o localmente, y qué capacidades no viajan.", "Which activities are run globally, regionally or locally, and which capabilities do not travel."),
    why: loc(
      "Aquí sale la lista de lo que hay que construir o conseguir de un socio en el país de destino. Esa lista es la entrada de la decisión de entrada y de la de socio.",
      "This is where the list of what must be built or obtained from a partner comes from. That list feeds both the entry decision and the partner decision."
    ),
    example: {
      text: loc(
        "En la distribución masiva, el procesamiento electrónico de datos se transfiere sin cambios, casi toda competencia se adapta al comportamiento local, y los activos físicos y la marca hay que crearlos en el sitio.",
        "In mass retailing, electronic data processing transfers unchanged, nearly every competency adapts to local behaviour, and physical assets and the brand have to be created on the spot."
      ),
      source: "Fig. 5.14, p. 199",
    },
    quality: [
      loc("Las seis funciones tienen nivel actual y nivel objetivo", "All six functions have a current and a target level"),
      loc("Ninguna capacidad queda sin etiquetar como transferir, adaptar o crear", "No capability is left untagged as transfer, adapt or create"),
      loc("Lo etiquetado «crear» es concreto: «red de almacenes», no «capacidades logísticas»", "What is tagged \u201ccreate\u201d is concrete: \u201cwarehouse network\u201d, not \u201clogistics capabilities\u201d"),
    ],
    target: "ambition",
    subTab: "positioning",
    needs: [{ from: "positioning", what: loc("la ventaja declarada, que decide qué funciones deben integrarse", "the declared advantage, which decides which functions must be integrated") }],
    bring: [
      { what: loc("Dónde se gestiona hoy cada función y dónde debería gestionarse", "Where each function is managed today and where it should be"), origin: "company", where: loc("Operaciones y los responsables de cada función. Es una conversación, no un dato.", "Operations and the function owners. It is a conversation, not a figure.") },
    ],
  },
  {
    id: "countries",
    order: 8,
    title: loc("Universo de países y cribado", "Country universe and screening"),
    decision: loc("Qué mercados entran en la comparación y cuáles quedan fuera desde el principio.", "Which markets enter the comparison and which are out from the start."),
    why: loc(
      "Comparar doce países mal es peor que comparar tres bien. El cribado por tamaño y crecimiento deja fuera lo que no merece el trabajo de evaluar.",
      "Comparing twelve countries badly is worse than comparing three well. Screening by size and growth removes what does not deserve the work of assessment."
    ),
    example: {
      text: loc(
        "En automoción, Japón, Corea y China son países clave en Asia; en pulpa y papel lo es Indonesia por sus recursos; para los jugadores de internet, California. La condición de «clave» es específica de cada industria.",
        "In automotive, Japan, Korea and China are key countries in Asia; in pulp and paper it is Indonesia, for its resources; for internet players, California. Being \u201ckey\u201d is industry-specific."
      ),
      source: "pp. 187-188",
    },
    quality: [
      loc("Cada país tiene un rol asignado: clave, emergente, plataforma, de mercado o de aprovisionamiento", "Each country has a role: key, emerging, platform, marketing or sourcing"),
      loc("Los indicadores públicos se han descargado y los huecos están declarados", "Public indicators have been fetched and the gaps are declared"),
    ],
    target: "screen",
    needs: [
      { from: "ambition_motives", what: loc("el rol que debe jugar la geografía, que acota el universo", "the role geography should play, which bounds the universe") },
      { from: "ambition_indices", what: loc("la brecha entre el rol declarado y el que miden los índices, que dice en qué regiones hay que moverse", "the gap between the declared role and the one the indices measure, which says which regions to move in") },
    ],
    bring: [
      { what: loc("La lista de países que merece la pena mirar", "The list of countries worth looking at"), origin: "judgement", where: loc("El catálogo descarga solo el PIB, la IED, el impuesto y el tipo de cambio; lo que no descarga es la razón por la que ese país está en la lista.", "The catalogue downloads GDP, FDI, tax and exchange rate on its own; what it does not download is the reason that country is on the list.") },
      { what: loc("Los umbrales de preselección y las exclusiones", "The screening thresholds and the exclusions"), origin: "group_decision", where: loc("Un país excluido por política del grupo se excluye aquí y queda escrito, en lugar de desaparecer sin motivo.", "A country excluded by group policy is excluded here and written down, instead of vanishing without a reason.") },
    ],
  },
  {
    id: "assessment",
    order: 9,
    title: loc("Evaluar cada país con el capítulo 6", "Assess each country with chapter 6"),
    decision: loc("Cuán atractivo y cuán arriesgado es cada mercado, dimensión por dimensión.", "How attractive and how risky each market is, dimension by dimension."),
    why: loc(
      "Es el bloque más largo y el que sostiene todo lo demás. Un país evaluado a ojo contamina la comparación, el caso económico y la decisión final.",
      "It is the longest block and the one everything else rests on. A country assessed by eye contaminates the comparison, the business case and the final decision."
    ),
    example: {
      text: loc(
        "El caso de Izmir Industrial Electric evalúa un mercado con su tamaño, su crecimiento, la estructura competitiva y el riesgo país, y llega a una recomendación distinta de la intuitiva.",
        "The Izmir Industrial Electric case assesses a market through size, growth, competitive structure and country risk, and reaches a recommendation other than the intuitive one."
      ),
      source: "Table 6.7 and mini-case 6.2, pp. 249-251",
    },
    quality: [
      loc("Cada juicio lleva la fuente u observación que lo sostiene", "Every judgement carries the source or observation behind it"),
      loc("Los ítems sin evidencia se dejan sin contestar en lugar de rellenarse por simetría", "Items without evidence are left unanswered rather than filled in for symmetry"),
      loc("La confianza que muestra la herramienta refleja la evidencia real, no el número de deslizadores movidos", "The confidence shown reflects real evidence, not how many sliders were moved"),
    ],
    target: "calibrate",
    needs: [
      { from: "countries", what: loc("al menos un país que pase el filtro", "at least one country past the screen") },
      { from: "material", what: loc("evidencia aceptada con la que sostener las puntuaciones", "accepted evidence to support the scores") },
    ],
    bring: [
      { what: loc("Lo que el material del caso dice de cada bloque", "What the case material says about each block"), origin: "case_material", where: loc("El copiloto extrae afirmaciones con su cita; lo que no traiga cita no llega hasta aquí.", "The copilot extracts claims with their quote; anything without a quote does not reach this point.") },
      { what: loc("Lo que no está en ningún documento: competencia local, canal, trato del regulador", "What is in no document: local competition, channel, how the regulator behaves"), origin: "field_research", where: loc("Asesor local, distribuidor, alguien que ya opere allí. Es donde se gana o se pierde el análisis.", "A local adviser, a distributor, somebody already operating there. This is where the analysis is won or lost.") },
    ],
  },
  {
    id: "entry",
    order: 10,
    title: loc("Estrategia de entrada: cuándo y cómo", "Entry strategy: when and how"),
    decision: loc("En qué fase está la ventana, qué posición se toma ante el momento y con qué modo se entra.", "Which phase the window is in, what stance is taken on timing and which mode is used."),
    why: loc(
      "El modo no se elige por preferencia sino por la combinación de fase, riesgo, requisitos del gobierno y capacidades. Un modo fuera de fase es la forma más cara de equivocarse.",
      "The mode is not chosen by preference but by the combination of phase, risk, government requirements and capabilities. A mode out of phase is the most expensive way to be wrong."
    ),
    example: {
      text: loc(
        "IKEA esperó desde 2006 hasta 2018 para abrir en India: la norma exigía empresa conjunta con un máximo del 50%, y su política era filial propia. Entró cuando el gobierno permitió el 100%.",
        "IKEA waited from 2006 to 2018 to open in India: the rules required a joint venture capped at 50%, and its policy was wholly owned subsidiaries. It entered when the government allowed 100%."
      ),
      source: "Example 7.1, pp. 258-259",
    },
    quality: [
      loc("La fase de la ventana se sostiene en evidencia de crecimiento y competencia, no en impresión", "The window phase rests on evidence of growth and competition, not on impression"),
      loc("Los seis factores de ritmo están contestados", "All six pace factors are answered"),
      loc("Si el modo elegido queda fuera de lo que sugiere el mapa, se explica por qué", "If the chosen mode falls outside what the mapping suggests, the reason is stated"),
    ],
    target: "ambition",
    subTab: "entry",
    needs: [
      { from: "assessment", what: loc("el atractivo y el riesgo del país, que condicionan el modo", "the attractiveness and risk of the country, which condition the mode") },
      { from: "value_chain", what: loc("qué capacidades se transfieren, se adaptan o se crean", "which capabilities are transferred, adapted or created") },
    ],
    bring: [
      { what: loc("En qué fase del ciclo está el mercado y quién ha entrado ya", "What stage of the cycle the market is in and who has already entered"), origin: "field_research", where: loc("Prensa sectorial, registros mercantiles y quien esté sobre el terreno.", "Trade press, company registries and whoever is on the ground.") },
      { what: loc("Qué exige el regulador para operar", "What the regulator requires in order to operate"), origin: "public_source", where: loc("El supervisor del país publica los requisitos; en sector regulado esto poda los modos antes de empezar.", "The country's supervisor publishes the requirements; in a regulated sector this prunes the modes before anything starts.") },
    ],
  },
  {
    id: "partnering",
    order: 11,
    title: loc("Vía de acceso y socio", "Access route and partner"),
    decision: loc("Si lo que falta se construye, se alquila o se compra, y con quién.", "Whether what is missing is built, borrowed or bought, and with whom."),
    why: loc(
      "La mayoría de las entradas fallan aquí y no en el análisis de mercado. El encaje más débil con el socio hunde la alianza por bueno que sea el resto.",
      "Most entries fail here rather than in the market analysis. The weakest fit with the partner sinks the alliance however good the rest is."
    ),
    example: {
      text: loc(
        "Aliarse con un competidor da acceso a mercado, activos y personas, pero expone a la copia y a la fuga tecnológica. Aliarse con un inversor da capital y cumplimiento legal, y ningún apoyo operativo.",
        "Allying with a competitor gives access to market, assets and people, but exposes you to copying and technological leakage. Allying with an investor gives capital and legal compliance, and no operational support."
      ),
      source: "Table 7.3, p. 267",
    },
    quality: [
      loc("Cada capacidad a conseguir pasa por los cuatro ejes del árbol", "Every capability to obtain goes through the four axes of the tree"),
      loc("Las cuatro pruebas de encaje están puntuadas y con evidencia", "The four fit tests are scored and evidenced"),
      loc("Si hay inversión preliminar, la opción tiene señales con umbral y dos salidas", "If there is a preliminary investment, the option has signals with thresholds and two exits"),
    ],
    target: "ambition",
    subTab: "partnering",
    needs: [
      { from: "entry", what: loc("el modo elegido: si no exige socio, este paso no aplica", "the chosen mode: if it needs no partner, this step does not apply") },
      { from: "value_chain", what: loc("qué capacidad falta, que es lo que se va a construir, alquilar o comprar", "which capability is missing, which is what gets built, borrowed or bought") },
    ],
    bring: [
      { what: loc("Quién podría ser el socio y qué se sabe de cómo se comporta", "Who the partner might be and what is known about how they behave"), origin: "field_research", where: loc("Referencias de terceros que hayan trabajado con ellos. Una alianza cae por el encaje más débil, no por la media.", "References from third parties who have worked with them. An alliance fails on the weakest fit, not on the average.") },
      { what: loc("Qué prima se está dispuesto a pagar por mantener abierta la opción", "What premium you are willing to pay to keep the option open"), origin: "group_decision", where: loc("Es una decisión de la casa sobre cuánto vale esperar, no un cálculo.", "It is a decision by the company about what waiting is worth, not a calculation.") },
    ],
  },
  {
    id: "economics",
    order: 12,
    title: loc("Caso económico y decisión", "Business case and decision"),
    decision: loc("Cuánto vale cada alternativa y cuál se recomienda, con sus condiciones.", "What each alternative is worth and which one is recommended, with its conditions."),
    why: loc(
      "Es donde el análisis se convierte en una cifra defendible y en una recomendación con puertas de revisión. Sin esto, todo lo anterior es una descripción.",
      "This is where the analysis becomes a defensible figure and a recommendation with review gates. Without it, everything before is a description."
    ),
    example: {
      text: loc(
        "Lubricador SA compara greenfield, comprar al competidor japonés, empresa conjunta al 50% y licencia, con un coste de capital del 15%. Las cuatro dan cifras muy distintas y ninguna domina en todo.",
        "Lubricador SA compares greenfield, buying the Japanese competitor, a 50% joint venture and licensing, at a 15% cost of capital. The four give very different figures and none dominates on everything."
      ),
      source: "Mini-case 7.3, pp. 275-276",
    },
    quality: [
      loc("Los supuestos económicos están completos para al menos un país", "The financial assumptions are complete for at least one country"),
      loc("Se ha generado la evaluación y se han leído las alertas", "The evaluation has been generated and the alerts read"),
      loc("La alternativa preferida tiene una puerta de decisión con responsable y fecha", "The preferred alternative has a decision gate with an owner and a date"),
    ],
    target: "finance",
    needs: [
      { from: "assessment", what: loc("los países evaluados, que son los que entran en la comparación", "the assessed countries, which are the ones that enter the comparison") },
      { from: "entry", what: loc("el modo preferido, que decide qué alternativa se modela primero", "the preferred mode, which decides which alternative is modelled first") },
      { from: "partnering", what: loc("la vía de acceso elegida —construir, alquilar o comprar—, que cambia la inversión que carga la alternativa", "the chosen access route \u2014build, borrow or buy\u2014 which changes the investment the alternative carries") },
    ],
    bring: [
      { what: loc("Tamaño del mercado y cuota alcanzable, o los drivers del negocio si usa la cuenta por líneas", "Market size and reachable share, or the business drivers if you use the P&L by line"), origin: "field_research", where: loc("Asociación sectorial, informe de mercado o el propio caso. Es el número que más se discute y el que peor se documenta.", "A trade association, a market report or the case itself. It is the most argued-over figure and the worst documented.") },
      { what: loc("Inversión inicial y coste operativo por alternativa", "Initial investment and operating cost by alternative"), origin: "company", where: loc("Ingeniería, operaciones y quien haya montado algo parecido en otro país.", "Engineering, operations and whoever has built something similar in another country.") },
      { what: loc("Tasa de descuento y umbral de retorno", "Discount rate and return threshold"), origin: "group_decision", where: loc("Finanzas corporativas los tiene fijados. Usar otros obliga a explicar por qué.", "Corporate finance has them set. Using different ones means explaining why.") },
      { what: loc("Impuesto corporativo y tipo de cambio", "Corporate tax and exchange rate"), origin: "public_source", where: loc("Se descargan al actualizar el mercado, y siguen siendo editables.", "They download when the market is refreshed, and they stay editable.") },
    ],
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
  confirmations: RouteConfirmations;
};

/**
 * `ready` es el estado que faltaba: el paso cumple sus condiciones pero nadie lo ha dado por
 * bueno todavía. Avanzar solo porque un contador llegó al final quita al analista la
 * decisión de decidir, que es lo único que esta herramienta no debería automatizar.
 */
export type StepStatus = "done" | "skipped" | "ready" | "in_progress" | "pending";

/** Lo que el analista ha confirmado o ha decidido saltarse, guardado con el caso. */
export type RouteConfirmations = { confirmed: StepId[]; skipped: StepId[] };

export function emptyConfirmations(): RouteConfirmations {
  return { confirmed: [], skipped: [] };
}

export type StepState = {
  step: GuidedStep;
  status: StepStatus;
  /** Las condiciones del paso se cumplen, con independencia de que se haya confirmado. */
  gateMet: boolean;
  /** Qué falta exactamente para darlo por hecho. */
  missing: Localized[];
  /** Progreso 0-1 cuando el paso lo tiene medido. */
  progress: number | null;
  /**
   * Dependencias que todavía no están satisfechas, comprobadas contra el estado real del
   * caso. No bloquean: se puede trabajar fuera de orden, y a veces hay que hacerlo. Lo que
   * no se puede es hacerlo sin enterarse.
   */
  blockedBy: { step: GuidedStep; what: Localized }[];
  /** Dependencias satisfechas, para poder decir sobre qué se apoya este paso. */
  restsOn: { step: GuidedStep; what: Localized }[];
  /** Qué pasos posteriores esperan algo de este. Se deriva invirtiendo las dependencias. */
  unlocks: { step: GuidedStep; what: Localized }[];
};

export type RouteState = {
  steps: StepState[];
  /** El paso en el que hay que trabajar ahora. Null cuando está todo hecho. */
  current: StepState | null;
  doneCount: number;
  /** Pasos que el analista decidió dejar atrás sin completar. */
  skippedCount: number;
  total: number;
};

function fromModule(progress: ModuleProgress | null, label: Localized): { done: boolean; missing: Localized[]; ratio: number | null } {
  if (!progress) return { done: false, missing: [loc(`${label.es} sin empezar`, `${label.en} not started`)], ratio: null };
  return {
    done: progress.complete,
    missing: progress.complete ? [] : [loc(`${progress.answered} de ${progress.total} apartados contestados`, `${progress.answered} of ${progress.total} sections answered`)],
    ratio: progress.total ? progress.answered / progress.total : null,
  };
}

/** Evalúa la ruta entera. Función pura: la misma entrada da siempre el mismo camino. */
export function evaluateRoute(snapshot: RouteSnapshot): RouteState {
  const states: StepState[] = GUIDED_STEPS.map((step) => {
    let done = false;
    let missing: Localized[] = [];
    let progress: number | null = null;

    switch (step.id) {
      case "case":
        done = snapshot.caseId !== null && snapshot.hasDecisionQuestion;
        if (snapshot.caseId === null) missing.push(loc("Crear o seleccionar un caso", "Create or select a case"));
        else if (!snapshot.hasDecisionQuestion) missing.push(loc("Escribir el mandato: qué hay que decidir", "Write the mandate: what has to be decided"));
        break;
      case "material":
        done = snapshot.documentCount > 0 && snapshot.acceptedEvidenceCount > 0;
        if (!snapshot.documentCount) missing.push(loc("Cargar al menos un documento o pegar el texto del caso", "Load at least one document or paste the case text"));
        else if (!snapshot.acceptedEvidenceCount) missing.push(loc("Aceptar al menos una evidencia", "Accept at least one piece of evidence"));
        break;
      case "brief":
        done = snapshot.briefComplete;
        if (!done) missing.push(loc("Completar empresa, país de origen, industria, modelo de negocio y objetivo", "Complete company, home country, industry, business model and objective"));
        break;
      case "ambition_motives": {
        const module = fromModule(snapshot.ambition, loc("Ambición", "Ambition"));
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "ambition_indices":
        done = snapshot.ambitionIndicesReady;
        if (!done) missing.push(loc("Introducir demanda de la industria, ventas y activos por regiones", "Enter industry demand, sales and assets by region"));
        break;
      case "positioning": {
        const module = fromModule(snapshot.positioning, loc("Posicionamiento", "Positioning"));
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "value_chain":
        done = snapshot.valueChainReady;
        if (!done) missing.push(loc("Completar la matriz de configuración y etiquetar las capacidades como transferir, adaptar o crear", "Complete the configuration matrix and tag capabilities as transfer, adapt or create"));
        break;
      case "countries":
        done = snapshot.screenedCount > 0;
        if (!snapshot.candidateCount) missing.push(loc("Añadir al menos un país candidato", "Add at least one candidate country"));
        else if (!snapshot.screenedCount) missing.push(loc("El filtro deja fuera a todos los candidatos: revíselo", "The screen excludes every candidate: review it"));
        break;
      case "assessment":
        done = snapshot.assessedCountries > 0 && snapshot.assessedCountries >= snapshot.screenedCount;
        if (!snapshot.assessedCountries) missing.push(loc("Evaluar al menos un país con el marco del capítulo 6", "Assess at least one country with the chapter 6 framework"));
        else if (snapshot.assessedCountries < snapshot.screenedCount) missing.push(loc(`Quedan ${snapshot.screenedCount - snapshot.assessedCountries} país(es) sin evaluar`, `${snapshot.screenedCount - snapshot.assessedCountries} country(ies) still unassessed`));
        progress = snapshot.screenedCount ? Math.min(1, snapshot.assessedCountries / snapshot.screenedCount) : null;
        break;
      case "entry": {
        const module = fromModule(snapshot.entry, loc("Estrategia de entrada", "Entry strategy"));
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "partnering": {
        const module = fromModule(snapshot.partnering, loc("Vía de acceso y socio", "Access route and partner"));
        done = module.done;
        missing = module.missing;
        progress = module.ratio;
        break;
      }
      case "economics":
        done = snapshot.financialReady && snapshot.hasResult && snapshot.approvalCount > 0;
        if (!snapshot.financialReady) missing.push(loc("Completar los supuestos económicos de al menos un país", "Complete the financial assumptions for at least one country"));
        else if (!snapshot.hasResult) missing.push(loc("Generar la evaluación", "Generate the evaluation"));
        else if (!snapshot.approvalCount) missing.push(loc("Abrir una puerta de decisión para la alternativa preferida", "Open a decision gate for the preferred alternative"));
        break;
    }

    const confirmed = snapshot.confirmations.confirmed.includes(step.id);
    const skipped = snapshot.confirmations.skipped.includes(step.id);
    const status: StepStatus = confirmed ? "done" : skipped ? "skipped" : "pending";
    return { step, status, gateMet: done, missing, progress, blockedBy: [], restsOn: [], unlocks: [] };
  });

  /**
   * Las dependencias se resuelven en una segunda pasada porque un paso necesita saber si el
   * anterior está hecho, y eso no se sabe hasta haberlos recorrido todos.
   *
   * Un paso saltado cuenta como no satisfecho. Saltarlo fue una decisión legítima, pero lo
   * que dependía de él sigue dependiendo, y fingir lo contrario sería exactamente la clase
   * de silencio que esta herramienta existe para evitar.
   */
  const byId = new Map(states.map((state) => [state.step.id, state]));
  const satisfied = (stepId: StepId) => {
    const state = byId.get(stepId);
    return Boolean(state && (state.status === "done" || state.gateMet));
  };

  for (const state of states) {
    for (const need of state.step.needs) {
      const source = byId.get(need.from);
      if (!source) continue;
      const entry = { step: source.step, what: need.what };
      if (satisfied(need.from)) state.restsOn.push(entry);
      else state.blockedBy.push(entry);
      source.unlocks.push({ step: state.step, what: need.what });
    }
  }

  // El paso actual es el primero que nadie ha resuelto: ni confirmado ni saltado. No se
  // bloquea nada, se puede trabajar fuera de orden, y la ruta refleja lo que queda.
  const currentIndex = states.findIndex((state) => state.status === "pending");
  if (currentIndex >= 0) states[currentIndex].status = states[currentIndex].gateMet ? "ready" : "in_progress";

  return {
    steps: states,
    current: currentIndex >= 0 ? states[currentIndex] : null,
    doneCount: states.filter((state) => state.status === "done").length,
    skippedCount: states.filter((state) => state.status === "skipped").length,
    total: states.length,
  };
}
