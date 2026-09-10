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
 */

export type AssessmentValue = number | null;

export type AssessmentItem = {
  key: string;
  label: string;
  /** Qué hay que mirar. Redactado como la pregunta que resuelve el ítem. */
  help: string;
  /** Lectura del 0. */
  anchorLow: string;
  /** Lectura del 4. */
  anchorHigh: string;
};

export type AssessmentGroup = {
  key: string;
  label: string;
  /** Referencia del libro de la que sale el grupo. */
  source: string;
  intro: string;
  items: AssessmentItem[];
};

export type AssessmentBlockKey = "market" | "resources" | "industry" | "cage" | "risk";

export type AssessmentBlock = {
  key: AssessmentBlockKey;
  label: string;
  source: string;
  intro: string;
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
  label: "Oportunidades de mercado",
  source: "Figura 6.3, p. 229; Tabla 6.1, p. 231; Tabla 6.2, p. 234",
  intro:
    "Mide la demanda potencial del país para la oferta de la empresa. El libro la descompone en tamaño, crecimiento y calidad de la demanda, y advierte de que la calidad depende de la segmentación predominante y de la curva de valor de cada segmento, no del PIB.",
  direction: "favourable",
  groups: [
    {
      key: "demand",
      label: "Demanda",
      source: "Figura 6.3, p. 229",
      intro: "Las tres variables con las que el libro evalúa una oportunidad de mercado.",
      items: [
        { key: "size", label: "Tamaño del mercado servible", help: "¿Cuánta demanda existe hoy para esta categoría, no para el PIB del país?", anchorLow: "Marginal para la escala mínima del negocio", anchorHigh: "Entre los mercados relevantes del sector a escala mundial" },
        { key: "growth", label: "Crecimiento esperado", help: "¿Qué ritmo sostiene la categoría en el horizonte de la decisión?", anchorLow: "Estancado o en contracción", anchorHigh: "Crecimiento muy por encima de la media del sector" },
        { key: "quality", label: "Calidad de la demanda", help: "¿La segmentación y la curva de valor del cliente encajan con la propuesta de la empresa, o exigen otra oferta?", anchorLow: "Solo compite el precio; la propuesta no tiene dónde apoyarse", anchorHigh: "Segmentos que valoran y pagan los atributos en los que la empresa es fuerte" },
      ],
    },
    {
      key: "segmentation",
      label: "Segmentación y accesibilidad",
      source: "Figura 6.8, p. 233; Tabla 6.2, p. 234",
      intro: "Cómo está partido el mercado y hasta dónde llega realmente la empresa.",
      items: [
        { key: "targetSegmentDepth", label: "Profundidad del segmento objetivo", help: "¿El segmento al que apunta la empresa tiene masa suficiente, o es una franja estrecha entre un enorme mercado de bajo precio y una élite minúscula?", anchorLow: "Franja estrecha sin masa crítica", anchorHigh: "Segmento amplio y consolidado" },
        { key: "middleClassMomentum", label: "Dinámica de clase media", help: "¿La renta está cruzando el umbral que dispara el consumo de esta categoría? El efecto es no lineal por lo sesgado de la distribución de renta.", anchorLow: "Sin movimiento por encima del umbral", anchorHigh: "Ampliación rápida del segmento por encima del umbral" },
        { key: "distributionAccess", label: "Acceso a distribución", help: "¿Existe un canal capaz de llevar la oferta al segmento, o hay que construirlo?", anchorLow: "Sin canal viable; habría que crearlo entero", anchorHigh: "Canal maduro y accesible en condiciones normales" },
        { key: "willingnessToPay", label: "Disposición a pagar", help: "¿El precio que exige el modelo de la empresa es alcanzable para el segmento objetivo?", anchorLow: "Muy por encima de lo que el segmento paga", anchorHigh: "Dentro del rango habitual del segmento" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Oportunidades de recursos — pp. 234-238
// ---------------------------------------------------------------------------

const resourcesBlock: AssessmentBlock = {
  key: "resources",
  label: "Oportunidades de recursos",
  source: "Figura 6.3, p. 229; pp. 234-238; Figura 6.10, p. 236; Tabla 6.3, pp. 237-238",
  intro:
    "El libro separa recursos naturales, humanos y de infraestructura e industrias de soporte, y añade la localización como recurso propio cuando convierte al país en hub regional.",
  direction: "favourable",
  groups: [
    {
      key: "natural",
      label: "Recursos naturales y localización",
      source: "pp. 234-236",
      intro: "Dotación física y ventaja locacional.",
      items: [
        { key: "rawMaterials", label: "Materias primas", help: "¿El país es una fuente crítica de los insumos del negocio?", anchorLow: "Sin relevancia como fuente", anchorHigh: "Fuente crítica a escala mundial" },
        { key: "location", label: "Ventaja locacional", help: "¿La posición geográfica, combinada con infraestructura y servicios, lo convierte en hub o centro regional?", anchorLow: "Periférico para la red de la empresa", anchorHigh: "Hub natural para la región" },
      ],
    },
    {
      key: "human",
      label: "Recursos humanos",
      source: "Figura 6.10, p. 236",
      intro:
        "Los dos atributos que el libro considera atractivos son la cualificación de la fuerza de trabajo y el coste unitario, entendido como la relación entre retribución y productividad, no como salario nominal.",
      items: [
        { key: "skills", label: "Cualificación disponible", help: "¿Hay perfiles con la formación que el negocio necesita, y en qué volumen?", anchorLow: "Escasez severa de los perfiles clave", anchorHigh: "Abundancia de perfiles cualificados" },
        { key: "payProductivity", label: "Retribución frente a productividad", help: "¿El coste unitario resultante es competitivo? Retribución alta con productividad baja es coste unitario alto.", anchorLow: "Coste unitario claramente desfavorable", anchorHigh: "Coste unitario claramente favorable" },
        { key: "labourAvailability", label: "Disponibilidad y rotación", help: "¿Se puede contratar y retener al ritmo que exige el plan?", anchorLow: "Rotación o escasez que compromete la operación", anchorHigh: "Mercado laboral holgado y estable" },
      ],
    },
    {
      key: "infrastructure",
      label: "Infraestructura e industrias de soporte",
      source: "Tabla 6.3, pp. 237-238",
      intro: "Calidad del transporte, la energía, las telecomunicaciones y la red de proveedores y servicios locales.",
      items: [
        { key: "transport", label: "Transporte y logística", help: "¿Carreteras, puertos y transporte aéreo sostienen el modelo de operación?", anchorLow: "Inviable sin inversión propia", anchorHigh: "Entre los mejores de su región" },
        { key: "utilities", label: "Energía y servicios básicos", help: "¿El suministro es fiable para el tipo de operación previsto?", anchorLow: "Cortes o déficit estructural", anchorHigh: "Fiable y de calidad" },
        { key: "digital", label: "Adopción digital y telecomunicaciones", help: "¿La conectividad soporta el modelo comercial y operativo?", anchorLow: "Penetración y calidad insuficientes", anchorHigh: "Infraestructura digital avanzada" },
        { key: "supportingIndustries", label: "Proveedores e industrias de soporte", help: "¿Existe un pool de proveedores cualificados y clusters relacionados?", anchorLow: "Sin tejido de proveedores utilizable", anchorHigh: "Cluster desarrollado y competitivo" },
        { key: "technology", label: "Innovación y conocimiento", help: "¿Estar presente da acceso a tecnología, investigación o aprendizaje que la empresa no tiene?", anchorLow: "Nada que aprender aquí", anchorHigh: "Centro de referencia mundial en la disciplina" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Contexto competitivo — Tabla 6.4 (pp. 238-239) y country diamond (p. 239)
// ---------------------------------------------------------------------------

const industryBlock: AssessmentBlock = {
  key: "industry",
  label: "Contexto competitivo y de industria",
  source: "Tabla 6.4, pp. 238-239; country diamond, p. 239; Tabla 6.5, pp. 241-242",
  intro:
    "Las cinco fuerzas de Porter con la sexta que añaden los autores —la política gubernamental— leídas con los determinantes propios de una entrada internacional. Aquí se puntúa la presión que ejerce cada fuerza: 4 es una fuerza intensa, es decir, un contexto desfavorable.",
  direction: "adverse",
  groups: [
    {
      key: "forces",
      label: "Fuerzas competitivas",
      source: "Tabla 6.4, pp. 238-239",
      intro: "Cada ítem se puntúa por la presión que ejerce sobre la rentabilidad de un entrante.",
      items: [
        { key: "rivalry", label: "Intensidad de la rivalidad", help: "¿Hay sobrecapacidad y falta de diferenciación? La rivalidad se agudiza cuando el crecimiento se frena y la ventana se cierra.", anchorLow: "Competencia contenida y racional", anchorHigh: "Guerra de precios con sobrecapacidad" },
        { key: "entryBarriers", label: "Barreras de entrada", help: "Redes de distribución, localizaciones, posición de los incumbentes, especificidades culturales y política de licencias, que puede elevarlas de forma artificial.", anchorLow: "Entrada practicable con recursos normales", anchorHigh: "Barreras que hacen la entrada muy costosa o inviable" },
        { key: "supplierPower", label: "Poder de los proveedores", help: "Mayor en economías protegidas con monopolios estatales de materias primas, con escasez de mano de obra cualificada o con política de contenido local.", anchorLow: "Oferta amplia y sustituible", anchorHigh: "Proveedores capaces de imponer precio y condiciones" },
        { key: "buyerPower", label: "Poder de los compradores", help: "Más fuerte donde las redes de distribución están fuertemente controladas.", anchorLow: "Clientes atomizados con costes de cambio", anchorHigh: "Compradores capaces de bloquear cualquier subida" },
        { key: "substitutes", label: "Sustitutos", help: "Nuevas tecnologías o modelos de negocio, incluidos los de competidores globales que llegan con una propuesta disruptiva.", anchorLow: "Sin alternativa creíble a la vista", anchorHigh: "Sustitución en curso que erosiona la categoría" },
        { key: "governmentPolicy", label: "Política gubernamental", help: "Sexta fuerza añadida por los autores: restricciones especiales al inversor extranjero, trato preferente a incumbentes, control de precios y fiscalidad.", anchorLow: "Marco neutral o favorable al entrante", anchorHigh: "Barreras artificiales dirigidas al inversor extranjero" },
      ],
    },
    {
      key: "diamond",
      label: "Diamante del país",
      source: "p. 239 (Porter 1998)",
      intro:
        "Los cuatro motores de la ventaja competitiva nacional. Aquí se puntúa la debilidad del diamante, para mantener la lectura del bloque: 4 es un diamante pobre.",
      items: [
        { key: "endowmentGap", label: "Dotación de factores", help: "Recursos naturales, humanos, de capital, físicos, tecnológicos y científicos disponibles para competir aquí.", anchorLow: "Dotación excelente", anchorHigh: "Dotación pobre para esta industria" },
        { key: "demandSophisticationGap", label: "Exigencia de la demanda", help: "¿Los clientes locales son exigentes en calidad y empujan la competitividad de quien les sirve?", anchorLow: "Demanda muy exigente y sofisticada", anchorHigh: "Demanda poco exigente" },
        { key: "rivalryStimulusGap", label: "Estímulo de la rivalidad", help: "¿La competencia local estimula la mejora, o es un mercado adormecido o protegido?", anchorLow: "Competencia vigorosa que eleva el nivel", anchorHigh: "Sin estímulo competitivo" },
        { key: "clusterGap", label: "Industrias de soporte y clusters", help: "¿Existe un cluster de proveedores y empresas exitosas del que aprovecharse?", anchorLow: "Cluster maduro y accesible", anchorHigh: "Sin tejido de soporte" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Distancia CAGE — Figura 6.11 (p. 243)
// ---------------------------------------------------------------------------

const cageBlock: AssessmentBlock = {
  key: "cage",
  label: "Distancia CAGE",
  source: "Figura 6.11, p. 243 (Ghemawat 2007)",
  intro:
    "Distancia bilateral entre el país de origen de la empresa y el mercado evaluado. Se puntúa la distancia: 4 es máxima diferencia. Dos países con la misma media y perfiles opuestos exigen respuestas distintas, así que la herramienta muestra el perfil, no solo el promedio.",
  direction: "adverse",
  groups: [
    {
      key: "cultural",
      label: "Cultural",
      source: "Figura 6.11, p. 243",
      intro: "Diferencias que afectan a la comunicación, la confianza y la forma de hacer negocio.",
      items: [
        { key: "language", label: "Idioma", help: "¿Se puede operar y vender en una lengua que la empresa domina?", anchorLow: "Lengua común", anchorHigh: "Sin lengua compartida ni en la operación ni en el mercado" },
        { key: "ethnicComposition", label: "Composición étnica", help: "¿La diversidad étnica del país cambia la segmentación o la gestión de personas?", anchorLow: "Composición próxima a la de origen", anchorHigh: "Composición muy distinta con implicaciones operativas" },
        { key: "religion", label: "Religión", help: "¿Hay prácticas religiosas que condicionen producto, calendario o consumo?", anchorLow: "Sin implicaciones", anchorHigh: "Condiciona producto, calendario y consumo" },
        { key: "values", label: "Valores", help: "Jerarquía, relación con el tiempo, individualismo y colectivismo, actitud ante el conflicto.", anchorLow: "Valores muy próximos", anchorHigh: "Valores opuestos en dimensiones que afectan a la gestión" },
        { key: "trust", label: "Base de la confianza", help: "¿La confianza se construye sobre el contrato, sobre la relación personal o sobre la pertenencia a una red?", anchorLow: "Misma base de confianza", anchorHigh: "Base de confianza radicalmente distinta" },
      ],
    },
    {
      key: "administrative",
      label: "Administrativa",
      source: "Figura 6.11, p. 243",
      intro: "Vínculos institucionales y marco legal y político.",
      items: [
        { key: "regionalBloc", label: "Bloque regional", help: "¿Comparten pertenencia a un bloque de integración económica?", anchorLow: "Mismo bloque, con libre circulación", anchorHigh: "Sin acuerdo, con aranceles y trámites plenos" },
        { key: "colonialTies", label: "Vínculos históricos", help: "¿Existen lazos poscoloniales o históricos que faciliten el trato?", anchorLow: "Vínculos históricos estrechos", anchorHigh: "Sin vínculo, o con historia adversa" },
        { key: "currency", label: "Moneda", help: "¿Comparten moneda o hay exposición y controles de cambio?", anchorLow: "Misma moneda", anchorHigh: "Moneda distinta con controles de cambio" },
        { key: "legalFramework", label: "Marco legal", help: "¿La tradición jurídica y la aplicación de contratos se parecen a las de origen?", anchorLow: "Misma tradición jurídica y aplicación previsible", anchorHigh: "Tradición distinta con aplicación incierta" },
        { key: "politicalSystem", label: "Sistema político", help: "¿La relación entre Estado y empresa se parece a la del país de origen?", anchorLow: "Sistema equivalente", anchorHigh: "Sistema muy distinto con intervención directa" },
      ],
    },
    {
      key: "geographic",
      label: "Geográfica",
      source: "Figura 6.11, p. 243",
      intro: "Distancia física y sus consecuencias operativas.",
      items: [
        { key: "physical", label: "Distancia física", help: "¿Cuánto pesa el transporte y el desplazamiento de personas en el modelo?", anchorLow: "Contigüidad o proximidad", anchorHigh: "Distancia que condiciona costes y gestión" },
        { key: "climate", label: "Clima", help: "¿Obliga a adaptar producto, empaquetado, almacenamiento u operación?", anchorLow: "Clima equivalente", anchorHigh: "Clima que obliga a rediseñar producto u operación" },
        { key: "timeZone", label: "Huso horario", help: "¿Queda solapamiento de jornada para coordinar con la matriz?", anchorLow: "Mismo huso o solapamiento amplio", anchorHigh: "Sin solapamiento de jornada" },
        { key: "seaAccess", label: "Acceso al mar y a la red logística", help: "¿El país tiene salida marítima y conexión a las rutas que usa la empresa?", anchorLow: "Puertos propios en las rutas principales", anchorHigh: "Interior sin salida, dependiente de terceros" },
      ],
    },
    {
      key: "economic",
      label: "Económica",
      source: "Figura 6.11, p. 243",
      intro: "Diferencias de desarrollo, estructura e infraestructura económica.",
      items: [
        { key: "naturalResources", label: "Recursos naturales", help: "¿La estructura de dotación es distinta hasta el punto de cambiar la economía del negocio?", anchorLow: "Estructura equivalente", anchorHigh: "Estructura opuesta" },
        { key: "infrastructure", label: "Infraestructura", help: "¿El nivel de infraestructura obliga a otro modelo operativo?", anchorLow: "Nivel equivalente", anchorHigh: "Nivel que exige rediseñar la operación" },
        { key: "information", label: "Información de mercado", help: "¿Hay datos fiables de mercado, clientes y competencia?", anchorLow: "Información equivalente a la de origen", anchorHigh: "Opacidad que impide medir el mercado" },
        { key: "financialSystem", label: "Sistema financiero", help: "¿Se puede financiar, cobrar y repatriar en condiciones comparables?", anchorLow: "Sistema equivalente", anchorHigh: "Sistema que restringe financiación o cobro" },
        { key: "incomeDistribution", label: "Distribución de la renta", help: "¿La forma de la distribución cambia la segmentación respecto al mercado de origen?", anchorLow: "Distribución comparable", anchorHigh: "Distribución muy sesgada frente a la de origen" },
        { key: "publicPrivate", label: "Peso público y privado", help: "¿Cuánta actividad está en manos del Estado o de grupos vinculados a él?", anchorLow: "Equilibrio equivalente", anchorHigh: "Sector dominado por actores públicos o afines" },
        { key: "knowledgeInfrastructure", label: "Infraestructura de conocimiento", help: "Universidades, centros de investigación y formación técnica disponibles.", anchorLow: "Nivel equivalente", anchorHigh: "Déficit que obliga a formar desde cero" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 5. Riesgo país — Figura 6.12 (p. 244)
// ---------------------------------------------------------------------------

const riskBlock: AssessmentBlock = {
  key: "risk",
  label: "Riesgo país",
  source: "Figura 6.12, p. 244; Figura 6.13, p. 245",
  intro:
    "Probabilidad de que circunstancias adversas de origen político, económico o social afecten al desempeño. El libro separa dentro del riesgo político tres exposiciones distintas —accionista, empleado y operación— porque no se cubren con los mismos instrumentos.",
  direction: "adverse",
  groups: [
    {
      key: "politicalShareholder",
      label: "Riesgo político · exposición del accionista",
      source: "Figura 6.12, p. 244",
      intro: "Pérdida de capital o imposibilidad de repatriarlo.",
      items: [
        { key: "assetDestruction", label: "Destrucción de activos", help: "Guerra, disturbios o conflicto civil que destruyan instalaciones.", anchorLow: "Improbable en el horizonte", anchorHigh: "Riesgo material y presente" },
        { key: "assetSpoliation", label: "Expropiación", help: "Nacionalización, confiscación o expropiación encubierta.", anchorLow: "Sin precedentes ni señales", anchorHigh: "Precedentes recientes en el sector" },
        { key: "assetInflexibility", label: "Bloqueo de fondos", help: "Restricción a la transferencia de capital o congelación de dividendos.", anchorLow: "Libre transferencia", anchorHigh: "Controles activos sobre la repatriación" },
      ],
    },
    {
      key: "politicalEmployee",
      label: "Riesgo político · exposición del empleado",
      source: "Figura 6.12, p. 244",
      intro: "Seguridad de las personas destacadas y contratadas localmente.",
      items: [
        { key: "kidnapping", label: "Secuestro", help: "¿Hay riesgo real para expatriados o directivos locales?", anchorLow: "Sin riesgo apreciable", anchorHigh: "Riesgo que exige protocolo de seguridad" },
        { key: "gangsterism", label: "Criminalidad organizada", help: "Presencia de crimen organizado que afecte a la operación o al personal.", anchorLow: "Sin presencia relevante", anchorHigh: "Presencia que condiciona la operación" },
        { key: "harassment", label: "Acoso administrativo o policial", help: "Hostigamiento a empresas extranjeras o a su personal.", anchorLow: "Sin casos conocidos", anchorHigh: "Práctica habitual documentada" },
      ],
    },
    {
      key: "politicalOperational",
      label: "Riesgo político · exposición de la operación",
      source: "Figura 6.12, p. 244",
      intro: "Interrupciones de la actividad por causas políticas o sociales.",
      items: [
        { key: "marketDisruption", label: "Disrupción de mercado", help: "Cierres, boicots o cambios abruptos de reglas que corten la actividad comercial.", anchorLow: "Improbable", anchorHigh: "Recurrente" },
        { key: "labourUnrest", label: "Conflictividad laboral", help: "Huelgas y conflicto sindical con capacidad de parar la operación.", anchorLow: "Relaciones laborales estables", anchorHigh: "Conflictividad alta y frecuente" },
        { key: "racketeering", label: "Extorsión", help: "Pagos forzados a actores privados o públicos para poder operar.", anchorLow: "Inexistente", anchorHigh: "Condición de facto para operar" },
        { key: "suppliesShortage", label: "Escasez de suministros", help: "Interrupciones de insumos por causa política, aduanera o criminal.", anchorLow: "Cadena estable", anchorHigh: "Interrupciones frecuentes" },
      ],
    },
    {
      key: "economic",
      label: "Riesgo económico",
      source: "Figura 6.12, p. 244; Figura 6.13, p. 245",
      intro:
        "Variabilidad de los motores económicos del negocio. El libro mide la volatilidad con el coeficiente de variación del crecimiento: dos países con el mismo crecimiento medio y distinta dispersión no tienen el mismo riesgo.",
      items: [
        { key: "growth", label: "Nivel de crecimiento", help: "¿El crecimiento sostiene el plan o lo pone en riesgo?", anchorLow: "Crecimiento sólido y sostenido", anchorHigh: "Contracción o estancamiento" },
        { key: "variability", label: "Variabilidad del crecimiento", help: "Dispersión histórica del crecimiento, medida como desviación típica sobre media.", anchorLow: "Serie muy estable", anchorHigh: "Serie muy volátil" },
        { key: "inflation", label: "Inflación", help: "¿Erosiona precios, costes y cobros dentro del horizonte?", anchorLow: "Contenida y previsible", anchorHigh: "Alta o descontrolada" },
        { key: "inputCosts", label: "Coste de los insumos", help: "Exposición a variaciones de energía, materias primas o salarios.", anchorLow: "Estable y cubrible", anchorHigh: "Volátil y no cubrible" },
        { key: "exchangeRate", label: "Tipo de cambio", help: "Exposición de la divisa local frente a la moneda de reporte.", anchorLow: "Estable o vinculada", anchorHigh: "Volátil, con riesgo de devaluación brusca" },
      ],
    },
    {
      key: "competitive",
      label: "Riesgo competitivo",
      source: "Figura 6.12, p. 244",
      intro:
        "Distorsión no económica del contexto competitivo. Perjudica especialmente a quien basa su ventaja en calidad de producto y economía de la operación.",
      items: [
        { key: "corruption", label: "Corrupción", help: "¿El acceso a clientes, licencias o contratos depende de pagos irregulares?", anchorLow: "Sin incidencia en la actividad", anchorHigh: "Condición práctica para competir" },
        { key: "cartels", label: "Cárteles", help: "Acuerdos entre incumbentes que cierran el mercado a un entrante.", anchorLow: "Mercado abierto", anchorHigh: "Reparto establecido entre incumbentes" },
        { key: "networks", label: "Redes y lógicas dominantes", help: "Grupos familiares o empresariales cuya pertenencia determina el acceso al negocio.", anchorLow: "Acceso por mérito comercial", anchorHigh: "Acceso determinado por la red" },
      ],
    },
    {
      key: "operational",
      label: "Riesgo operativo",
      source: "Figura 6.12, p. 244",
      intro: "Afectan directamente a la cuenta de resultados, por regulación costosa o por infraestructura poco fiable.",
      items: [
        { key: "infrastructureReliability", label: "Fiabilidad de la infraestructura", help: "Energía, telecomunicaciones y transporte en el día a día de la operación.", anchorLow: "Fiable", anchorHigh: "Interrupciones que exigen redundancia propia" },
        { key: "supplierReliability", label: "Fiabilidad de los proveedores", help: "¿Cumplen plazo y calidad de forma sostenida?", anchorLow: "Cumplimiento comparable al de origen", anchorHigh: "Incumplimiento estructural" },
        { key: "nationalisticPreferences", label: "Preferencias nacionalistas", help: "Trato preferente a empresas locales en compras públicas o privadas.", anchorLow: "Trato equivalente", anchorHigh: "Preferencia sistemática al operador local" },
        { key: "localContent", label: "Restricciones de contenido, capital o empleo local", help: "Obligaciones de contenido local, socio local o cuotas de empleo.", anchorLow: "Sin restricciones", anchorHigh: "Restricciones que condicionan el modelo" },
        { key: "taxes", label: "Fiscalidad y burocracia", help: "Carga fiscal y coste administrativo específico del inversor extranjero.", anchorLow: "Carga y trámites normales", anchorHigh: "Carga o burocracia que erosionan el caso" },
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
  label: string;
  instruments: { key: string; label: string }[];
};

export const incentiveFamilies: readonly IncentiveFamily[] = [
  {
    key: "tax",
    label: "Reducción fiscal",
    instruments: [
      { key: "holiday", label: "Amnistía fiscal por período limitado" },
      { key: "lossOffset", label: "Compensación de pérdidas contra beneficios posteriores" },
      { key: "reducedRate", label: "Tipo impositivo reducido" },
      { key: "acceleratedDepreciation", label: "Amortización acelerada" },
      { key: "socialContributions", label: "Reducción de cotizaciones sociales" },
      { key: "specialDeductions", label: "Deducciones especiales por I+D o actividad social" },
      { key: "propertyExemption", label: "Exención de impuestos sobre la propiedad" },
      { key: "localContentRelief", label: "Reducción de base por contenido local o empleo" },
      { key: "expatriateRelief", label: "Exención o reducción de IRPF para personal expatriado" },
    ],
  },
  {
    key: "trade",
    label: "Importación y exportación",
    instruments: [
      { key: "importDuty", label: "Exención de aranceles e IVA de importación de equipos y piezas" },
      { key: "exportDuty", label: "Exención de derechos de exportación" },
      { key: "exportCredit", label: "Créditos fiscales sobre ventas domésticas por desempeño exportador" },
    ],
  },
  {
    key: "financial",
    label: "Incentivos financieros",
    instruments: [
      { key: "subsidies", label: "Subvenciones directas" },
      { key: "sweetenerLoans", label: "Préstamos en condiciones preferentes" },
      { key: "guaranteedLoans", label: "Préstamos garantizados" },
      { key: "exportCredits", label: "Créditos a la exportación" },
      { key: "equity", label: "Participación pública en el capital" },
      { key: "riskInsurance", label: "Seguros de riesgo de exportación o de cambio" },
    ],
  },
  {
    key: "competitive",
    label: "Incentivos competitivos",
    instruments: [
      { key: "importProtection", label: "Protección frente a importaciones" },
      { key: "capacityRegulation", label: "Regulación de capacidad" },
      { key: "monopolyPosition", label: "Posición monopolística" },
      { key: "preferentialProcurement", label: "Compras públicas preferentes" },
    ],
  },
  {
    key: "operational",
    label: "Incentivos operativos",
    instruments: [
      { key: "preferentialTariffs", label: "Tarifas preferentes de suelo, alquiler, energía o telecomunicaciones" },
      { key: "marketStudies", label: "Asistencia en estudios de mercado" },
      { key: "publicServices", label: "Uso de servicios públicos o agencias para la operación" },
      { key: "secondment", label: "Cesión de personal público" },
      { key: "trainingCentres", label: "Centros de formación" },
      { key: "infrastructureAccess", label: "Acceso a programas de infraestructura" },
      { key: "sciencePark", label: "Acceso a parques científicos o partenariados público-privados" },
    ],
  },
] as const;

/**
 * Advertencia del libro (p. 242, Guisinger 1985, 1992): el papel de los incentivos es
 * limitado. Atractivo de mercado, condiciones competitivas y dotación de recursos pesan
 * más; los incentivos solo desempatan entre localizaciones comparables. Por eso su peso
 * por defecto en la puntuación de gobierno es bajo.
 */
export const incentiveWeightNote =
  "Los incentivos solo desempatan entre localizaciones comparables: el libro concluye que su papel es limitado frente a mercado, competencia y recursos (p. 242).";

// ---------------------------------------------------------------------------
// 7. Cuestiones ambientales y sociales — p. 242
// ---------------------------------------------------------------------------

export const sustainabilityChecks: readonly { key: string; label: string }[] = [
  { key: "deforestation", label: "¿El país tolera o fomenta la deforestación sin reforestación?" },
  { key: "childLabour", label: "¿Existe trabajo infantil en la cadena de valor de la industria?" },
  { key: "discrimination", label: "¿Hay discriminación étnica o de género institucionalizada?" },
  { key: "pesticides", label: "¿La agricultura de la que depende el negocio usa pesticidas de forma masiva?" },
  { key: "carbonIntensity", label: "¿La generación eléctrica sigue basada en procesos intensivos en CO₂?" },
] as const;

// ---------------------------------------------------------------------------
// 8. Clusters de ciclo de vida de país — Tabla 6.2 (p. 234)
// ---------------------------------------------------------------------------

export type LifeCycleCluster = "developing" | "emerging" | "fastIndustrializing" | "industrialized";

export const lifeCycleClusters: readonly {
  key: LifeCycleCluster;
  label: string;
  growth: string;
  size: string;
  segmentation: string;
  valueCurve: string;
  distribution: string;
  competition: string;
}[] = [
  {
    key: "developing",
    label: "En desarrollo",
    growth: "Bajo",
    size: "Pequeño",
    segmentation: "Sector de subsistencia dominante; gran segmento de gama baja",
    valueCurve: "Precio; disponibilidad",
    distribution: "Logística de empuje",
    competition: "Regulada",
  },
  {
    key: "emerging",
    label: "Emergente",
    growth: "Alto",
    size: "De pequeño a alto",
    segmentation: "Clase media en rápido crecimiento; gran segmento de gama baja",
    valueCurve: "Precio; distribución; publicidad incipiente",
    distribution: "Logística de empuje, con inicio de tracción",
    competition: "Inicio de desregulación; nuevos entrantes",
  },
  {
    key: "fastIndustrializing",
    label: "Industrialización rápida",
    growth: "Alto",
    size: "De pequeño a alto",
    segmentation: "Clase media establecida; diversidad creciente de segmentos",
    valueCurve: "Funcionalidad; prestaciones; servicios",
    distribution: "Tracción; inicio de la distribución masiva",
    competition: "Mayoritariamente desregulada, activa y diversa",
  },
  {
    key: "industrialized",
    label: "Industrializado (OCDE)",
    growth: "Bajo",
    size: "Alto",
    segmentation: "Clase media establecida; segmentación diversa y sofisticada",
    valueCurve: "Funcionalidad; prestaciones; servicios",
    distribution: "Diversa; distribución masiva relevante",
    competition: "Desregulada, activa y diversa",
  },
] as const;

// ---------------------------------------------------------------------------
// 9. Perfiles estratégicos de país — Tabla 6.6 (p. 249)
// ---------------------------------------------------------------------------

export type CountryProfileKey = "hub" | "emergingGiant" | "fastIndustrializing" | "developing" | "oecd" | "resourceRich";

export type ProfileTrait = "L" | "M" | "H" | "M/L" | "M/H" | "Variable";

export const countryProfiles: readonly {
  key: CountryProfileKey;
  label: string;
  description: string;
  examples: string;
  traits: Record<"population" | "gdp" | "gdpPerCapita" | "infrastructure" | "skills" | "productivity" | "naturalResources" | "risk" | "easeOfDoingBusiness", ProfileTrait>;
}[] = [
  {
    key: "hub",
    label: "Hub",
    description: "Punto de entrada y centro regional por localización, infraestructura y marco regulatorio.",
    examples: "Singapur, Hong Kong",
    traits: { population: "L", gdp: "L", gdpPerCapita: "H", infrastructure: "H", skills: "H", productivity: "H", naturalResources: "L", risk: "L", easeOfDoingBusiness: "H" },
  },
  {
    key: "emergingGiant",
    label: "Gigante emergente",
    description: "Alta importancia estratégica por tamaño absoluto del mercado.",
    examples: "China, India",
    traits: { population: "H", gdp: "H", gdpPerCapita: "M/L", infrastructure: "M/L", skills: "M", productivity: "M/L", naturalResources: "L", risk: "M", easeOfDoingBusiness: "L" },
  },
  {
    key: "fastIndustrializing",
    label: "Industrialización rápida",
    description: "Alto potencial de crecimiento con riqueza moderada.",
    examples: "Indonesia, Malasia, Tailandia",
    traits: { population: "M/H", gdp: "M", gdpPerCapita: "M/L", infrastructure: "M/L", skills: "M/L", productivity: "M/L", naturalResources: "M/H", risk: "M", easeOfDoingBusiness: "M/L" },
  },
  {
    key: "developing",
    label: "En desarrollo",
    description: "Renta baja y crecimiento limitado; oportunidad selectiva.",
    examples: "Filipinas, Vietnam, Camboya",
    traits: { population: "M/H", gdp: "M/L", gdpPerCapita: "L", infrastructure: "M/L", skills: "L", productivity: "L", naturalResources: "M/H", risk: "M/H", easeOfDoingBusiness: "L" },
  },
  {
    key: "oecd",
    label: "Industrializado OCDE",
    description: "Mercado grande y maduro, con bajo riesgo y crecimiento bajo.",
    examples: "Australia, Japón, Corea",
    traits: { population: "M/H", gdp: "H", gdpPerCapita: "H", infrastructure: "H", skills: "H", productivity: "H", naturalResources: "Variable", risk: "L", easeOfDoingBusiness: "H" },
  },
  {
    key: "resourceRich",
    label: "Rico en recursos",
    description: "Dotación natural, humana o tecnológica destacada. Puede solaparse con otros perfiles.",
    examples: "Australia, Indonesia, Arabia Saudí",
    traits: { population: "Variable", gdp: "Variable", gdpPerCapita: "Variable", infrastructure: "Variable", skills: "Variable", productivity: "Variable", naturalResources: "H", risk: "Variable", easeOfDoingBusiness: "Variable" },
  },
] as const;

// ---------------------------------------------------------------------------
// 10. Matriz de síntesis — Figura 6.2 (p. 227)
// ---------------------------------------------------------------------------

export type OpportunityRiskQuadrant = "highAttractiveness" | "highRiskHighReturn" | "lowRiskLowReturn" | "lowAttractiveness";

export const opportunityRiskQuadrants: Record<OpportunityRiskQuadrant, { label: string; reading: string }> = {
  highAttractiveness: {
    label: "Alta atractividad",
    reading: "Oportunidad de mercado y competitiva alta con riesgo tolerable. Es la zona donde una entrada comprometida se justifica si el caso económico acompaña.",
  },
  highRiskHighReturn: {
    label: "Alto riesgo / alto retorno",
    reading: "La oportunidad existe pero la exposición es alta. Estructure la entrada para limitar activos hundidos y conserve la opción de salir.",
  },
  lowRiskLowReturn: {
    label: "Bajo riesgo / bajo retorno",
    reading: "Mercado cómodo pero sin recorrido. Solo se justifica por razones de cobertura, aprendizaje o coordinación regional, no por retorno.",
  },
  lowAttractiveness: {
    label: "Baja atractividad",
    reading: "Ni oportunidad ni tolerancia al riesgo. Mantener observación y reabrir la decisión solo si cambian los datos.",
  },
};
