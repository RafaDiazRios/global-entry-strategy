/**
 * Marcos del capítulo 6 «Assessing countries' attractiveness» expresados como datos.
 *
 * Philippe Lasserre y Felipe Monteiro, *Global Strategic Management*, 5.ª ed.
 * (Bloomsbury Academic, 2023), pp. 226-256.
 *
 * Cada bloque es una lista de ítems con su ancla baja y alta, de modo que la interfaz
 * se genera a partir de esta definición y el motor puntúa recorriéndola. Añadir una
 * dimensión es añadir una entrada aquí, no tocar cinco ficheros.
 *
 * Escala común: 0-4. La lectura de cada extremo la fija el propio ítem, porque no
 * significa lo mismo un 4 en «distancia cultural» que un 4 en «calidad de la demanda».
 * Un ítem sin evaluar es `null`, no 0: no evaluado y nulo son cosas distintas.
 *
 * Bilingüe: cada etiqueta, ayuda y ancla lleva su par `{ es, en }` junto a la definición
 * del ítem. El inglés no es una traducción del español: es el término del original.
 */

import { loc, type Localized } from "../i18n";

export type AssessmentValue = number | null;

export type AssessmentItem = {
  key: string;
  label: Localized;
  /** Qué hay que mirar. Redactado como la pregunta que resuelve el ítem. */
  help: Localized;
  /** Lectura del 0. */
  anchorLow: Localized;
  /** Lectura del 4. */
  anchorHigh: Localized;
};

export type AssessmentGroup = {
  key: string;
  label: Localized;
  /** Referencia del libro de la que sale el grupo. */
  source: Localized;
  intro: Localized;
  items: AssessmentItem[];
};

export type AssessmentBlockKey = "market" | "resources" | "industry" | "cage" | "risk";

export type AssessmentBlock = {
  key: AssessmentBlockKey;
  label: Localized;
  source: Localized;
  intro: Localized;
  /** Dirección de la escala: `favourable` = 4 es bueno; `adverse` = 4 es malo. */
  direction: "favourable" | "adverse";
  groups: AssessmentGroup[];
};

export const assessmentScaleMax = 4;

// ---------------------------------------------------------------------------
// 1. Oportunidades de mercado — Figura 6.3 (p. 229) y Tabla 6.1 (p. 231)
// ---------------------------------------------------------------------------

const marketBlock: AssessmentBlock = {
  key: "market",
  label: loc("Oportunidades de mercado", "Market opportunities"),
  source: loc(
    "Figura 6.3, p. 229; Tabla 6.1, p. 231; Tabla 6.2, p. 234",
    "Figure 6.3, p. 229; Table 6.1, p. 231; Table 6.2, p. 234"
  ),
  intro: loc(
    "Mide la demanda potencial del país para la oferta de la empresa. El libro la descompone en tamaño, crecimiento y calidad de la demanda, y advierte de que la calidad depende de la segmentación predominante y de la curva de valor de cada segmento, no del PIB.",
    "Measures the country's potential demand for the firm's offer. The book breaks it into size, growth and quality of demand, and warns that quality depends on the prevailing segmentation and on each segment's value curve, not on GDP."
  ),
  direction: "favourable",
  groups: [
    {
      key: "demand",
      label: loc("Demanda", "Demand"),
      source: loc("Figura 6.3, p. 229", "Figure 6.3, p. 229"),
      intro: loc(
        "Las tres variables con las que el libro evalúa una oportunidad de mercado.",
        "The three variables the book uses to assess a market opportunity."
      ),
      items: [
        {
          key: "size",
          label: loc("Tamaño del mercado servible", "Size of the serviceable market"),
          help: loc(
            "¿Cuánta demanda existe hoy para esta categoría, no para el PIB del país?",
            "How much demand exists today for this category, not for the country's GDP?"
          ),
          anchorLow: loc("Marginal para la escala mínima del negocio", "Marginal against the business's minimum scale"),
          anchorHigh: loc("Entre los mercados relevantes del sector a escala mundial", "Among the sector's relevant markets worldwide"),
        },
        {
          key: "growth",
          label: loc("Crecimiento esperado", "Expected growth"),
          help: loc(
            "¿Qué ritmo sostiene la categoría en el horizonte de la decisión?",
            "What pace does the category sustain over the decision horizon?"
          ),
          anchorLow: loc("Estancado o en contracción", "Flat or contracting"),
          anchorHigh: loc("Crecimiento muy por encima de la media del sector", "Growth well above the sector average"),
        },
        {
          key: "quality",
          label: loc("Calidad de la demanda", "Quality of demand"),
          help: loc(
            "¿La segmentación y la curva de valor del cliente encajan con la propuesta de la empresa, o exigen otra oferta?",
            "Do the segmentation and the customer's value curve fit the firm's proposition, or do they call for a different offer?"
          ),
          anchorLow: loc("Solo compite el precio; la propuesta no tiene dónde apoyarse", "Only price competes; the proposition has nothing to stand on"),
          anchorHigh: loc("Segmentos que valoran y pagan los atributos en los que la empresa es fuerte", "Segments that value and pay for the attributes the firm is strong in"),
        },
      ],
    },
    {
      key: "segmentation",
      label: loc("Segmentación y accesibilidad", "Segmentation and accessibility"),
      source: loc("Figura 6.8, p. 233; Tabla 6.2, p. 234", "Figure 6.8, p. 233; Table 6.2, p. 234"),
      intro: loc(
        "Cómo está partido el mercado y hasta dónde llega realmente la empresa.",
        "How the market is split and how far the firm actually reaches."
      ),
      items: [
        {
          key: "targetSegmentDepth",
          label: loc("Profundidad del segmento objetivo", "Depth of the target segment"),
          help: loc(
            "¿El segmento al que apunta la empresa tiene masa suficiente, o es una franja estrecha entre un enorme mercado de bajo precio y una élite minúscula?",
            "Does the segment the firm targets have enough mass, or is it a narrow band between a huge low-price market and a tiny elite?"
          ),
          anchorLow: loc("Franja estrecha sin masa crítica", "A narrow band with no critical mass"),
          anchorHigh: loc("Segmento amplio y consolidado", "A broad, established segment"),
        },
        {
          key: "middleClassMomentum",
          label: loc("Dinámica de clase media", "Middle-class momentum"),
          help: loc(
            "¿La renta está cruzando el umbral que dispara el consumo de esta categoría? El efecto es no lineal por lo sesgado de la distribución de renta.",
            "Is income crossing the threshold that triggers consumption of this category? The effect is non-linear because income distribution is skewed."
          ),
          anchorLow: loc("Sin movimiento por encima del umbral", "No movement above the threshold"),
          anchorHigh: loc("Ampliación rápida del segmento por encima del umbral", "The segment above the threshold is widening fast"),
        },
        {
          key: "distributionAccess",
          label: loc("Acceso a distribución", "Access to distribution"),
          help: loc(
            "¿Existe un canal capaz de llevar la oferta al segmento, o hay que construirlo?",
            "Is there a channel able to take the offer to the segment, or does one have to be built?"
          ),
          anchorLow: loc("Sin canal viable; habría que crearlo entero", "No viable channel; it would have to be built from scratch"),
          anchorHigh: loc("Canal maduro y accesible en condiciones normales", "A mature channel, accessible on normal terms"),
        },
        {
          key: "willingnessToPay",
          label: loc("Disposición a pagar", "Willingness to pay"),
          help: loc(
            "¿El precio que exige el modelo de la empresa es alcanzable para el segmento objetivo?",
            "Is the price the firm's model requires reachable for the target segment?"
          ),
          anchorLow: loc("Muy por encima de lo que el segmento paga", "Well above what the segment pays"),
          anchorHigh: loc("Dentro del rango habitual del segmento", "Within the segment's usual range"),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Oportunidades de recursos — pp. 234-238
// ---------------------------------------------------------------------------

const resourcesBlock: AssessmentBlock = {
  key: "resources",
  label: loc("Oportunidades de recursos", "Resource opportunities"),
  source: loc(
    "Figura 6.3, p. 229; pp. 234-238; Figura 6.10, p. 236; Tabla 6.3, pp. 237-238",
    "Figure 6.3, p. 229; pp. 234-238; Figure 6.10, p. 236; Table 6.3, pp. 237-238"
  ),
  intro: loc(
    "El libro separa recursos naturales, humanos y de infraestructura e industrias de soporte, y añade la localización como recurso propio cuando convierte al país en hub regional.",
    "The book separates natural, human and infrastructure resources and supporting industries, and adds location as a resource in its own right when it turns the country into a regional hub."
  ),
  direction: "favourable",
  groups: [
    {
      key: "natural",
      label: loc("Recursos naturales y localización", "Natural resources and location"),
      source: loc("pp. 234-236", "pp. 234-236"),
      intro: loc("Dotación física y ventaja locacional.", "Physical endowment and locational advantage."),
      items: [
        {
          key: "rawMaterials",
          label: loc("Materias primas", "Raw materials"),
          help: loc(
            "¿El país es una fuente crítica de los insumos del negocio?",
            "Is the country a critical source of the business's inputs?"
          ),
          anchorLow: loc("Sin relevancia como fuente", "Not relevant as a source"),
          anchorHigh: loc("Fuente crítica a escala mundial", "A critical source worldwide"),
        },
        {
          key: "location",
          label: loc("Ventaja locacional", "Locational advantage"),
          help: loc(
            "¿La posición geográfica, combinada con infraestructura y servicios, lo convierte en hub o centro regional?",
            "Does its geography, combined with infrastructure and services, make it a hub or a regional centre?"
          ),
          anchorLow: loc("Periférico para la red de la empresa", "Peripheral to the firm's network"),
          anchorHigh: loc("Hub natural para la región", "A natural hub for the region"),
        },
      ],
    },
    {
      key: "human",
      label: loc("Recursos humanos", "Human resources"),
      source: loc("Figura 6.10, p. 236", "Figure 6.10, p. 236"),
      intro: loc(
        "Los dos atributos que el libro considera atractivos son la cualificación de la fuerza de trabajo y el coste unitario, entendido como la relación entre retribución y productividad, no como salario nominal.",
        "The two attributes the book treats as attractive are the skill level of the workforce and unit cost, understood as the ratio of pay to productivity, not as nominal wages."
      ),
      items: [
        {
          key: "skills",
          label: loc("Cualificación disponible", "Available skills"),
          help: loc(
            "¿Hay perfiles con la formación que el negocio necesita, y en qué volumen?",
            "Are there people with the training the business needs, and in what numbers?"
          ),
          anchorLow: loc("Escasez severa de los perfiles clave", "Severe shortage of the key profiles"),
          anchorHigh: loc("Abundancia de perfiles cualificados", "An abundance of qualified people"),
        },
        {
          key: "payProductivity",
          label: loc("Retribución frente a productividad", "Pay against productivity"),
          help: loc(
            "¿El coste unitario resultante es competitivo? Retribución alta con productividad baja es coste unitario alto.",
            "Is the resulting unit cost competitive? High pay with low productivity means high unit cost."
          ),
          anchorLow: loc("Coste unitario claramente desfavorable", "Clearly unfavourable unit cost"),
          anchorHigh: loc("Coste unitario claramente favorable", "Clearly favourable unit cost"),
        },
        {
          key: "labourAvailability",
          label: loc("Disponibilidad y rotación", "Availability and turnover"),
          help: loc(
            "¿Se puede contratar y retener al ritmo que exige el plan?",
            "Can you hire and retain at the pace the plan requires?"
          ),
          anchorLow: loc("Rotación o escasez que compromete la operación", "Turnover or scarcity that puts the operation at risk"),
          anchorHigh: loc("Mercado laboral holgado y estable", "A loose, stable labour market"),
        },
      ],
    },
    {
      key: "infrastructure",
      label: loc("Infraestructura e industrias de soporte", "Infrastructure and supporting industries"),
      source: loc("Tabla 6.3, pp. 237-238", "Table 6.3, pp. 237-238"),
      intro: loc(
        "Calidad del transporte, la energía, las telecomunicaciones y la red de proveedores y servicios locales.",
        "Quality of transport, energy, telecommunications and the network of local suppliers and services."
      ),
      items: [
        {
          key: "transport",
          label: loc("Transporte y logística", "Transport and logistics"),
          help: loc(
            "¿Carreteras, puertos y transporte aéreo sostienen el modelo de operación?",
            "Do roads, ports and air transport support the operating model?"
          ),
          anchorLow: loc("Inviable sin inversión propia", "Unworkable without investing yourself"),
          anchorHigh: loc("Entre los mejores de su región", "Among the best in its region"),
        },
        {
          key: "utilities",
          label: loc("Energía y servicios básicos", "Energy and utilities"),
          help: loc(
            "¿El suministro es fiable para el tipo de operación previsto?",
            "Is supply reliable for the kind of operation planned?"
          ),
          anchorLow: loc("Cortes o déficit estructural", "Outages or a structural deficit"),
          anchorHigh: loc("Fiable y de calidad", "Reliable and of good quality"),
        },
        {
          key: "digital",
          label: loc("Adopción digital y telecomunicaciones", "Digital adoption and telecommunications"),
          help: loc(
            "¿La conectividad soporta el modelo comercial y operativo?",
            "Does connectivity support the commercial and operating model?"
          ),
          anchorLow: loc("Penetración y calidad insuficientes", "Insufficient penetration and quality"),
          anchorHigh: loc("Infraestructura digital avanzada", "Advanced digital infrastructure"),
        },
        {
          key: "supportingIndustries",
          label: loc("Proveedores e industrias de soporte", "Suppliers and supporting industries"),
          help: loc(
            "¿Existe un pool de proveedores cualificados y clusters relacionados?",
            "Is there a pool of qualified suppliers and related clusters?"
          ),
          anchorLow: loc("Sin tejido de proveedores utilizable", "No usable supplier base"),
          anchorHigh: loc("Cluster desarrollado y competitivo", "A developed, competitive cluster"),
        },
        {
          key: "technology",
          label: loc("Innovación y conocimiento", "Innovation and knowledge"),
          help: loc(
            "¿Estar presente da acceso a tecnología, investigación o aprendizaje que la empresa no tiene?",
            "Does being present give access to technology, research or learning the firm does not have?"
          ),
          anchorLow: loc("Nada que aprender aquí", "Nothing to learn here"),
          anchorHigh: loc("Centro de referencia mundial en la disciplina", "A world reference centre in the discipline"),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Contexto competitivo — Tabla 6.4 (pp. 238-239) y country diamond (p. 239)
// ---------------------------------------------------------------------------

const industryBlock: AssessmentBlock = {
  key: "industry",
  label: loc("Contexto competitivo y de industria", "Competitive and industry context"),
  source: loc(
    "Tabla 6.4, pp. 238-239; country diamond, p. 239; Tabla 6.5, pp. 241-242",
    "Table 6.4, pp. 238-239; country diamond, p. 239; Table 6.5, pp. 241-242"
  ),
  intro: loc(
    "Las cinco fuerzas de Porter con la sexta que añaden los autores —la política gubernamental— leídas con los determinantes propios de una entrada internacional. Aquí se puntúa la presión que ejerce cada fuerza: 4 es una fuerza intensa, es decir, un contexto desfavorable.",
    "Porter's five forces plus the sixth the authors add —government policy— read with the determinants specific to an international entry. What is scored here is the pressure each force exerts: 4 is an intense force, that is, an unfavourable context."
  ),
  direction: "adverse",
  groups: [
    {
      key: "forces",
      label: loc("Fuerzas competitivas", "Competitive forces"),
      source: loc("Tabla 6.4, pp. 238-239", "Table 6.4, pp. 238-239"),
      intro: loc(
        "Cada ítem se puntúa por la presión que ejerce sobre la rentabilidad de un entrante.",
        "Each item is scored by the pressure it puts on an entrant's profitability."
      ),
      items: [
        {
          key: "rivalry",
          label: loc("Intensidad de la rivalidad", "Intensity of rivalry"),
          help: loc(
            "¿Hay sobrecapacidad y falta de diferenciación? La rivalidad se agudiza cuando el crecimiento se frena y la ventana se cierra.",
            "Is there overcapacity and a lack of differentiation? Rivalry sharpens when growth slows and the window closes."
          ),
          anchorLow: loc("Competencia contenida y racional", "Contained, rational competition"),
          anchorHigh: loc("Guerra de precios con sobrecapacidad", "A price war with overcapacity"),
        },
        {
          key: "entryBarriers",
          label: loc("Barreras de entrada", "Barriers to entry"),
          help: loc(
            "Redes de distribución, localizaciones, posición de los incumbentes, especificidades culturales y política de licencias, que puede elevarlas de forma artificial.",
            "Distribution networks, locations, incumbents' positions, cultural specifics and licensing policy, which can raise them artificially."
          ),
          anchorLow: loc("Entrada practicable con recursos normales", "Entry practicable with normal resources"),
          anchorHigh: loc("Barreras que hacen la entrada muy costosa o inviable", "Barriers that make entry very costly or unworkable"),
        },
        {
          key: "supplierPower",
          label: loc("Poder de los proveedores", "Supplier power"),
          help: loc(
            "Mayor en economías protegidas con monopolios estatales de materias primas, con escasez de mano de obra cualificada o con política de contenido local.",
            "Higher in protected economies with state raw-material monopolies, with shortages of skilled labour or with local-content policies."
          ),
          anchorLow: loc("Oferta amplia y sustituible", "Broad, substitutable supply"),
          anchorHigh: loc("Proveedores capaces de imponer precio y condiciones", "Suppliers able to dictate price and terms"),
        },
        {
          key: "buyerPower",
          label: loc("Poder de los compradores", "Buyer power"),
          help: loc(
            "Más fuerte donde las redes de distribución están fuertemente controladas.",
            "Stronger where distribution networks are tightly controlled."
          ),
          anchorLow: loc("Clientes atomizados con costes de cambio", "Fragmented customers with switching costs"),
          anchorHigh: loc("Compradores capaces de bloquear cualquier subida", "Buyers able to block any increase"),
        },
        {
          key: "substitutes",
          label: loc("Sustitutos", "Substitutes"),
          help: loc(
            "Nuevas tecnologías o modelos de negocio, incluidos los de competidores globales que llegan con una propuesta disruptiva.",
            "New technologies or business models, including those of global competitors arriving with a disruptive proposition."
          ),
          anchorLow: loc("Sin alternativa creíble a la vista", "No credible alternative in sight"),
          anchorHigh: loc("Sustitución en curso que erosiona la categoría", "Substitution under way, eroding the category"),
        },
        {
          key: "governmentPolicy",
          label: loc("Política gubernamental", "Government policy"),
          help: loc(
            "Sexta fuerza añadida por los autores: restricciones especiales al inversor extranjero, trato preferente a incumbentes, control de precios y fiscalidad.",
            "The sixth force the authors add: special restrictions on foreign investors, preferential treatment of incumbents, price control and taxation."
          ),
          anchorLow: loc("Marco neutral o favorable al entrante", "A neutral or entrant-friendly framework"),
          anchorHigh: loc("Barreras artificiales dirigidas al inversor extranjero", "Artificial barriers aimed at the foreign investor"),
        },
      ],
    },
    {
      key: "diamond",
      label: loc("Diamante del país", "Country diamond"),
      source: loc("p. 239 (Porter 1998)", "p. 239 (Porter 1998)"),
      intro: loc(
        "Los cuatro motores de la ventaja competitiva nacional. Aquí se puntúa la debilidad del diamante, para mantener la lectura del bloque: 4 es un diamante pobre.",
        "The four drivers of national competitive advantage. What is scored here is the weakness of the diamond, to keep the block's reading consistent: 4 is a poor diamond."
      ),
      items: [
        {
          key: "endowmentGap",
          label: loc("Dotación de factores", "Factor endowment"),
          help: loc(
            "Recursos naturales, humanos, de capital, físicos, tecnológicos y científicos disponibles para competir aquí.",
            "Natural, human, capital, physical, technological and scientific resources available to compete here."
          ),
          anchorLow: loc("Dotación excelente", "Excellent endowment"),
          anchorHigh: loc("Dotación pobre para esta industria", "Poor endowment for this industry"),
        },
        {
          key: "demandSophisticationGap",
          label: loc("Exigencia de la demanda", "Demand sophistication"),
          help: loc(
            "¿Los clientes locales son exigentes en calidad y empujan la competitividad de quien les sirve?",
            "Are local customers demanding on quality, pushing the competitiveness of whoever serves them?"
          ),
          anchorLow: loc("Demanda muy exigente y sofisticada", "Highly demanding, sophisticated demand"),
          anchorHigh: loc("Demanda poco exigente", "Undemanding demand"),
        },
        {
          key: "rivalryStimulusGap",
          label: loc("Estímulo de la rivalidad", "Stimulus from rivalry"),
          help: loc(
            "¿La competencia local estimula la mejora, o es un mercado adormecido o protegido?",
            "Does local competition drive improvement, or is the market sleepy or protected?"
          ),
          anchorLow: loc("Competencia vigorosa que eleva el nivel", "Vigorous competition that raises the bar"),
          anchorHigh: loc("Sin estímulo competitivo", "No competitive stimulus"),
        },
        {
          key: "clusterGap",
          label: loc("Industrias de soporte y clusters", "Supporting industries and clusters"),
          help: loc(
            "¿Existe un cluster de proveedores y empresas exitosas del que aprovecharse?",
            "Is there a cluster of suppliers and successful firms to draw on?"
          ),
          anchorLow: loc("Cluster maduro y accesible", "A mature, accessible cluster"),
          anchorHigh: loc("Sin tejido de soporte", "No supporting fabric"),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Distancia CAGE — Figura 6.11 (p. 243)
// ---------------------------------------------------------------------------

const cageBlock: AssessmentBlock = {
  key: "cage",
  label: loc("Distancia CAGE", "CAGE distance"),
  source: loc("Figura 6.11, p. 243 (Ghemawat 2007)", "Figure 6.11, p. 243 (Ghemawat 2007)"),
  intro: loc(
    "Distancia bilateral entre el país de origen de la empresa y el mercado evaluado. Se puntúa la distancia: 4 es máxima diferencia. Dos países con la misma media y perfiles opuestos exigen respuestas distintas, así que la herramienta muestra el perfil, no solo el promedio.",
    "Bilateral distance between the firm's home country and the market being assessed. What is scored is the distance: 4 is maximum difference. Two countries with the same average and opposite profiles call for different answers, so the tool shows the profile, not only the average."
  ),
  direction: "adverse",
  groups: [
    {
      key: "cultural",
      label: loc("Cultural", "Cultural"),
      source: loc("Figura 6.11, p. 243", "Figure 6.11, p. 243"),
      intro: loc(
        "Diferencias que afectan a la comunicación, la confianza y la forma de hacer negocio.",
        "Differences that affect communication, trust and the way business is done."
      ),
      items: [
        {
          key: "language",
          label: loc("Idioma", "Language"),
          help: loc(
            "¿Se puede operar y vender en una lengua que la empresa domina?",
            "Can you operate and sell in a language the firm commands?"
          ),
          anchorLow: loc("Lengua común", "A shared language"),
          anchorHigh: loc("Sin lengua compartida ni en la operación ni en el mercado", "No shared language, in the operation or in the market"),
        },
        {
          key: "ethnicComposition",
          label: loc("Composición étnica", "Ethnic composition"),
          help: loc(
            "¿La diversidad étnica del país cambia la segmentación o la gestión de personas?",
            "Does the country's ethnic diversity change segmentation or people management?"
          ),
          anchorLow: loc("Composición próxima a la de origen", "Composition close to the home country's"),
          anchorHigh: loc("Composición muy distinta con implicaciones operativas", "Very different composition, with operating implications"),
        },
        {
          key: "religion",
          label: loc("Religión", "Religion"),
          help: loc(
            "¿Hay prácticas religiosas que condicionen producto, calendario o consumo?",
            "Are there religious practices that shape product, calendar or consumption?"
          ),
          anchorLow: loc("Sin implicaciones", "No implications"),
          anchorHigh: loc("Condiciona producto, calendario y consumo", "It shapes product, calendar and consumption"),
        },
        {
          key: "values",
          label: loc("Valores", "Values"),
          help: loc(
            "Jerarquía, relación con el tiempo, individualismo y colectivismo, actitud ante el conflicto.",
            "Hierarchy, relationship with time, individualism and collectivism, attitude to conflict."
          ),
          anchorLow: loc("Valores muy próximos", "Very close values"),
          anchorHigh: loc("Valores opuestos en dimensiones que afectan a la gestión", "Opposing values on dimensions that affect management"),
        },
        {
          key: "trust",
          label: loc("Base de la confianza", "Basis of trust"),
          help: loc(
            "¿La confianza se construye sobre el contrato, sobre la relación personal o sobre la pertenencia a una red?",
            "Is trust built on the contract, on the personal relationship or on belonging to a network?"
          ),
          anchorLow: loc("Misma base de confianza", "The same basis of trust"),
          anchorHigh: loc("Base de confianza radicalmente distinta", "A radically different basis of trust"),
        },
      ],
    },
    {
      key: "administrative",
      label: loc("Administrativa", "Administrative"),
      source: loc("Figura 6.11, p. 243", "Figure 6.11, p. 243"),
      intro: loc("Vínculos institucionales y marco legal y político.", "Institutional ties and the legal and political framework."),
      items: [
        {
          key: "regionalBloc",
          label: loc("Bloque regional", "Regional bloc"),
          help: loc(
            "¿Comparten pertenencia a un bloque de integración económica?",
            "Do they share membership of an economic integration bloc?"
          ),
          anchorLow: loc("Mismo bloque, con libre circulación", "The same bloc, with free movement"),
          anchorHigh: loc("Sin acuerdo, con aranceles y trámites plenos", "No agreement, with full tariffs and formalities"),
        },
        {
          key: "colonialTies",
          label: loc("Vínculos históricos", "Historical ties"),
          help: loc(
            "¿Existen lazos poscoloniales o históricos que faciliten el trato?",
            "Are there post-colonial or historical ties that ease dealings?"
          ),
          anchorLow: loc("Vínculos históricos estrechos", "Close historical ties"),
          anchorHigh: loc("Sin vínculo, o con historia adversa", "No tie, or an adverse history"),
        },
        {
          key: "currency",
          label: loc("Moneda", "Currency"),
          help: loc(
            "¿Comparten moneda o hay exposición y controles de cambio?",
            "Do they share a currency, or is there exposure and exchange control?"
          ),
          anchorLow: loc("Misma moneda", "The same currency"),
          anchorHigh: loc("Moneda distinta con controles de cambio", "A different currency with exchange controls"),
        },
        {
          key: "legalFramework",
          label: loc("Marco legal", "Legal framework"),
          help: loc(
            "¿La tradición jurídica y la aplicación de contratos se parecen a las de origen?",
            "Do the legal tradition and contract enforcement resemble those at home?"
          ),
          anchorLow: loc("Misma tradición jurídica y aplicación previsible", "The same legal tradition and predictable enforcement"),
          anchorHigh: loc("Tradición distinta con aplicación incierta", "A different tradition with uncertain enforcement"),
        },
        {
          key: "politicalSystem",
          label: loc("Sistema político", "Political system"),
          help: loc(
            "¿La relación entre Estado y empresa se parece a la del país de origen?",
            "Does the relationship between state and business resemble the home country's?"
          ),
          anchorLow: loc("Sistema equivalente", "An equivalent system"),
          anchorHigh: loc("Sistema muy distinto con intervención directa", "A very different system with direct intervention"),
        },
      ],
    },
    {
      key: "geographic",
      label: loc("Geográfica", "Geographic"),
      source: loc("Figura 6.11, p. 243", "Figure 6.11, p. 243"),
      intro: loc("Distancia física y sus consecuencias operativas.", "Physical distance and its operating consequences."),
      items: [
        {
          key: "physical",
          label: loc("Distancia física", "Physical distance"),
          help: loc(
            "¿Cuánto pesa el transporte y el desplazamiento de personas en el modelo?",
            "How much do transport and the movement of people weigh in the model?"
          ),
          anchorLow: loc("Contigüidad o proximidad", "Contiguity or proximity"),
          anchorHigh: loc("Distancia que condiciona costes y gestión", "Distance that shapes costs and management"),
        },
        {
          key: "climate",
          label: loc("Clima", "Climate"),
          help: loc(
            "¿Obliga a adaptar producto, empaquetado, almacenamiento u operación?",
            "Does it force adaptation of product, packaging, storage or operation?"
          ),
          anchorLow: loc("Clima equivalente", "An equivalent climate"),
          anchorHigh: loc("Clima que obliga a rediseñar producto u operación", "A climate that forces redesign of product or operation"),
        },
        {
          key: "timeZone",
          label: loc("Huso horario", "Time zone"),
          help: loc(
            "¿Queda solapamiento de jornada para coordinar con la matriz?",
            "Is there overlapping working time to coordinate with head office?"
          ),
          anchorLow: loc("Mismo huso o solapamiento amplio", "The same zone or wide overlap"),
          anchorHigh: loc("Sin solapamiento de jornada", "No overlap in the working day"),
        },
        {
          key: "seaAccess",
          label: loc("Acceso al mar y a la red logística", "Sea access and logistics network"),
          help: loc(
            "¿El país tiene salida marítima y conexión a las rutas que usa la empresa?",
            "Does the country have sea access and a connection to the routes the firm uses?"
          ),
          anchorLow: loc("Puertos propios en las rutas principales", "Its own ports on the main routes"),
          anchorHigh: loc("Interior sin salida, dependiente de terceros", "Landlocked, dependent on third countries"),
        },
      ],
    },
    {
      key: "economic",
      label: loc("Económica", "Economic"),
      source: loc("Figura 6.11, p. 243", "Figure 6.11, p. 243"),
      intro: loc(
        "Diferencias de desarrollo, estructura e infraestructura económica.",
        "Differences in development, structure and economic infrastructure."
      ),
      items: [
        {
          key: "naturalResources",
          label: loc("Recursos naturales", "Natural resources"),
          help: loc(
            "¿La estructura de dotación es distinta hasta el punto de cambiar la economía del negocio?",
            "Is the endowment structure different enough to change the economics of the business?"
          ),
          anchorLow: loc("Estructura equivalente", "An equivalent structure"),
          anchorHigh: loc("Estructura opuesta", "An opposite structure"),
        },
        {
          key: "infrastructure",
          label: loc("Infraestructura", "Infrastructure"),
          help: loc(
            "¿El nivel de infraestructura obliga a otro modelo operativo?",
            "Does the level of infrastructure force a different operating model?"
          ),
          anchorLow: loc("Nivel equivalente", "An equivalent level"),
          anchorHigh: loc("Nivel que exige rediseñar la operación", "A level that requires redesigning the operation"),
        },
        {
          key: "information",
          label: loc("Información de mercado", "Market information"),
          help: loc(
            "¿Hay datos fiables de mercado, clientes y competencia?",
            "Is there reliable data on market, customers and competition?"
          ),
          anchorLow: loc("Información equivalente a la de origen", "Information equivalent to the home country's"),
          anchorHigh: loc("Opacidad que impide medir el mercado", "Opacity that makes the market unmeasurable"),
        },
        {
          key: "financialSystem",
          label: loc("Sistema financiero", "Financial system"),
          help: loc(
            "¿Se puede financiar, cobrar y repatriar en condiciones comparables?",
            "Can you finance, collect and repatriate on comparable terms?"
          ),
          anchorLow: loc("Sistema equivalente", "An equivalent system"),
          anchorHigh: loc("Sistema que restringe financiación o cobro", "A system that restricts financing or collection"),
        },
        {
          key: "incomeDistribution",
          label: loc("Distribución de la renta", "Income distribution"),
          help: loc(
            "¿La forma de la distribución cambia la segmentación respecto al mercado de origen?",
            "Does the shape of the distribution change segmentation relative to the home market?"
          ),
          anchorLow: loc("Distribución comparable", "A comparable distribution"),
          anchorHigh: loc("Distribución muy sesgada frente a la de origen", "A distribution far more skewed than at home"),
        },
        {
          key: "publicPrivate",
          label: loc("Peso público y privado", "Public and private weight"),
          help: loc(
            "¿Cuánta actividad está en manos del Estado o de grupos vinculados a él?",
            "How much activity is in the hands of the state or groups tied to it?"
          ),
          anchorLow: loc("Equilibrio equivalente", "An equivalent balance"),
          anchorHigh: loc("Sector dominado por actores públicos o afines", "A sector dominated by public or aligned players"),
        },
        {
          key: "knowledgeInfrastructure",
          label: loc("Infraestructura de conocimiento", "Knowledge infrastructure"),
          help: loc(
            "Universidades, centros de investigación y formación técnica disponibles.",
            "Universities, research centres and technical training available."
          ),
          anchorLow: loc("Nivel equivalente", "An equivalent level"),
          anchorHigh: loc("Déficit que obliga a formar desde cero", "A deficit that means training from scratch"),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 5. Riesgo país — Figura 6.12 (p. 244)
// ---------------------------------------------------------------------------

const riskBlock: AssessmentBlock = {
  key: "risk",
  label: loc("Riesgo país", "Country risk"),
  source: loc("Figura 6.12, p. 244; Figura 6.13, p. 245", "Figure 6.12, p. 244; Figure 6.13, p. 245"),
  intro: loc(
    "Probabilidad de que circunstancias adversas de origen político, económico o social afecten al desempeño. El libro separa dentro del riesgo político tres exposiciones distintas —accionista, empleado y operación— porque no se cubren con los mismos instrumentos.",
    "The likelihood that adverse political, economic or social circumstances affect performance. Within political risk the book separates three distinct exposures —shareholder, employee and operation— because they are not covered by the same instruments."
  ),
  direction: "adverse",
  groups: [
    {
      key: "politicalShareholder",
      label: loc("Riesgo político · exposición del accionista", "Political risk · shareholder exposure"),
      source: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
      intro: loc("Pérdida de capital o imposibilidad de repatriarlo.", "Loss of capital, or the inability to repatriate it."),
      items: [
        {
          key: "assetDestruction",
          label: loc("Destrucción de activos", "Asset destruction"),
          help: loc(
            "Guerra, disturbios o conflicto civil que destruyan instalaciones.",
            "War, riots or civil conflict that destroy facilities."
          ),
          anchorLow: loc("Improbable en el horizonte", "Unlikely within the horizon"),
          anchorHigh: loc("Riesgo material y presente", "A material, present risk"),
        },
        {
          key: "assetSpoliation",
          label: loc("Expropiación", "Expropriation"),
          help: loc(
            "Nacionalización, confiscación o expropiación encubierta.",
            "Nationalization, confiscation or creeping expropriation."
          ),
          anchorLow: loc("Sin precedentes ni señales", "No precedent and no signals"),
          anchorHigh: loc("Precedentes recientes en el sector", "Recent precedents in the sector"),
        },
        {
          key: "assetInflexibility",
          label: loc("Bloqueo de fondos", "Blocked funds"),
          help: loc(
            "Restricción a la transferencia de capital o congelación de dividendos.",
            "Restrictions on capital transfer or frozen dividends."
          ),
          anchorLow: loc("Libre transferencia", "Free transfer"),
          anchorHigh: loc("Controles activos sobre la repatriación", "Active controls on repatriation"),
        },
      ],
    },
    {
      key: "politicalEmployee",
      label: loc("Riesgo político · exposición del empleado", "Political risk · employee exposure"),
      source: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
      intro: loc(
        "Seguridad de las personas destacadas y contratadas localmente.",
        "Safety of people posted there and hired locally."
      ),
      items: [
        {
          key: "kidnapping",
          label: loc("Secuestro", "Kidnapping"),
          help: loc(
            "¿Hay riesgo real para expatriados o directivos locales?",
            "Is there real risk to expatriates or local managers?"
          ),
          anchorLow: loc("Sin riesgo apreciable", "No appreciable risk"),
          anchorHigh: loc("Riesgo que exige protocolo de seguridad", "Risk that requires a security protocol"),
        },
        {
          key: "gangsterism",
          label: loc("Criminalidad organizada", "Organized crime"),
          help: loc(
            "Presencia de crimen organizado que afecte a la operación o al personal.",
            "A presence of organized crime affecting the operation or its people."
          ),
          anchorLow: loc("Sin presencia relevante", "No relevant presence"),
          anchorHigh: loc("Presencia que condiciona la operación", "A presence that shapes the operation"),
        },
        {
          key: "harassment",
          label: loc("Acoso administrativo o policial", "Administrative or police harassment"),
          help: loc(
            "Hostigamiento a empresas extranjeras o a su personal.",
            "Harassment of foreign firms or their staff."
          ),
          anchorLow: loc("Sin casos conocidos", "No known cases"),
          anchorHigh: loc("Práctica habitual documentada", "A documented, routine practice"),
        },
      ],
    },
    {
      key: "politicalOperational",
      label: loc("Riesgo político · exposición de la operación", "Political risk · operational exposure"),
      source: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
      intro: loc(
        "Interrupciones de la actividad por causas políticas o sociales.",
        "Interruptions to activity from political or social causes."
      ),
      items: [
        {
          key: "marketDisruption",
          label: loc("Disrupción de mercado", "Market disruption"),
          help: loc(
            "Cierres, boicots o cambios abruptos de reglas que corten la actividad comercial.",
            "Closures, boycotts or abrupt rule changes that cut off commercial activity."
          ),
          anchorLow: loc("Improbable", "Unlikely"),
          anchorHigh: loc("Recurrente", "Recurrent"),
        },
        {
          key: "labourUnrest",
          label: loc("Conflictividad laboral", "Labour unrest"),
          help: loc(
            "Huelgas y conflicto sindical con capacidad de parar la operación.",
            "Strikes and union conflict able to halt the operation."
          ),
          anchorLow: loc("Relaciones laborales estables", "Stable labour relations"),
          anchorHigh: loc("Conflictividad alta y frecuente", "High, frequent unrest"),
        },
        {
          key: "racketeering",
          label: loc("Extorsión", "Racketeering"),
          help: loc(
            "Pagos forzados a actores privados o públicos para poder operar.",
            "Forced payments to private or public actors in order to operate."
          ),
          anchorLow: loc("Inexistente", "Non-existent"),
          anchorHigh: loc("Condición de facto para operar", "A de facto condition of operating"),
        },
        {
          key: "suppliesShortage",
          label: loc("Escasez de suministros", "Supply shortages"),
          help: loc(
            "Interrupciones de insumos por causa política, aduanera o criminal.",
            "Input interruptions from political, customs or criminal causes."
          ),
          anchorLow: loc("Cadena estable", "A stable chain"),
          anchorHigh: loc("Interrupciones frecuentes", "Frequent interruptions"),
        },
      ],
    },
    {
      key: "economic",
      label: loc("Riesgo económico", "Economic risk"),
      source: loc("Figura 6.12, p. 244; Figura 6.13, p. 245", "Figure 6.12, p. 244; Figure 6.13, p. 245"),
      intro: loc(
        "Variabilidad de los motores económicos del negocio. El libro mide la volatilidad con el coeficiente de variación del crecimiento: dos países con el mismo crecimiento medio y distinta dispersión no tienen el mismo riesgo.",
        "Variability in the economic drivers of the business. The book measures volatility with the coefficient of variation of growth: two countries with the same average growth and different dispersion do not carry the same risk."
      ),
      items: [
        {
          key: "growth",
          label: loc("Nivel de crecimiento", "Level of growth"),
          help: loc(
            "¿El crecimiento sostiene el plan o lo pone en riesgo?",
            "Does growth support the plan or put it at risk?"
          ),
          anchorLow: loc("Crecimiento sólido y sostenido", "Solid, sustained growth"),
          anchorHigh: loc("Contracción o estancamiento", "Contraction or stagnation"),
        },
        {
          key: "variability",
          label: loc("Variabilidad del crecimiento", "Variability of growth"),
          help: loc(
            "Dispersión histórica del crecimiento, medida como desviación típica sobre media.",
            "Historical dispersion of growth, measured as standard deviation over the mean."
          ),
          anchorLow: loc("Serie muy estable", "A very stable series"),
          anchorHigh: loc("Serie muy volátil", "A very volatile series"),
        },
        {
          key: "inflation",
          label: loc("Inflación", "Inflation"),
          help: loc(
            "¿Erosiona precios, costes y cobros dentro del horizonte?",
            "Does it erode prices, costs and collections within the horizon?"
          ),
          anchorLow: loc("Contenida y previsible", "Contained and predictable"),
          anchorHigh: loc("Alta o descontrolada", "High or out of control"),
        },
        {
          key: "inputCosts",
          label: loc("Coste de los insumos", "Input costs"),
          help: loc(
            "Exposición a variaciones de energía, materias primas o salarios.",
            "Exposure to swings in energy, raw materials or wages."
          ),
          anchorLow: loc("Estable y cubrible", "Stable and hedgeable"),
          anchorHigh: loc("Volátil y no cubrible", "Volatile and not hedgeable"),
        },
        {
          key: "exchangeRate",
          label: loc("Tipo de cambio", "Exchange rate"),
          help: loc(
            "Exposición de la divisa local frente a la moneda de reporte.",
            "Exposure of the local currency against the reporting currency."
          ),
          anchorLow: loc("Estable o vinculada", "Stable or pegged"),
          anchorHigh: loc("Volátil, con riesgo de devaluación brusca", "Volatile, with the risk of abrupt devaluation"),
        },
      ],
    },
    {
      key: "competitive",
      label: loc("Riesgo competitivo", "Competitive risk"),
      source: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
      intro: loc(
        "Distorsión no económica del contexto competitivo. Perjudica especialmente a quien basa su ventaja en calidad de producto y economía de la operación.",
        "Non-economic distortion of the competitive context. It hurts most those whose advantage rests on product quality and operating economics."
      ),
      items: [
        {
          key: "corruption",
          label: loc("Corrupción", "Corruption"),
          help: loc(
            "¿El acceso a clientes, licencias o contratos depende de pagos irregulares?",
            "Does access to customers, licences or contracts depend on irregular payments?"
          ),
          anchorLow: loc("Sin incidencia en la actividad", "No bearing on the activity"),
          anchorHigh: loc("Condición práctica para competir", "A practical condition of competing"),
        },
        {
          key: "cartels",
          label: loc("Cárteles", "Cartels"),
          help: loc(
            "Acuerdos entre incumbentes que cierran el mercado a un entrante.",
            "Agreements among incumbents that close the market to an entrant."
          ),
          anchorLow: loc("Mercado abierto", "An open market"),
          anchorHigh: loc("Reparto establecido entre incumbentes", "An established carve-up among incumbents"),
        },
        {
          key: "networks",
          label: loc("Redes y lógicas dominantes", "Networks and dominant logics"),
          help: loc(
            "Grupos familiares o empresariales cuya pertenencia determina el acceso al negocio.",
            "Family or business groups whose membership determines access to business."
          ),
          anchorLow: loc("Acceso por mérito comercial", "Access on commercial merit"),
          anchorHigh: loc("Acceso determinado por la red", "Access determined by the network"),
        },
      ],
    },
    {
      key: "operational",
      label: loc("Riesgo operativo", "Operational risk"),
      source: loc("Figura 6.12, p. 244", "Figure 6.12, p. 244"),
      intro: loc(
        "Afectan directamente a la cuenta de resultados, por regulación costosa o por infraestructura poco fiable.",
        "These hit the income statement directly, through costly regulation or unreliable infrastructure."
      ),
      items: [
        {
          key: "infrastructureReliability",
          label: loc("Fiabilidad de la infraestructura", "Infrastructure reliability"),
          help: loc(
            "Energía, telecomunicaciones y transporte en el día a día de la operación.",
            "Energy, telecommunications and transport in the day-to-day of the operation."
          ),
          anchorLow: loc("Fiable", "Reliable"),
          anchorHigh: loc("Interrupciones que exigen redundancia propia", "Interruptions that require your own redundancy"),
        },
        {
          key: "supplierReliability",
          label: loc("Fiabilidad de los proveedores", "Supplier reliability"),
          help: loc(
            "¿Cumplen plazo y calidad de forma sostenida?",
            "Do they meet deadlines and quality consistently?"
          ),
          anchorLow: loc("Cumplimiento comparable al de origen", "Compliance comparable to the home country's"),
          anchorHigh: loc("Incumplimiento estructural", "Structural non-compliance"),
        },
        {
          key: "nationalisticPreferences",
          label: loc("Preferencias nacionalistas", "Nationalistic preferences"),
          help: loc(
            "Trato preferente a empresas locales en compras públicas o privadas.",
            "Preferential treatment of local firms in public or private procurement."
          ),
          anchorLow: loc("Trato equivalente", "Equivalent treatment"),
          anchorHigh: loc("Preferencia sistemática al operador local", "Systematic preference for the local operator"),
        },
        {
          key: "localContent",
          label: loc("Restricciones de contenido, capital o empleo local", "Local content, ownership or employment restrictions"),
          help: loc(
            "Obligaciones de contenido local, socio local o cuotas de empleo.",
            "Local-content obligations, a mandatory local partner or employment quotas."
          ),
          anchorLow: loc("Sin restricciones", "No restrictions"),
          anchorHigh: loc("Restricciones que condicionan el modelo", "Restrictions that shape the model"),
        },
        {
          key: "taxes",
          label: loc("Fiscalidad y burocracia", "Taxation and bureaucracy"),
          help: loc(
            "Carga fiscal y coste administrativo específico del inversor extranjero.",
            "Tax burden and administrative cost specific to the foreign investor."
          ),
          anchorLow: loc("Carga y trámites normales", "Normal burden and formalities"),
          anchorHigh: loc("Carga o burocracia que erosionan el caso", "A burden or bureaucracy that erodes the case"),
        },
      ],
    },
  ],
};

export const assessmentBlocks: readonly AssessmentBlock[] = [marketBlock, resourcesBlock, industryBlock, cageBlock, riskBlock];

export const assessmentBlockByKey = new Map(assessmentBlocks.map((block) => [block.key, block]));

/** Recorre todos los ítems de un bloque, aplanando los grupos. */
export function itemsOf(block: AssessmentBlock) {
  return block.groups.flatMap((group) => group.items.map((item) => ({ groupKey: group.key, ...item })));
}

/** Identificador estable de un ítem dentro de la evaluación: `bloque.grupo.item`. */
export function itemPath(blockKey: AssessmentBlockKey, groupKey: string, itemKey: string) {
  return `${blockKey}.${groupKey}.${itemKey}`;
}

// ---------------------------------------------------------------------------
// 6. Incentivos a la inversión — Tabla 6.5 (pp. 241-242)
// ---------------------------------------------------------------------------

export type IncentiveFamily = {
  key: string;
  label: Localized;
  instruments: { key: string; label: Localized }[];
};

export const incentiveFamilies: readonly IncentiveFamily[] = [
  {
    key: "tax",
    label: loc("Reducción fiscal", "Tax reduction"),
    instruments: [
      { key: "holiday", label: loc("Amnistía fiscal por período limitado", "Tax holiday for a limited period") },
      { key: "lossOffset", label: loc("Compensación de pérdidas contra beneficios posteriores", "Offsetting losses against later profits") },
      { key: "reducedRate", label: loc("Tipo impositivo reducido", "Reduced tax rate") },
      { key: "acceleratedDepreciation", label: loc("Amortización acelerada", "Accelerated depreciation") },
      { key: "socialContributions", label: loc("Reducción de cotizaciones sociales", "Reduced social security contributions") },
      { key: "specialDeductions", label: loc("Deducciones especiales por I+D o actividad social", "Special deductions for R&D or social activity") },
      { key: "propertyExemption", label: loc("Exención de impuestos sobre la propiedad", "Exemption from property taxes") },
      { key: "localContentRelief", label: loc("Reducción de base por contenido local o empleo", "Taxable-base relief for local content or employment") },
      { key: "expatriateRelief", label: loc("Exención o reducción de IRPF para personal expatriado", "Income-tax exemption or relief for expatriate staff") },
    ],
  },
  {
    key: "trade",
    label: loc("Importación y exportación", "Import and export"),
    instruments: [
      { key: "importDuty", label: loc("Exención de aranceles e IVA de importación de equipos y piezas", "Exemption from import duties and VAT on equipment and parts") },
      { key: "exportDuty", label: loc("Exención de derechos de exportación", "Exemption from export duties") },
      { key: "exportCredit", label: loc("Créditos fiscales sobre ventas domésticas por desempeño exportador", "Tax credits on domestic sales for export performance") },
    ],
  },
  {
    key: "financial",
    label: loc("Incentivos financieros", "Financial incentives"),
    instruments: [
      { key: "subsidies", label: loc("Subvenciones directas", "Direct subsidies") },
      { key: "sweetenerLoans", label: loc("Préstamos en condiciones preferentes", "Loans on preferential terms") },
      { key: "guaranteedLoans", label: loc("Préstamos garantizados", "Guaranteed loans") },
      { key: "exportCredits", label: loc("Créditos a la exportación", "Export credits") },
      { key: "equity", label: loc("Participación pública en el capital", "Public equity participation") },
      { key: "riskInsurance", label: loc("Seguros de riesgo de exportación o de cambio", "Export or exchange risk insurance") },
    ],
  },
  {
    key: "competitive",
    label: loc("Incentivos competitivos", "Competitive incentives"),
    instruments: [
      { key: "importProtection", label: loc("Protección frente a importaciones", "Protection against imports") },
      { key: "capacityRegulation", label: loc("Regulación de capacidad", "Capacity regulation") },
      { key: "monopolyPosition", label: loc("Posición monopolística", "Monopoly position") },
      { key: "preferentialProcurement", label: loc("Compras públicas preferentes", "Preferential public procurement") },
    ],
  },
  {
    key: "operational",
    label: loc("Incentivos operativos", "Operational incentives"),
    instruments: [
      { key: "preferentialTariffs", label: loc("Tarifas preferentes de suelo, alquiler, energía o telecomunicaciones", "Preferential rates for land, rent, energy or telecommunications") },
      { key: "marketStudies", label: loc("Asistencia en estudios de mercado", "Assistance with market studies") },
      { key: "publicServices", label: loc("Uso de servicios públicos o agencias para la operación", "Use of public services or agencies for the operation") },
      { key: "secondment", label: loc("Cesión de personal público", "Secondment of public staff") },
      { key: "trainingCentres", label: loc("Centros de formación", "Training centres") },
      { key: "infrastructureAccess", label: loc("Acceso a programas de infraestructura", "Access to infrastructure programmes") },
      { key: "sciencePark", label: loc("Acceso a parques científicos o partenariados público-privados", "Access to science parks or public-private partnerships") },
    ],
  },
] as const;

/**
 * Advertencia del libro (p. 242, Guisinger 1985, 1992): el papel de los incentivos es
 * limitado. Atractivo de mercado, condiciones competitivas y dotación de recursos pesan
 * más; los incentivos solo desempatan entre localizaciones comparables. Por eso su peso
 * por defecto en la puntuación de gobierno es bajo.
 */
export const incentiveWeightNote: Localized = loc(
  "Los incentivos solo desempatan entre localizaciones comparables: el libro concluye que su papel es limitado frente a mercado, competencia y recursos (p. 242).",
  "Incentives only break ties between comparable locations: the book concludes their role is limited next to market, competition and resources (p. 242)."
);

// ---------------------------------------------------------------------------
// 7. Cuestiones ambientales y sociales — p. 242
// ---------------------------------------------------------------------------

export const sustainabilityChecks: readonly { key: string; label: Localized }[] = [
  {
    key: "deforestation",
    label: loc(
      "¿El país tolera o fomenta la deforestación sin reforestación?",
      "Does the country tolerate or encourage deforestation without reforestation?"
    ),
  },
  {
    key: "childLabour",
    label: loc(
      "¿Existe trabajo infantil en la cadena de valor de la industria?",
      "Is there child labour in the industry's value chain?"
    ),
  },
  {
    key: "discrimination",
    label: loc(
      "¿Hay discriminación étnica o de género institucionalizada?",
      "Is there institutionalized ethnic or gender discrimination?"
    ),
  },
  {
    key: "pesticides",
    label: loc(
      "¿La agricultura de la que depende el negocio usa pesticidas de forma masiva?",
      "Does the agriculture the business depends on use pesticides massively?"
    ),
  },
  {
    key: "carbonIntensity",
    label: loc(
      "¿La generación eléctrica sigue basada en procesos intensivos en CO₂?",
      "Is power generation still based on CO₂-intensive processes?"
    ),
  },
] as const;

// ---------------------------------------------------------------------------
// 8. Clusters de ciclo de vida de país — Tabla 6.2 (p. 234)
// ---------------------------------------------------------------------------

export type LifeCycleCluster = "developing" | "emerging" | "fastIndustrializing" | "industrialized";

export const lifeCycleClusters: readonly {
  key: LifeCycleCluster;
  label: Localized;
  growth: Localized;
  size: Localized;
  segmentation: Localized;
  valueCurve: Localized;
  distribution: Localized;
  competition: Localized;
}[] = [
  {
    key: "developing",
    label: loc("En desarrollo", "Developing"),
    growth: loc("Bajo", "Low"),
    size: loc("Pequeño", "Small"),
    segmentation: loc(
      "Sector de subsistencia dominante; gran segmento de gama baja",
      "Dominant subsistence sector; large low-end segment"
    ),
    valueCurve: loc("Precio; disponibilidad", "Price; availability"),
    distribution: loc("Logística de empuje", "Push logistics"),
    competition: loc("Regulada", "Regulated"),
  },
  {
    key: "emerging",
    label: loc("Emergente", "Emerging"),
    growth: loc("Alto", "High"),
    size: loc("De pequeño a alto", "Small to high"),
    segmentation: loc(
      "Clase media en rápido crecimiento; gran segmento de gama baja",
      "Fast-growing middle class; large low-end segment"
    ),
    valueCurve: loc("Precio; distribución; publicidad incipiente", "Price; distribution; emerging advertising"),
    distribution: loc("Logística de empuje, con inicio de tracción", "Push logistics, with pull beginning"),
    competition: loc("Inicio de desregulación; nuevos entrantes", "Deregulation beginning; new entrants"),
  },
  {
    key: "fastIndustrializing",
    label: loc("Industrialización rápida", "Fast industrializing"),
    growth: loc("Alto", "High"),
    size: loc("De pequeño a alto", "Small to high"),
    segmentation: loc(
      "Clase media establecida; diversidad creciente de segmentos",
      "Established middle class; growing diversity of segments"
    ),
    valueCurve: loc("Funcionalidad; prestaciones; servicios", "Functionality; features; services"),
    distribution: loc("Tracción; inicio de la distribución masiva", "Pull; mass distribution beginning"),
    competition: loc("Mayoritariamente desregulada, activa y diversa", "Mostly deregulated, active and diverse"),
  },
  {
    key: "industrialized",
    label: loc("Industrializado (OCDE)", "Industrialized (OECD)"),
    growth: loc("Bajo", "Low"),
    size: loc("Alto", "High"),
    segmentation: loc(
      "Clase media establecida; segmentación diversa y sofisticada",
      "Established middle class; diverse, sophisticated segmentation"
    ),
    valueCurve: loc("Funcionalidad; prestaciones; servicios", "Functionality; features; services"),
    distribution: loc("Diversa; distribución masiva relevante", "Diverse; mass distribution relevant"),
    competition: loc("Desregulada, activa y diversa", "Deregulated, active and diverse"),
  },
] as const;

// ---------------------------------------------------------------------------
// 9. Perfiles estratégicos de país — Tabla 6.6 (p. 249)
// ---------------------------------------------------------------------------

export type CountryProfileKey = "hub" | "emergingGiant" | "fastIndustrializing" | "developing" | "oecd" | "resourceRich";

export type ProfileTrait = "L" | "M" | "H" | "M/L" | "M/H" | "Variable";

export const countryProfiles: readonly {
  key: CountryProfileKey;
  label: Localized;
  description: Localized;
  examples: Localized;
  traits: Record<"population" | "gdp" | "gdpPerCapita" | "infrastructure" | "skills" | "productivity" | "naturalResources" | "risk" | "easeOfDoingBusiness", ProfileTrait>;
}[] = [
  {
    key: "hub",
    label: loc("Hub", "Hub"),
    description: loc(
      "Punto de entrada y centro regional por localización, infraestructura y marco regulatorio.",
      "An entry point and regional centre by virtue of location, infrastructure and regulatory framework."
    ),
    examples: loc("Singapur, Hong Kong", "Singapore, Hong Kong"),
    traits: { population: "L", gdp: "L", gdpPerCapita: "H", infrastructure: "H", skills: "H", productivity: "H", naturalResources: "L", risk: "L", easeOfDoingBusiness: "H" },
  },
  {
    key: "emergingGiant",
    label: loc("Gigante emergente", "Emerging giant"),
    description: loc(
      "Alta importancia estratégica por tamaño absoluto del mercado.",
      "High strategic importance through the sheer size of the market."
    ),
    examples: loc("China, India", "China, India"),
    traits: { population: "H", gdp: "H", gdpPerCapita: "M/L", infrastructure: "M/L", skills: "M", productivity: "M/L", naturalResources: "L", risk: "M", easeOfDoingBusiness: "L" },
  },
  {
    key: "fastIndustrializing",
    label: loc("Industrialización rápida", "Fast industrializing"),
    description: loc(
      "Alto potencial de crecimiento con riqueza moderada.",
      "High growth potential with moderate wealth."
    ),
    examples: loc("Indonesia, Malasia, Tailandia", "Indonesia, Malaysia, Thailand"),
    traits: { population: "M/H", gdp: "M", gdpPerCapita: "M/L", infrastructure: "M/L", skills: "M/L", productivity: "M/L", naturalResources: "M/H", risk: "M", easeOfDoingBusiness: "M/L" },
  },
  {
    key: "developing",
    label: loc("En desarrollo", "Developing"),
    description: loc(
      "Renta baja y crecimiento limitado; oportunidad selectiva.",
      "Low income and limited growth; a selective opportunity."
    ),
    examples: loc("Filipinas, Vietnam, Camboya", "Philippines, Vietnam, Cambodia"),
    traits: { population: "M/H", gdp: "M/L", gdpPerCapita: "L", infrastructure: "M/L", skills: "L", productivity: "L", naturalResources: "M/H", risk: "M/H", easeOfDoingBusiness: "L" },
  },
  {
    key: "oecd",
    label: loc("Industrializado OCDE", "Industrialized OECD"),
    description: loc(
      "Mercado grande y maduro, con bajo riesgo y crecimiento bajo.",
      "A large, mature market with low risk and low growth."
    ),
    examples: loc("Australia, Japón, Corea", "Australia, Japan, Korea"),
    traits: { population: "M/H", gdp: "H", gdpPerCapita: "H", infrastructure: "H", skills: "H", productivity: "H", naturalResources: "Variable", risk: "L", easeOfDoingBusiness: "H" },
  },
  {
    key: "resourceRich",
    label: loc("Rico en recursos", "Resource rich"),
    description: loc(
      "Dotación natural, humana o tecnológica destacada. Puede solaparse con otros perfiles.",
      "Outstanding natural, human or technological endowment. It can overlap with other profiles."
    ),
    examples: loc("Australia, Indonesia, Arabia Saudí", "Australia, Indonesia, Saudi Arabia"),
    traits: { population: "Variable", gdp: "Variable", gdpPerCapita: "Variable", infrastructure: "Variable", skills: "Variable", productivity: "Variable", naturalResources: "H", risk: "Variable", easeOfDoingBusiness: "Variable" },
  },
] as const;

// ---------------------------------------------------------------------------
// 10. Matriz de síntesis — Figura 6.2 (p. 227)
// ---------------------------------------------------------------------------

export type OpportunityRiskQuadrant = "highAttractiveness" | "highRiskHighReturn" | "lowRiskLowReturn" | "lowAttractiveness";

export const opportunityRiskQuadrants: Record<OpportunityRiskQuadrant, { label: Localized; reading: Localized }> = {
  highAttractiveness: {
    label: loc("Alta atractividad", "High attractiveness"),
    reading: loc(
      "Oportunidad de mercado y competitiva alta con riesgo tolerable. Es la zona donde una entrada comprometida se justifica si el caso económico acompaña.",
      "High market and competitive opportunity with tolerable risk. This is where a committed entry is justified if the economic case supports it."
    ),
  },
  highRiskHighReturn: {
    label: loc("Alto riesgo / alto retorno", "High risk / high return"),
    reading: loc(
      "La oportunidad existe pero la exposición es alta. Estructure la entrada para limitar activos hundidos y conserve la opción de salir.",
      "The opportunity is there but exposure is high. Structure the entry to limit sunk assets and keep the option to leave."
    ),
  },
  lowRiskLowReturn: {
    label: loc("Bajo riesgo / bajo retorno", "Low risk / low return"),
    reading: loc(
      "Mercado cómodo pero sin recorrido. Solo se justifica por razones de cobertura, aprendizaje o coordinación regional, no por retorno.",
      "A comfortable market with no upside. It is justified only for coverage, learning or regional coordination, not for return."
    ),
  },
  lowAttractiveness: {
    label: loc("Baja atractividad", "Low attractiveness"),
    reading: loc(
      "Ni oportunidad ni tolerancia al riesgo. Mantener observación y reabrir la decisión solo si cambian los datos.",
      "Neither opportunity nor risk tolerance. Keep watching and reopen the decision only if the data changes."
    ),
  },
};
