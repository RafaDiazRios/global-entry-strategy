import { loc, type Localized } from "@shared/i18n";

/**
 * Texto de la propia interfaz: botones, pestañas, encabezados.
 *
 * Lo que describe un marco del libro no vive aquí sino junto a su definición, en
 * `shared/domain`, para que nadie pueda cambiar un concepto y olvidarse de un idioma.
 * Aquí queda lo que es puramente de la aplicación.
 */
export const UI_STRINGS = {
  // Navegación
  tabCase: loc("0. Caso", "0. Case"),
  tabBrief: loc("1. Mandato", "1. Mandate"),
  tabStrategy: loc("2. Estrategia global", "2. Global strategy"),
  tabMarkets: loc("3. Mercados", "3. Markets"),
  tabCalibration: loc("4. Calibración", "4. Calibration"),
  tabEconomics: loc("5. Economía", "5. Economics"),
  tabCompare: loc("6. Comparar", "6. Compare"),
  tabDecision: loc("7. Decisión", "7. Decision"),
  tabGates: loc("8. Gates", "8. Gates"),

  // Ruta guiada
  routeEyebrow: loc("Ruta del análisis", "Analysis route"),
  routeProgress: loc("pasos", "steps"),
  routeOf: loc("de", "of"),
  routeShowAll: loc("Ver los doce pasos", "Show all twelve steps"),
  routeShowPending: loc("Ver solo lo pendiente", "Show only what is pending"),
  routeCollapse: loc("Plegar la ruta", "Collapse the route"),
  routeExpand: loc("Desplegar la ruta", "Expand the route"),
  routeStep: loc("Paso", "Step"),
  routeWhatYouDecide: loc("Qué decides aquí.", "What you decide here."),
  routeWhyItMatters: loc("Por qué importa.", "Why it matters."),
  routeGoodAnswer: loc("Una respuesta buena", "A good answer"),
  routeStillMissing: loc("Para darlo por hecho falta", "To call it done you still need"),
  routeNothingMissing: loc("Nada: puede continuar", "Nothing: you can continue"),
  routeGoToStep: loc("Ir al paso", "Go to step"),
  routeComplete: loc("Análisis completo.", "Analysis complete."),
  routeCompleteDetail: loc(
    "Los doce pasos están cubiertos: mandato, evidencias, ambición, posicionamiento, países, evaluación, entrada, socio y decisión con su puerta de revisión. Puede exportar el informe o guardar el escenario.",
    "All twelve steps are covered: mandate, evidence, ambition, positioning, countries, assessment, entry, partner and decision with its review gate. You can export the report or save the scenario."
  ),
  routeConfirm: loc("Confirmar y continuar", "Confirm and continue"),
  routeSkip: loc("Continuar sin completar", "Continue without completing"),
  routeConfirmHint: loc(
    "Puede seguir sin completarlo: quedará marcado como saltado, no como hecho.",
    "You can move on without completing it: it will be marked as skipped, not as done."
  ),
  routeSkipped: loc("saltados", "skipped"),
  routeSkippedTag: loc("saltado", "skipped"),
  routeReopen: loc("Reabrir este paso", "Reopen this step"),
  routeNoCase: loc(
    "La ruta empieza a medir en cuanto haya un caso abierto. Sin caso solo puede seguir el primer paso.",
    "The route starts measuring as soon as a case is open. With no case, only the first step applies."
  ),

  // Panel de estrategia global — común a los cinco bloques
  gsTitle: loc("Estrategia global", "Global strategy"),
  gsNoCase: loc(
    "La ambición y el posicionamiento se analizan sobre un caso. Cree o seleccione uno en la pestaña de caso para empezar.",
    "Ambition and positioning are analysed on a case. Create or pick one in the case tab to start."
  ),
  gsLoading: loc("Cargando las tablas del capítulo 5…", "Loading the chapter 5 tables…"),
  gsSubAmbition: loc("Ambición global", "Global ambition"),
  gsSubPositioning: loc("Posicionamiento", "Positioning"),
  gsSubEntry: loc("Entrada", "Entry"),
  gsSubPartnering: loc("Vía y socio", "Route and partner"),
  gsSubCoherence: loc("Coherencia", "Coherence"),
  gsUndeclared: loc("Sin declarar", "Not declared"),
  gsUndecided: loc("Sin decidir", "Not decided"),
  gsUndetermined: loc("Sin determinar", "Undetermined"),
  gsRemove: loc("Quitar", "Remove"),
  gsSave: loc("Guardar", "Save"),
  gsSaved: loc("Guardado", "Saved"),
  gsAnswered: loc("respondido", "answered"),
  gsStillMissing: loc("Falta", "Still missing"),
  gsCoherence: loc("Coherencia", "Coherence"),

  // Bloque 1 — ambición
  amMotivesTitle: loc("Motivos de la globalización", "Motives for globalization"),
  amMotivesDesc: loc(
    "Dunning, p. 181. Marcar sin justificar no cuenta como respondido.",
    "Dunning, p. 181. Ticking a box without justifying it does not count as answered."
  ),
  amWhyApplies: loc("Por qué aplica en este caso", "Why it applies in this case"),
  amIndicesTitle: loc("Índices de globalización", "Globalization indices"),
  amRegions: loc("Regiones", "Regions"),
  amIndustryRef: loc("Industria de referencia (Tabla 5.2)", "Reference industry (Table 5.2)"),
  amManualDemand: loc("Introducir la demanda a mano", "Enter the demand by hand"),
  amWorldDemand: loc("Demanda mundial de la industria (%)", "World demand for the industry (%)"),
  amCompanyRevenue: loc("Ventas de la empresa por región", "Company revenue by region"),
  amRevenueHelp: loc(
    "En la unidad que prefiera: se normaliza a porcentaje.",
    "In whatever unit you prefer: it is normalized to a percentage."
  ),
  amCapabilityByRegion: loc("Capacidad por región", "Capability by region"),
  amAssets: loc("Activos", "Assets"),
  amPersonnel: loc("Empleo", "Headcount"),
  amRoleStageTitle: loc("Rol y etapa", "Role and stage"),
  amRoleStageDesc: loc(
    "pp. 181-182 para los roles, p. 219 para las etapas, Tabla 5.8 para el diseño organizativo.",
    "pp. 181-182 for the roles, p. 219 for the stages, Table 5.8 for the organizational design."
  ),
  amRoleToday: loc("Rol hoy", "Role today"),
  amRoleTarget: loc("Rol objetivo", "Target role"),
  amHorizon: loc("Horizonte (años)", "Horizon (years)"),
  amStage: loc("Etapa de globalización", "Stage of globalization"),
  amOrgDesign: loc("Diseño organizativo (Tabla 5.8)", "Organizational design (Table 5.8)"),
  amCountryRolesTitle: loc("Roles de país", "Country roles"),
  amCountryRolesDesc: loc(
    "pp. 187-188. El rol fija la prioridad de inversión y condiciona la estrategia de entrada.",
    "pp. 187-188. The role sets the investment priority and shapes the entry strategy."
  ),
  amNoRole: loc("Sin rol", "No role"),
  amCriterion: loc("Criterio que lo sostiene", "The criterion behind it"),
  amAddCountry: loc("Añadir país", "Add country"),
  amLofTitle: loc("Liability of foreignness", "Liability of foreignness"),
  amLofDesc: loc(
    "p. 198. Campo obligatorio: sin él el módulo no se da por completo.",
    "p. 198. Required: without it the module does not count as complete."
  ),
  amLofPlaceholder: loc(
    "Qué desventaja concreta tiene la empresa por ser extranjera aquí, y con qué ventaja superior la compensa",
    "What concrete handicap the firm carries for being foreign here, and the superior advantage that offsets it"
  ),
  amToastSaved: loc("Ambición guardada", "Ambition saved"),

  // Bloque 2 — posicionamiento
  poTitle: loc("Propuesta de valor", "Value proposition"),
  poDescPre: loc(
    "Fig. 5.8, p. 189. Las tres elecciones dan una de las ocho posiciones de la",
    "Fig. 5.8, p. 189. The three choices give one of the eight positions in"
  ),
  poExamples: loc("Ejemplos del libro", "Examples from the book"),
  poWhyThis: loc("Por qué esta posición y no otra", "Why this position and not another"),
  poCurveTitle: loc("Curva de valor y rejilla ERRC", "Value curve and ERRC grid"),
  poCurveDesc: loc(
    "Fig. 5.9, p. 189, con la rejilla del módulo 10 del programa. La rejilla no se rellena: sale de comparar la curva actual con la propuesta.",
    "Fig. 5.9, p. 189, with the grid from module 10 of the programme. The grid is not filled in: it comes from comparing the as-is curve with the to-be curve."
  ),
  poCompetitor: loc("Competidor", "Competitor"),
  poAddCompetitor: loc("Añadir competidor", "Add competitor"),
  poAttribute: loc("Atributo de valor", "Value attribute"),
  poAsIs: loc("Hoy", "As is"),
  poToBe: loc("Propuesta", "To be"),
  poAddAttribute: loc("Añadir atributo", "Add attribute"),
  poDivergence: loc(
    "Divergencia frente al competidor más parecido",
    "Divergence from the closest competitor"
  ),
  poNoData: loc("sin datos", "no data"),
  poChainTitle: loc("Configuración de la cadena de valor", "Value chain configuration"),
  poChainDesc: loc(
    "Fig. 5.12, p. 193. Dónde se gestiona hoy cada función y dónde debería gestionarse.",
    "Fig. 5.12, p. 193. Where each function is managed today and where it should be managed."
  ),
  poTargetLevel: loc("Objetivo", "Target"),
  poCurrentConfig: loc("Configuración actual", "Current configuration"),
  poTargetConfig: loc("Objetivo", "Target"),
  poCentralize: loc("centralizar", "centralize"),
  poDecentralize: loc("descentralizar", "decentralize"),
  poFrom: loc("de", "from"),
  poTo: loc("a", "to"),
  poTacTitle: loc("Transfer, Adapt, Create", "Transfer, Adapt, Create"),
  poTacDesc: loc(
    "Fig. 5.14, p. 199. Lo etiquetado como «crear» es la brecha de recursos que abre la decisión de build-borrow-buy.",
    "Fig. 5.14, p. 199. What is tagged \u201ccreate\u201d is the resource gap that opens the build-borrow-buy decision."
  ),
  poCapPlaceholder: loc("Recurso, activo o competencia", "Resource, asset or competency"),
  poNoFunction: loc("Sin función", "No function"),
  poUntagged: loc("Sin etiquetar", "Untagged"),
  poAddCapability: loc("Añadir capacidad", "Add capability"),
  poToCreate: loc("Hay que crear", "To be created"),
  poCreationLoad: loc("Carga de creación", "Creation load"),
  poCreationLoadTail: loc(
    "de las capacidades etiquetadas no viajan tal cual.",
    "of the tagged capabilities do not travel as they are."
  ),
  poLofDesc: loc(
    "p. 198. La desventaja y la ventaja superior que la compensa, por separado.",
    "p. 198. The handicap and the superior advantage that offsets it, separately."
  ),
  poHandicap: loc("Desventaja por ser extranjero", "Handicap of being foreign"),
  poCompensating: loc("Ventaja que la compensa", "Advantage that offsets it"),
  poUndeterminedLower: loc("sin determinar", "undetermined"),
  poToastSaved: loc("Posicionamiento guardado", "Positioning saved"),

  // Bloque 3 — entrada
  enWhyTitle: loc("Por qué entrar", "Why enter"),
  enWhyDescTail: loc(
    "El objetivo condiciona el tipo de país, el momento y el modo.",
    "The objective drives the type of country, the timing and the mode."
  ),
  enCountry: loc("País", "Country"),
  enKpis: loc("Indicadores", "KPIs"),
  enTiming: loc("Momento", "Timing"),
  enObjectivePlaceholder: loc(
    "Qué busca la empresa aquí, en concreto",
    "What the firm is after here, specifically"
  ),
  enWhenTitle: loc("Cuándo entrar", "When to enter"),
  enWhenDescPre: loc(
    "Las cuatro fases de la ventana de oportunidad,",
    "The four phases of the window of opportunity,"
  ),
  enPhase: loc("Fase de la ventana", "Window phase"),
  enStance: loc("Posición ante el momento", "Timing stance"),
  enPhaseEvidence: loc("Evidencia que sostiene esa fase", "Evidence behind that phase"),
  enPhaseEvidencePlaceholder: loc(
    "Crecimiento del mercado, número y cuota de competidores, madurez del producto",
    "Market growth, number and share of competitors, product maturity"
  ),
  enWhyStance: loc("Por qué esa posición", "Why that stance"),
  enWhyStancePlaceholder: loc(
    "Si es primer entrante: qué recurso se pre-empta y quién se beneficiaría del trabajo de apertura",
    "If first mover: which resource it pre-empts and who would benefit from the opening work"
  ),
  enFirstMoverPros: loc("Ventajas de ser primero", "First-mover advantages"),
  enFirstMoverCons: loc("Desventajas", "Disadvantages"),
  enPaceTitle: loc("Ritmo de entrada", "Pace of entry"),
  enPaceScale: loc("Escala 0 a 4.", "Scale 0 to 4."),
  enPaceHighPushes: loc(
    "Un valor alto empuja a un compromiso",
    "A high value pushes towards a commitment that is"
  ),
  enPaceFast: loc("rápido", "fast"),
  enPaceGradual: loc("gradual", "gradual"),
  enPaceBalanced: loc("equilibrado", "balanced"),
  enPaceSummaryPre: loc("Con", "With"),
  enPaceSummaryMid: loc(
    "factores contestados, el perfil apunta a un compromiso",
    "pace factors answered, the profile points to a commitment that is"
  ),
  enPaceIndex: loc("índice", "index"),
  enPaceNote: loc(
    "Es una síntesis de los seis factores de la p. 262, no una fórmula del libro: el libro los enumera sin ponderarlos.",
    "This is a synthesis of the six factors on p. 262, not a formula from the book: the book lists them without weighting them."
  ),
  enHowTitle: loc("Cómo entrar", "How to enter"),
  enHowDescPre: loc("El mapa de la", "The map in"),
  enHowDescTail: loc(
    "propone modos según atractivo y clima de inversión; la elección sigue siendo suya.",
    "suggests modes by attractiveness and investment climate; the choice is still yours."
  ),
  enAttractiveness: loc("Atractivo del mercado", "Market attractiveness"),
  enLow: loc("Bajo", "Low"),
  enMedium: loc("Medio", "Medium"),
  enHigh: loc("Alto", "High"),
  enClimate: loc("Clima político de inversión", "Political investment climate"),
  enPoor: loc("Malo", "Poor"),
  enGood: loc("Bueno", "Good"),
  enPreferredMode: loc("Modo preferido", "Preferred mode"),
  enMapPointsTo: loc("El mapa apunta a", "The map points to"),
  enWhyMode: loc("Por qué ese modo", "Why that mode"),
  enGovReq: loc(
    "Requisitos del gobierno que condicionan el modo",
    "Government requirements that constrain the mode"
  ),
  enGovReqPlaceholder: loc(
    "Participación local obligatoria, aprobaciones, contenido local, restricciones sectoriales",
    "Mandatory local ownership, approvals, local content, sector restrictions"
  ),
  enDigitalModel: loc("Modelo de entrada digital (opcional)", "Digital entry model (optional)"),
  enNotApplicable: loc("No aplica", "Not applicable"),
  enToastSaved: loc("Estrategia de entrada guardada", "Entry strategy saved"),

  // Bloque 4 — vía de acceso y socio
  paGapsTitle: loc("Qué falta y cómo conseguirlo", "What is missing and how to get it"),
  paGapsDescTail: loc(
    "El árbol responde en orden y se detiene en la pregunta que decide; no promedia.",
    "The tree answers in order and stops at the question that decides; it does not average."
  ),
  paImportablePre: loc("Del Transfer-Adapt-Create hay", "Transfer-Adapt-Create has"),
  paImportableTail: loc(
    "capacidad(es) marcadas como «crear» que aún no están aquí.",
    "capability(ies) tagged \u201ccreate\u201d that are not here yet."
  ),
  paBring: loc("Traerlas", "Bring them in"),
  paGapPlaceholder: loc("Capacidad que hay que conseguir", "Capability to obtain"),
  paChosenRoute: loc("Vía elegida", "Chosen route"),
  paTreeSays: loc("El árbol dice:", "The tree says:"),
  paAddCapability: loc("Añadir capacidad", "Add capability"),
  paPartnerTitle: loc("El socio", "The partner"),
  paPartnerDescTail: loc(
    "El tipo de socio cambia lo que se puede esperar y lo que hay que vigilar.",
    "The type of partner changes what can be expected and what has to be watched."
  ),
  paPartnerType: loc("Tipo de socio", "Partner type"),
  paUncharacterized: loc("Sin caracterizar", "Not characterized"),
  paCategory: loc("Categoría", "Category"),
  paName: loc("Nombre (si ya hay candidato)", "Name (if there is a candidate)"),
  paSought: loc("Lo que se busca en él", "What you are after"),
  paWatch: loc("Lo que hay que vigilar", "What to watch"),
  paFourFits: loc("Las cuatro pruebas de encaje", "The four fit tests"),
  paEvidencePlaceholder: loc("Evidencia concreta, no impresión", "Concrete evidence, not an impression"),
  paAveragePre: loc("Media", "Average"),
  paAverageMid: loc("sobre", "over"),
  paAverageTail: loc(
    "pruebas. La media se muestra por comodidad: lo que decide es el encaje más débil, porque las cuatro no se compensan entre sí.",
    "tests. The average is shown for convenience: what decides is the weakest fit, because the four do not offset one another."
  ),
  paOptionTitle: loc("La entrada como opción real", "Entry as a real option"),
  paOptionDescTail: loc(
    "Una inversión preliminar sin señales de salida no es una opción, es una apuesta pequeña.",
    "A preliminary investment with no exit signals is not an option, it is a small bet."
  ),
  paPremium: loc("Prima: inversión preliminar", "Premium: preliminary investment"),
  paCurrency: loc("Moneda", "Currency"),
  paTrialYears: loc("Periodo de observación (años)", "Observation period (years)"),
  paTriggers: loc("Señales que disparan la decisión", "Signals that trigger the decision"),
  paSignalPlaceholder: loc("Qué se observa", "What is observed"),
  paThresholdPlaceholder: loc("Umbral verificable", "Verifiable threshold"),
  paExpand: loc("Ampliar", "Expand"),
  paHold: loc("Mantener", "Hold"),
  paRetreat: loc("Replegar", "Retreat"),
  paAddSignal: loc("Añadir señal", "Add signal"),
  paIfDevelops: loc("Si se desarrolla", "If it develops"),
  paIfNot: loc("Si no se desarrolla", "If it does not"),
  paOptionMissing: loc(
    "Falta para que la opción esté estructurada",
    "For the option to be structured you still need"
  ),
  paToastSaved: loc("Vía de acceso y socio guardados", "Access route and partner saved"),

  // Bloque 5 — coherencia
  coLoading: loc("Cruzando los cuatro módulos…", "Cross-checking the four modules…"),
  coIndexTitle: loc("Índice de exhaustividad", "Completeness index"),
  coIndexDesc: loc(
    "Ponderado por el peso de cada módulo en la decisión. Un módulo sin empezar cuenta cero, no «casi hecho».",
    "Weighted by each module's weight in the decision. A module not started counts as zero, not as \u201calmost done\u201d."
  ),
  coCovered: loc("del análisis cubierto", "of the analysis covered"),
  coWeight: loc("peso", "weight"),
  coOf: loc("de", "of"),
  coBlockers: loc("Impide cerrar la decisión", "Blocks closing the decision"),
  coFindingsTitle: loc("Contradicciones entre módulos", "Contradictions between modules"),
  coFindingsDesc: loc(
    "Trece reglas que solo tienen sentido con dos módulos delante. Lo que cada bloque vigila por su cuenta se avisa dentro de él.",
    "Thirteen rules that only make sense with two modules side by side. What each block watches on its own is flagged inside it."
  ),
  coNone: loc(
    "Ninguna contradicción entre lo contestado hasta ahora. Ojo: con módulos a medias, esto dice poco.",
    "No contradiction among what has been answered so far. Careful: with half-filled modules this says little."
  ),
  coBlocks: loc("bloquea", "blocks"),
  coGoTo: loc("Ir a", "Go to"),

  // Panel de evaluación de países — capítulo 6
  caEyebrow: loc("EVALUACIÓN DETALLADA · CAPÍTULO 6", "DETAILED ASSESSMENT · CHAPTER 6"),
  caIntroPre: loc("Puntúe de 0 a", "Score from 0 to"),
  caIntroTail: loc(
    "solo lo que haya podido contrastar; lo que quede sin evaluar se declara como no evaluado y no entra en la puntuación.",
    "only what you have been able to verify; whatever is left unrated is declared unrated and stays out of the score."
  ),
  caAssessed: loc("evaluados", "assessed"),
  caAdverse: loc("4 = desfavorable", "4 = unfavourable"),
  caFavourable: loc("4 = favorable", "4 = favourable"),
  caSource: loc("Fuente", "Source"),
  caEvidencePlaceholder: loc(
    "Evidencia: fuente, entrevista u observación",
    "Evidence: source, interview or observation"
  ),
  caRationaleFor: loc("Justificación de", "Rationale for"),
  caPropose: loc("Proponer desde el caso", "Propose from the case"),
  caReview: loc("Revisar mis puntuaciones", "Review my scores"),
  caCopilotHint: loc(
    "Las propuestas se revisan una a una; ninguna se aplica sola.",
    "Proposals are reviewed one by one; none is applied on its own."
  ),
  caApply: loc("Aplicar", "Apply"),
  caCitation: loc("Cita", "Quote"),
  caNoProposals: loc("Sin propuestas aplicables.", "No applicable proposals."),
  caDiscardedTail: loc(
    "descartadas por falta de cita o justificación.",
    "discarded for lack of a quote or a rationale."
  ),
  caNothingSupports: loc(
    "El material no sostiene ninguna puntuación de este bloque.",
    "The material does not support any score in this block."
  ),
  caNoObjections: loc(
    "El revisor no encontró objeciones en este bloque.",
    "The reviewer found no objections in this block."
  ),
  caContextTitle: loc(
    "Incentivos, sostenibilidad y ciclo de vida",
    "Incentives, sustainability and life cycle"
  ),
  caIncentivesMarked: loc("incentivos marcados", "incentives marked"),
  caIncentivesTitle: loc("Incentivos a la inversión", "Investment incentives"),
  caIncentivesSource: loc("Tabla 6.5, pp. 241-242", "Table 6.5, pp. 241-242"),
  caEsgTitle: loc("Cuestiones ambientales y sociales", "Environmental and social issues"),
  caEsgDesc: loc(
    "El libro las plantea como filtro previo a la inversión, no como matiz.",
    "The book treats them as a filter before investing, not as a nuance."
  ),
  caEsgSource: loc("p. 242", "p. 242"),
  caLifeCycle: loc("Cluster de ciclo de vida", "Life-cycle cluster"),
  caUnclassified: loc("Sin clasificar", "Unclassified"),
  caLifeCycleSource: loc("Tabla 6.2, p. 234", "Table 6.2, p. 234"),
  caDemandGrowth: loc("Demanda típica: crecimiento", "Typical demand: growth"),
  caDemandSize: loc("tamaño", "size"),
  caDemandValueCurve: loc("Curva de valor", "Value curve"),
  caDemandCompetition: loc("Competencia", "Competition"),
  caEase: loc("Facilidad para hacer negocios (0-100)", "Ease of doing business (0-100)"),
  caEaseHelp: loc(
    "Puntuación pública del país. Entra en el factor de apertura junto a la política gubernamental.",
    "The country's public score. It feeds the openness factor alongside government policy."
  ),
  caEasePlaceholder: loc("Ej. 67", "e.g. 67"),

  // Modo trabajo — la tesis
  thTitle: loc("La tesis", "The thesis"),
  thDesc: loc(
    "Un mandato es una pregunta; una tesis es una afirmación que se puede matar. Escriba la segunda.",
    "A mandate is a question; a thesis is a claim that can be killed. Write the second."
  ),
  thCompany: loc("Empresa", "Company"),
  thIndustry: loc("Sector", "Sector"),
  thCountry: loc("País", "Country"),
  thProduct: loc("Producto o negocio", "Product or business"),
  thPresence: loc("Presencia actual en el país", "Current presence in the country"),
  thEntryKind: loc("Tipo de entrada", "Kind of entry"),
  thStance: loc("Posición", "Stance"),
  thGroupConstraint: loc("Restricción del grupo", "Group constraint"),
  thGroupConstraintHelp: loc(
    "Lo que la casa ya ha decidido y esta tesis tiene que respetar o contradecir a la cara.",
    "What the house has already decided, which this thesis must respect or contradict openly."
  ),
  thDeclaredStrategy: loc("Estrategia declarada", "Declared strategy"),
  thDeclaredStrategyPh: loc(
    "Lo que el grupo le ha contado al mercado que va a hacer",
    "What the group has told the market it will do"
  ),
  thReturnThreshold: loc("Umbral de retorno (%)", "Return threshold (%)"),
  thEntities: loc("Entidades y licencias disponibles", "Entities and licences available"),
  thRegGate: loc("Puerta regulatoria", "Regulatory gate"),
  thRegGateHelp: loc(
    "En un sector regulado, el regulador poda los modos antes de que empiece el análisis.",
    "In a regulated sector the regulator prunes the modes before the analysis starts."
  ),
  thRequiresLicence: loc("¿Exige licencia o autorización?", "Does it require a licence or authorization?"),
  thLicenceRoute: loc("Vía de licencia", "Licence route"),
  thMode: loc("Modo", "Mode"),
  thModeUndecided: loc("Por decidir", "To be decided"),
  thHorizon: loc("Horizonte (meses)", "Horizon (months)"),
  thCommitment: loc("Compromiso", "Commitment"),
  thCurrency: loc("Moneda", "Currency"),
  thReasons: loc("Porque… (de una a tres razones)", "Because… (one to three reasons)"),
  thReasonPh: loc("Una razón, en una frase", "One reason, in one sentence"),
  thAddReason: loc("Añadir razón", "Add reason"),
  thToastSaved: loc("Tesis guardada", "Thesis saved"),
  thYes: loc("Sí", "Yes"),
  thNo: loc("No", "No"),
  thRequiresPartner: loc("exige socio", "requires a partner"),
  thRequiresLicenceTag: loc("exige licencia", "requires a licence"),

  // Modo trabajo — el tablero de supuestos
  abEyebrow: loc("Qué sostiene la tesis", "What holds the thesis up"),
  abStatusBlocked: loc("Bloqueada", "Blocked"),
  abStatusAtRisk: loc("En riesgo", "At risk"),
  abStatusClear: loc("Sin veto en contra", "No veto against it"),
  abStatusNotStated: loc("Sin enunciar", "Not stated"),
  abNoThesis: loc(
    "Escriba la tesis en la pestaña del caso y aquí aparecerá de qué depende.",
    "Write the thesis in the case tab and what it depends on will appear here."
  ),
  abCritical: loc("Supuestos que pueden pararla", "Assumptions that can stop it"),
  abShaping: loc("Supuestos que la moldean", "Assumptions that shape it"),
  abBelief: loc("Creencia", "Belief"),
  abConfidence: loc("Confianza", "Confidence"),
  abEvidence: loc("Evidencia", "Evidence"),
  abEvidencePh: loc("Fuente, dato o entrevista", "Source, figure or interview"),
  abFalsifier: loc("Qué lo falsaría", "What would falsify it"),
  abFalsifierPh: loc(
    "El hecho concreto que lo desmentiría",
    "The concrete fact that would disprove it"
  ),
  abFalsifierMissing: loc(
    "Sin esto, el supuesto no está contestado: es una apuesta.",
    "Without this, the assumption is not answered: it is a bet."
  ),
  abOwner: loc("Lo mira", "Checked by"),
  abNoOwner: loc("Nadie en esta cadena lo mira", "Nobody in this chain checks it"),
  abGovernanceGap: loc("Hueco de gobierno", "Governance gap"),
  abGovernanceGapHelp: loc(
    "Un supuesto que puede matar la tesis y que ningún aprobador de esta cadena mira. No es un fallo del modelo: es un hueco de la casa.",
    "An assumption that can kill the thesis and that no approver in this chain looks at. It is not a flaw in the model: it is a gap in the house."
  ),
  abChain: loc("La cadena de aprobación", "The approval chain"),
  abChainHelp: loc(
    "Los vetos corren primero, al revés que en el organigrama.",
    "The vetoes run first, the opposite of the org chart."
  ),
  abOutOfScope: loc("Declarado fuera de alcance", "Declared out of scope"),
  abBlindSpots: loc(
    "Lo que el marco señala y la tesis no menciona",
    "What the framework flags and the thesis does not mention"
  ),
  abKillPairs: loc("Qué la tumba, y quién", "What stops it, and who"),
  abCollapse: loc("Plegar el tablero", "Collapse the board"),
  abExpand: loc("Desplegar el tablero", "Expand the board"),
  abGoToCase: loc("Ir a la tesis", "Go to the thesis"),
  abClear: loc("Despejado", "Clear"),
  abAtRisk: loc("En riesgo", "At risk"),
  abFails: loc("Falla", "Fails"),
  abNotTested: loc("Sin probar", "Not tested"),

  // Idioma

  // Archivo de escenarios
  saCoordination: loc("Coordinación", "Coordination"),
  saArchive: loc("ARCHIVO", "ARCHIVE"),
  saTitle: loc("Escenarios guardados", "Saved scenarios"),
  saSearchPh: loc("Buscar por nombre, empresa o industria", "Search by name, company or industry"),
  saSearchLabel: loc("Buscar escenarios", "Search scenarios"),
  saSignIn: loc("Inicie sesión para conservar análisis.", "Sign in to keep your analyses."),
  saRenameLabel: loc("Nuevo nombre del escenario", "New scenario name"),
  saSave: loc("Guardar", "Save"),
  saCancel: loc("Cancelar", "Cancel"),
  saOpenTag: loc("abierto", "open"),
  saCase: loc("caso", "case"),
  saOpen: loc("Abrir", "Open"),
  saRename: loc("Renombrar", "Rename"),
  saDuplicate: loc("Duplicar", "Duplicate"),
  saDelete: loc("Borrar", "Delete"),
  saFootnote: loc(
    "Abrir un escenario reemplaza lo que haya en el formulario. Los filtros de cribado no se restauran: se dejan abiertos para no ocultar países que el análisis guardado sí incluía.",
    "Opening a scenario replaces whatever is in the form. The screening filters are not restored: they are left open so as not to hide countries the saved analysis did include."
  ),
  saGone: loc("El escenario ya no existe.", "That scenario no longer exists."),
  saOpened: loc("abierto con sus supuestos y su resultado guardados.", "opened with its saved assumptions and result."),
  saNameTooShort: loc("El nombre necesita al menos dos caracteres.", "The name needs at least two characters."),
  saCopySuffix: loc("copia", "copy"),
  saConfirmDeletePre: loc("Borrar", "Delete"),
  saConfirmDeleteTail: loc(
    "y sus puertas de decisión. Esta acción no se puede deshacer.",
    "and its decision gates. This cannot be undone."
  ),
  saDeletedWithGates: loc("puerta(s) de decisión.", "decision gate(s)."),
  saDeletedWithGatesPre: loc("Escenario borrado junto con", "Scenario deleted, along with"),
  saDeleted: loc("Escenario borrado.", "Scenario deleted."),
  saDeleteFailed: loc("No se pudo borrar.", "It could not be deleted."),
  saDuplicated: loc(
    "Copia creada. Las puertas de decisión no se heredan: se aprobaron sobre los supuestos del original.",
    "Copy created. Decision gates are not inherited: they were approved against the original's assumptions."
  ),
  saNoMatch: loc("Ningún escenario coincide con la búsqueda.", "No scenario matches the search."),
  saEmpty: loc("Los análisis guardados aparecerán aquí.", "Saved analyses will appear here."),
  saOpenFailed: loc("No se pudo abrir el escenario.", "The scenario could not be opened."),
  saRenameFailed: loc("No se pudo renombrar.", "It could not be renamed."),
  saDuplicateFailed: loc("No se pudo duplicar.", "It could not be duplicated."),

  // Marco de la aplicación
  dlNoteFramework: loc("Marco capítulos 5–8", "Chapters 5–8 framework"),
  dlNoteSources: loc("Fuentes públicas trazables", "Traceable public sources"),
  dlNoteJudgement: loc("Juicio humano obligatorio", "Human judgement required"),
  dlWorkspace: loc("Espacio de estrategia", "Strategy workspace"),
  dlSignInTitle: loc("Acceso al espacio de estrategia", "Access to the strategy workspace"),
  dlSignInDesc: loc(
    "Inicie sesión para crear análisis de entrada, actualizar datos públicos y conservar sus escenarios.",
    "Sign in to build entry analyses, refresh public data and keep your scenarios."
  ),
  dlSignIn: loc("Iniciar sesión", "Sign in"),
  dlSignOut: loc("Cerrar sesión", "Sign out"),
  dlToggleNav: loc("Alternar navegación", "Toggle navigation"),
  dlPrinciples: loc("Principios", "Principles"),
  dlUser: loc("Usuario", "User"),
  dlPersonalAnalysis: loc("Análisis personal", "Personal analysis"),

  // Caso
  cwNeedTitle: loc("Ponga un título al caso.", "Give the case a title."),
  cwCreateFailed: loc("No se pudo crear el caso.", "The case could not be created."),
  cwNeedParagraph: loc("Pegue al menos un párrafo del caso.", "Paste at least one paragraph of the case."),
  cwTextAdded: loc(
    "Texto añadido. Con texto se pueden verificar las citas contra el original.",
    "Text added. With text, quotes can be verified against the original."
  ),
  cwTextFailed: loc("No se pudo añadir el texto.", "The text could not be added."),
  cwTooLarge: loc("El fichero supera los 20 MB. Pegue el texto o divídalo.", "The file is over 20 MB. Paste the text or split it."),
  cwNoExtractableText: loc(
    "Documento subido, pero sin texto extraíble: las citas no se podrán verificar contra el original.",
    "Document uploaded, but with no extractable text: quotes cannot be verified against the original."
  ),
  cwUploadFailed: loc("No se pudo subir el documento.", "The document could not be uploaded."),
  cwExtractFailed: loc("No se pudo extraer del documento.", "Nothing could be extracted from the document."),
  cwEvidenceFailed: loc("No se pudo actualizar la evidencia.", "The evidence could not be updated."),
  cwPastePlaceholder: loc("Pegue aquí el texto del caso o de un anexo.", "Paste the case text or an annex here."),
  cwTitle: loc("Caso de estudio", "Case study"),
  cwDesc: loc(
    "El caso es la materia prima. Todo lo que se afirme después debe poder rastrearse hasta una cita de estos documentos.",
    "The case is the raw material. Everything claimed afterwards must trace back to a quote from these documents."
  ),
  cwNewCase: loc("Nuevo caso", "New case"),
  cwTitlePlaceholder: loc("Ej. Chandra Components entra en Brasil", "E.g. Chandra Components enters Brazil"),
  cwCreateCase: loc("Crear caso", "Create case"),
  cwPickCase: loc(
    "Cree o seleccione un caso para añadir documentos y construir el libro de evidencias.",
    "Create or select a case to add documents and build the evidence book."
  ),
  cwDocuments: loc("Documentos", "Documents"),
  cwDocumentsDesc: loc(
    "El texto pegado es preferible al PDF: permite comprobar que cada cita aparece de verdad en el original.",
    "Pasted text beats a PDF: it lets each quote be checked against the original."
  ),
  cwSourceName: loc("Nombre de la fuente", "Source name"),
  cwSourcePlaceholder: loc("Ej. Caso HBS 9-712-402", "E.g. HBS case 9-712-402"),
  cwCaseText: loc("Texto del caso", "Case text"),
  cwAddText: loc("Añadir texto", "Add text"),
  cwUploadPdf: loc("Subir PDF", "Upload PDF"),
  cwText: loc("Texto", "Text"),
  cwExtract: loc("Extraer evidencias del documento", "Extract evidence from the document"),
  cwExtractHint: loc(
    "Cada afirmación sin cita literal o sin localizador se descarta en el servidor antes de llegar aquí.",
    "Any claim without a verbatim quote or a locator is discarded on the server before it reaches here."
  ),
  cwEvidenceBook: loc("Libro de evidencias", "Evidence book"),
  cwAcceptedCount: loc("aceptadas", "accepted"),
  cwPendingCount: loc("pendientes de revisión", "pending review"),
  cwNoEvidence: loc(
    "Todavía no hay evidencias. Extraiga del documento o añádalas a mano.",
    "No evidence yet. Extract it from the document or add it by hand."
  ),
  cwAccept: loc("Aceptar", "Accept"),
  cwReject: loc("Rechazar", "Reject"),
  cwRejected: loc("Rechazada", "Rejected"),
  cwAccepted: loc("Aceptada", "Accepted"),
  cwDeleteEvidence: loc("Eliminar evidencia", "Delete evidence"),
  cwReliability: loc("fiabilidad", "reliability"),
  cwAiProposed: loc("propuesta por IA", "proposed by AI"),
  cwQuoteUnverified: loc("cita no verificada contra el original", "quote not verified against the original"),

  // Guía de primera evaluación
  ogEyebrow: loc("guía de primera evaluación", "first-assessment guide"),
  ogReopen: loc("Ver guía de uso", "Show the guide"),
  ogTitle: loc("Cómo funciona el flujo", "How the flow works"),
  ogIntroPre: loc("Los campos se incorporan al borrador en cuanto los edita.", "Fields go into the draft as soon as you edit them."),
  ogIntroBold: loc("No pulse Enter para confirmar:", "Do not press Enter to confirm:"),
  ogIntroTail: loc(
    "use los botones indicados para actualizar fuentes, generar el análisis, guardar el escenario o crear un gate.",
    "use the buttons shown to refresh sources, generate the analysis, save the scenario or open a gate."
  ),
  ogHide: loc("Ocultar guía", "Hide the guide"),
  ogStep1Title: loc("Defina el mandato", "Define the mandate"),
  ogStep1Text: loc("Empresa, país base, industria y modelo de negocio.", "Company, home country, industry and business model."),
  ogStep2Title: loc("Añada y actualice mercados", "Add and refresh markets"),
  ogStep2Empty: loc("Seleccione países; los datos se cargarán automáticamente.", "Select countries; the data loads on its own."),
  ogStep2Added: loc("candidatos añadidos; los datos cargan automáticamente.", "candidates added; the data loads on its own."),
  ogStep2AddedOne: loc("candidato añadido; los datos cargan automáticamente.", "candidate added; the data loads on its own."),
  ogStep3Title: loc("Calibre factores locales", "Calibrate local factors"),
  ogStep3Text: loc(
    "Ajuste oportunidad, distancia, riesgo y capacidades de ejecución.",
    "Adjust opportunity, distance, risk and execution capabilities."
  ),
  ogStep4Title: loc("Complete economía y escenarios", "Complete the economics and the scenarios"),
  ogStep4Text: loc(
    "Introduzca TAM/SAM/SOM, costes y sensibilidades antes de comparar retornos.",
    "Enter TAM/SAM/SOM, costs and sensitivities before comparing returns."
  ),
  ogStep5Title: loc("Genere la evaluación", "Generate the assessment"),
  ogStep5Text: loc(
    "Revise umbrales, alternativas y alertas; guarde el escenario para activar gates.",
    "Review thresholds, alternatives and alerts; save the scenario to enable gates."
  ),
  ogSequenceBold: loc("Secuencia recomendada:", "Recommended sequence:"),
  ogSequenceText: loc(
    "la herramienta no calcula ni guarda automáticamente. Puede volver a cualquier fase y recalcular cuando cambie un supuesto.",
    "the tool does not calculate or save on its own. You can return to any phase and recalculate when an assumption changes."
  ),
  ogMissingBadge: loc("Datos incompletos se muestran como “—”", "Missing data is shown as “—”"),

  // Gates
  apMsPending: loc("Pendiente", "Pending"),
  apMsInProgress: loc("En curso", "In progress"),
  apMsBlocked: loc("Bloqueado", "Blocked"),
  apMsComplete: loc("Completado", "Complete"),
  apMsNotApplicable: loc("No aplica", "Not applicable"),
  apNoDate: loc("Sin fecha", "No date"),
  apNeedResponsible: loc("Indique el responsable del gate.", "Name the owner of the gate."),
  apStatusNotStarted: loc("No iniciado", "Not started"),
  apStatusInReview: loc("En revisión", "In review"),
  apStatusApproved: loc("Aprobado", "Approved"),
  apStatusChanges: loc("Cambios solicitados", "Changes requested"),
  apStatusOnHold: loc("En pausa", "On hold"),
  apStatusClosed: loc("Cerrado", "Closed"),
  apSaveFirst: loc("Guarde el escenario antes de crear un gate de decisión.", "Save the scenario before opening a decision gate."),
  apOnlyEligible: loc(
    "Solo se pueden abrir gates para mercados con recomendación Probar o Avanzar.",
    "Gates can only be opened for markets recommended as Test or Advance."
  ),
  apCreated: loc("Gate creado con cuatro hitos y una revisión programada.", "Gate created with four milestones and a scheduled review."),
  apCreateFailed: loc("No se pudo crear el gate.", "The gate could not be created."),
  apEyebrow: loc("gobierno de ejecución", "execution governance"),
  apTitle: loc("Convierta “Probar” o “Avanzar” en un gate de trabajo.", "Turn “Test” or “Advance” into a working gate."),
  apDesc: loc(
    "El gate documenta responsables, hitos y una fecha de revisión. No autoriza gasto ni una operación financiera: la decisión formal debe seguir las políticas corporativas aplicables.",
    "The gate documents owners, milestones and a review date. It authorises no spending and no financial transaction: the formal decision must follow the applicable corporate policies."
  ),
  apSavedBadge: loc("Escenario guardado", "Scenario saved"),
  apSaveFirstTitle: loc("Primero guarde el escenario actual", "Save the current scenario first"),
  apSaveFirstDescPre: loc("Pulse", "Press"),
  apSaveFirstDescTail: loc(
    "en la cabecera después de generar la evaluación. El historial persistente permitirá asociar los gates a esta versión del análisis.",
    "in the header after generating the assessment. The persistent history then ties gates to this version of the analysis."
  ),
  apSave: loc("Guardar", "Save"),
  apNoneTitle: loc("No hay gates accionables todavía", "No actionable gates yet"),
  apNoneDescPre: loc("La herramienta abre gates únicamente para una recomendación de", "The tool opens gates only for a recommendation of"),
  apNoneDescTail: loc(
    "Complete la economía, escenarios y umbrales y vuelva a generar la evaluación.",
    "Complete the economics, the scenarios and the thresholds, then generate the assessment again."
  ),
  apTest: loc("Probar", "Test"),
  apAdvance: loc("Avanzar", "Advance"),
  apNewGate: loc("NUEVO GATE", "NEW GATE"),
  apAssignTitle: loc("Asigne una revisión responsable", "Assign an accountable review"),
  apAssignDesc: loc(
    "Se crearán cuatro hitos editables con fechas previas a la revisión. Si ya existe un gate para este mercado y escenario, se recuperará el existente para evitar duplicados.",
    "Four editable milestones will be created, dated ahead of the review. If a gate already exists for this market and scenario, the existing one is reused rather than duplicated."
  ),
  apMarket: loc("Mercado", "Market"),
  apSelect: loc("Seleccione", "Select"),
  apResponsible: loc("Responsable", "Owner"),
  apNameOrRole: loc("Nombre o cargo", "Name or role"),
  apReviewer: loc("Revisor", "Reviewer"),
  apOptional: loc("Opcional", "Optional"),
  apReviewDate: loc("Fecha de revisión", "Review date"),
  apScope: loc("Alcance o condiciones del gate", "Gate scope or conditions"),
  apScopePlaceholder: loc(
    "Ej. validación fiscal local, prueba de precio, partner shortlist y límite de inversión de prueba.",
    "E.g. local tax validation, price test, partner shortlist and a test investment cap."
  ),
  apModePending: loc("Modo pendiente", "Mode pending"),
  apCreateGate: loc("Crear gate", "Open gate"),
  apActiveGates: loc("GATES ACTIVOS", "ACTIVE GATES"),
  apTracking: loc("Seguimiento de decisiones", "Decision tracking"),
  apGateAdvance: loc("Gate para avanzar", "Advance gate"),
  apGateTest: loc("Gate de prueba", "Test gate"),
  apOwnerPrefix: loc("Responsable", "Owner"),
  apStatusFailed: loc("No se pudo actualizar el estado del gate.", "The gate status could not be updated."),
  apMilestoneFailed: loc("No se pudo actualizar el hito.", "The milestone could not be updated."),
  apReviewerPrefix: loc("Revisor", "Reviewer"),
  apUnassigned: loc("No asignado", "Unassigned"),
  apGatePrefix: loc("Gate", "Gate"),
  apChangeStatus: loc("Cambiar estado", "Change status"),
  apChangeStatusOf: loc("Cambiar estado de", "Change the status of"),
  apNoGatesTitle: loc("Aún no hay gates para este escenario", "No gates for this scenario yet"),
  apNoGatesDesc: loc(
    "Asigne un responsable y una fecha para crear el primer flujo de revisión.",
    "Assign an owner and a date to create the first review flow."
  ),

  // Severidad de las objeciones del copiloto
  sevHigh: loc("alta", "high"),
  sevMedium: loc("media", "medium"),
  sevLow: loc("baja", "low"),

  // Pantalla principal
  hmTitle: loc("Global Entry Strategy Studio", "Global Entry Strategy Studio"),
  hmTagline: loc("Diseñe antes de entrar.", "Design before you enter."),
  hmSubtitle: loc(
    "Un instrumento de juicio estratégico. No un ranking universal de países.",
    "An instrument for strategic judgement. Not a universal country ranking."
  ),
  hmScenario: loc("Escenario", "Scenario"),
  hmPrincipleBold: loc("Principio de uso:", "How to use it:"),
  hmPrincipleText: loc(
    "el modelo estructura evidencia y supuestos; no sustituye el caso financiero, la investigación de mercado ni la debida diligencia.",
    "the model structures evidence and assumptions; it replaces neither the financial case, nor market research, nor due diligence."
  ),
  hmPart2Ch5: loc("PARTE II · CAPÍTULO 5", "PART II · CHAPTER 5"),
  hmBriefTitle: loc("Defina el mandato antes de puntuar países", "Define the mandate before scoring countries"),
  hmBriefDesc: loc(
    "El resultado depende de la ambición, la propuesta de valor y las capacidades de la empresa, no solo de la macroeconomía.",
    "The result depends on the ambition, the value proposition and the company's capabilities, not on macroeconomics alone."
  ),
  hmCompany: loc("Empresa o proyecto", "Company or project"),
  hmCompanyPh: loc("Nombre o identificador del caso", "Name or identifier of the case"),
  hmHomeCountry: loc("País base", "Home country"),
  hmHomeCountryPh: loc("País desde el que se expande", "The country it expands from"),
  hmIndustry: loc("Industria / subindustria", "Industry / sub-industry"),
  hmIndustryPh: loc("Ej. software B2B, equipamiento médico", "E.g. B2B software, medical equipment"),
  hmBusinessModel: loc("Modelo de negocio", "Business model"),
  hmBusinessModelPh: loc("Ej. B2B, B2C, SaaS, franquicia", "E.g. B2B, B2C, SaaS, franchise"),
  hmValueProp: loc("Propuesta de valor y ventaja relevante", "Value proposition and the advantage that matters"),
  hmValuePropPh: loc(
    "¿Qué necesidad resuelve y qué activo, capacidad o posición hace defendible la oferta?",
    "What need does it solve, and what asset, capability or position makes the offer defensible?"
  ),
  hmObjective: loc("Objetivo principal de entrada", "Main entry objective"),
  hmHorizon: loc("Horizonte (años)", "Horizon (years)"),
  hmFrameworkTag: loc("MARCO DE DECISIÓN", "DECISION FRAMEWORK"),
  hmFrameworkTitle: loc("Cuatro decisiones conectadas", "Four connected decisions"),
  hmChosenObjective: loc("Objetivo elegido", "Objective chosen"),
  hmStep1: loc("Ambición", "Ambition"),
  hmStep1Text: loc(
    "Definir el papel que debe jugar la geografía en la estrategia global.",
    "Define the role geography should play in the global strategy."
  ),
  hmStep2: loc("Atractividad", "Attractiveness"),
  hmStep2Text: loc(
    "Evaluar mercado, recursos, competencia, distancia, riesgo e incentivos.",
    "Assess market, resources, competition, distance, risk and incentives."
  ),
  hmStep3: loc("Entrada", "Entry"),
  hmStep3Text: loc(
    "Decidir momento, secuencia, control, compromiso y modo de entrada.",
    "Decide timing, sequence, control, commitment and entry mode."
  ),
  hmStep4: loc("Ejecución", "Execution"),
  hmStep4Text: loc(
    "Asegurar encaje, viabilidad financiera y gobernanza de la alternativa.",
    "Secure the fit, the financial viability and the governance of the alternative."
  ),
  hmPart2Ch6: loc("PARTE II · CAPÍTULO 6", "PART II · CHAPTER 6"),
  hmUniverseTitle: loc("Construya un universo defendible", "Build a defensible universe"),
  hmUniverseDesc: loc(
    "Añada los países que quiere explorar. Después aplique filtros transparentes y exclusiones explícitas; el sistema no presupone mercados candidatos.",
    "Add the countries you want to explore. Then apply transparent filters and explicit exclusions; the system presumes no candidate markets."
  ),
  hmAdd: loc("Añadir", "Add"),
  hmPickCountry: loc("Seleccionar país del catálogo", "Pick a country from the catalogue"),
  hmNoCandidates: loc("Aún no hay mercados candidatos", "No candidate markets yet"),
  hmNoCandidatesDesc: loc(
    "Añada un país del catálogo para comenzar. Puede comparar hasta 12 en cada escenario.",
    "Add a country from the catalogue to start. You can compare up to 12 in a scenario."
  ),
  hmScreenRules: loc("Reglas de preselección", "Screening rules"),
  hmScreenRulesDesc: loc(
    "Se aplican tras actualizar datos. Un candidato que no pasa la regla se excluye de la evaluación, pero permanece visible para revisión.",
    "They apply after the data is refreshed. A candidate that fails a rule is excluded from the assessment but stays visible for review."
  ),
  hmMinPopulation: loc("Población mínima (M)", "Minimum population (M)"),
  hmMinGdp: loc("PIB mínimo (US$ B)", "Minimum GDP (US$ B)"),
  hmMinGrowth: loc("Crecimiento mínimo (%)", "Minimum growth (%)"),
  hmNoFilter: loc("Sin filtro", "No filter"),
  hmExcludeIso: loc("Excluir por código ISO (opcional)", "Exclude by ISO code (optional)"),
  hmExcludeIsoPh: loc("Ej. BR, IN", "E.g. BR, IN"),
  hmCandidates: loc("Candidatos", "Candidates"),
  hmPassFilter: loc("Pasan filtro", "Pass the filter"),
  hmExternalData: loc("DATOS EXTERNOS", "EXTERNAL DATA"),
  hmFactualBase: loc("Base factual", "Factual base"),
  hmFactualBaseDesc: loc(
    "Los indicadores macroeconómicos, fiscales y de divisa se actualizan desde fuentes públicas. Los factores estratégicos se califican separadamente para no fingir una precisión inexistente.",
    "Macroeconomic, tax and currency indicators are refreshed from public sources. Strategic factors are scored separately, so as not to feign a precision that does not exist."
  ),
  hmContextTag: loc("CONTEXTUALICE LA EVIDENCIA", "PUT THE EVIDENCE IN CONTEXT"),
  hmCalibrateTitle: loc("Calibre los factores no reducibles a macrodatos", "Calibrate what macro data cannot capture"),
  hmCalibrateDesc: loc(
    "Use una escala de 0 a 100. Los factores de riesgo y distancia se leen como exposición: 100 equivale a la exposición más alta.",
    "Use a 0 to 100 scale. Risk and distance factors read as exposure: 100 is the highest exposure."
  ),
  hmDefineMarketsFirst: loc("Primero defina los mercados", "Define the markets first"),
  hmDefineMarketsFirstDesc: loc(
    "Añada candidatos en la fase 2 para poder calibrar su atractivo estratégico.",
    "Add candidates in phase 2 to be able to calibrate their strategic attractiveness."
  ),
  hmDisciplineBold: loc("Disciplina analítica:", "Analytical discipline:"),
  hmDisciplineText: loc(
    "cada puntuación debe poder justificarse con una fuente, entrevista, prueba de mercado, asesor local o supuesto explícito.",
    "every score must be justifiable with a source, an interview, a market test, a local adviser or an explicit assumption."
  ),
  hmActiveCountry: loc("PAÍS ACTIVO", "ACTIVE COUNTRY"),
  hmRationalePh: loc("Fuente u observación que sostiene este juicio", "Source or observation that holds this judgement up"),
  hmNoActiveCountry: loc("Sin país activo", "No active country"),
  hmNoActiveCountryDesc: loc(
    "Seleccione un mercado candidato para asignar los supuestos específicos del caso.",
    "Select a candidate market to set the assumptions specific to the case."
  ),
  hmWeightingTag: loc("LÓGICA DE PONDERACIÓN", "WEIGHTING LOGIC"),
  hmWeightingTitle: loc("Exprese las prioridades del mandato", "State the mandate's priorities"),
  hmWeightingDesc: loc(
    "Los pesos no son “verdad”; hacen visibles los trade-offs. El motor normaliza los pesos automáticamente.",
    "Weights are not “truth”; they make the trade-offs visible. The engine normalises them automatically."
  ),
  hmFinanceEyebrow: loc("caso económico y sensibilidad", "economic case and sensitivity"),
  hmFinanceTitle: loc("Modele el flujo de caja y sométalo a presión.", "Model the cash flow and put it under pressure."),
  hmFinanceDesc: loc(
    "La actualización pública completa moneda, tipo de cambio e impuesto corporativo; los tres continúan siendo editables. Los escenarios alteran precio/ingreso, margen operativo y FX sin cambiar la tesis base.",
    "The public refresh fills in currency, exchange rate and corporate tax; all three stay editable. The scenarios move price/revenue, operating margin and FX without changing the base thesis."
  ),
  hmActiveMarket: loc("MERCADO ACTIVO", "ACTIVE MARKET"),
  hmPerCountryPre: loc("Los supuestos se registran por país. Pulse", "Assumptions are recorded per country. Press"),
  hmRefreshMarketTax: loc("Actualizar mercado y fiscal", "Refresh market and tax data"),
  hmPerCountryTail: loc(
    "en la fase 2 para cargar fuentes públicas; no requiere Enter.",
    "in phase 2 to load the public sources; no Enter needed."
  ),
  hmAddMarketsFirst: loc("Primero añada mercados", "Add markets first"),
  hmAddMarketsFirstDesc: loc(
    "La estimación TAM/SAM/SOM se configura de forma separada para cada país candidato.",
    "The TAM/SAM/SOM estimate is configured separately for each candidate country."
  ),
  hmEntryCashFlow: loc("Flujo de caja de entrada", "Entry cash flow"),
  hmEntryCashFlowPre: loc(
    "El valor terminal se calcula por perpetuidad y exige que la tasa de descuento supere el crecimiento terminal. La edición de impuesto o FX cambia su estado a",
    "Terminal value is computed as a perpetuity and requires the discount rate to exceed terminal growth. Editing the tax rate or FX changes its status to"
  ),
  hmManual: loc("manual", "manual"),
  hmEntryCashFlowTail: loc("; actualizar vuelve a cargar la referencia pública.", "; refreshing loads the public reference again."),
  hmCurrencyConvention: loc("Mercado y convención monetaria", "Market and currency convention"),
  hmLocalCurrency: loc("Moneda local", "Local currency"),
  hmReportingCurrency: loc("Moneda de reporte", "Reporting currency"),
  hmFxReportLocal: loc("FX reporte / local", "FX reporting / local"),
  hmFromSource: loc("Se actualiza desde fuente", "Refreshed from a source"),
  hmExchangeRate: loc("Tipo de cambio", "Exchange rate"),
  hmMarketSizeTitle: loc("Tamaño de mercado y flujo libre", "Market size and free cash flow"),
  hmTamYearOne: loc("TAM año 1", "TAM year 1"),
  hmAnnualGrowth: loc("Crecimiento anual (%)", "Annual growth (%)"),
  hmSamPct: loc("SAM (% TAM)", "SAM (% of TAM)"),
  hmSomYearOne: loc("SOM año 1 (% SAM)", "SOM year 1 (% of SAM)"),
  hmOperatingMargin: loc("Margen operativo (%)", "Operating margin (%)"),
  hmTaxRate: loc("Tasa fiscal (%)", "Tax rate (%)"),
  hmWorkingCapital: loc("Capital de trabajo (% ingresos)", "Working capital (% of revenue)"),
  hmDiscountRate: loc("Tasa de descuento (%)", "Discount rate (%)"),
  hmTerminalGrowth: loc("Crecimiento terminal (%)", "Terminal growth (%)"),
  hmCorporateTax: loc("Impuesto corporativo", "Corporate tax"),
  hmScenarioSensitivity: loc("Sensibilidad por escenarios", "Scenario sensitivity"),
  hmScenarioSensitivityDesc: loc(
    "Base mantiene sus supuestos actuales. En los escenarios optimista y conservador, exprese precio/ingreso y FX como variación porcentual; el margen es una variación en puntos porcentuales.",
    "Base keeps your current assumptions. In the optimistic and conservative scenarios, express price/revenue and FX as a percentage change; margin is a change in percentage points."
  ),
  hmHypothetical: loc("Hipotético", "Hypothetical"),
  hmScenarioBase: loc("Base", "Base"),
  hmScenarioOptimistic: loc("Optimista", "Optimistic"),
  hmScenarioConservative: loc("Conservador", "Conservative"),
  hmPerModeEconomics: loc("Economía por alternativa de entrada", "Economics by entry alternative"),
  hmPerModeEconomicsDesc: loc(
    "La inversión inicial se registra en t=0. El coste anual, la captura de ingresos y el capital de trabajo alimentan los flujos libres después de impuestos.",
    "The initial investment is booked at t=0. Annual cost, revenue capture and working capital feed the after-tax free cash flows."
  ),
  hmMode: loc("Modo", "Mode"),
  hmCommitment: loc("Compromiso", "Commitment"),
  hmInitialInvestment: loc("Inversión inicial", "Initial investment"),
  hmAnnualCost: loc("Coste anual", "Annual cost"),
  hmRevenueCapture: loc("Captura de ingresos (%)", "Revenue capture (%)"),
  hmConventionBold: loc("Convención:", "Convention:"),
  hmConventionText: loc(
    "ROI = (flujo libre acumulado − inversión inicial) / inversión inicial y excluye el valor terminal. NPV incluye flujos libres descontados y valor terminal. No se incorporan financiación, depreciación, amortización, retenciones ni cambios fiscales futuros; añádalos en un modelo corporativo si son materiales.",
    "ROI = (cumulative free cash flow − initial investment) / initial investment, and it excludes terminal value. NPV includes discounted free cash flows and terminal value. Financing, depreciation, amortisation, withholding taxes and future tax changes are not included; add them in a corporate model if they are material."
  ),
  hmPickMarketLeft: loc(
    "Seleccione un mercado en la columna izquierda para introducir el caso económico.",
    "Select a market in the left-hand column to enter the economic case."
  ),
  hmGovernanceTag: loc("GOBIERNO DE INVERSIÓN", "INVESTMENT GOVERNANCE"),
  hmThresholdsTitle: loc("Umbrales de decisión", "Decision thresholds"),
  hmThresholdsPre: loc(
    "Estas reglas determinan si una alternativa se clasifica como",
    "These rules determine whether an alternative is classified as"
  ),
  hmAdvance: loc("Avanzar", "Advance"),
  hmTest: loc("Probar", "Test"),
  hmDiscard: loc("Descartar", "Discard"),
  hmOr: loc("o", "or"),
  hmThresholdsTail: loc(
    ". Una recomendación solo se genera con evidencia financiera completa y moneda consistente.",
    ". A recommendation is issued only with complete financial evidence and a consistent currency."
  ),
  hmRuleBold: loc("Regla:", "Rule:"),
  hmRuleText: loc(
    "“Avanzar” requiere superar todos los umbrales de avance. “Probar” exige superar los mínimos de prueba y permite una entrada reversible. “Descartar” significa no asignar inversión material con la evidencia actual. El límite de inversión para prueba es opcional.",
    "“Advance” requires clearing every advance threshold. “Test” requires clearing the test minimums and allows a reversible entry. “Discard” means committing no material investment on the current evidence. The test investment cap is optional."
  ),
  hmThresholdCurrency: loc("Moneda de umbrales", "Threshold currency"),
  hmSameAsReporting: loc("Igual a moneda de reporte", "Same as the reporting currency"),
  hmRiskAdjAdvance: loc("Riesgo ajustado · avanzar", "Risk-adjusted · advance"),
  hmRiskAdjTest: loc("Riesgo ajustado · probar", "Risk-adjusted · test"),
  hmMinConfidence: loc("Confianza mínima (%)", "Minimum confidence (%)"),
  hmMinNpvAdvance: loc("NPV mínimo · avanzar", "Minimum NPV · advance"),
  hmMinNpvTest: loc("NPV mínimo · probar", "Minimum NPV · test"),
  hmMinRoiAdvance: loc("ROI mínimo · avanzar (%)", "Minimum ROI · advance (%)"),
  hmMinRoiTest: loc("ROI mínimo · probar (%)", "Minimum ROI · test (%)"),
  hmMaxPayback: loc("Recuperación máx. · avanzar (años)", "Maximum payback · advance (years)"),
  hmMaxInvestment: loc("Inversión máx. · prueba", "Maximum investment · test"),
  hmNoLimit: loc("Sin límite", "No limit"),
  hmCompareEyebrow: loc("comparación de predecisión", "pre-decision comparison"),
  hmCompareTitle: loc("Vea los mercados bajo la misma lente.", "See the markets through one lens."),
  hmCompareDesc: loc(
    "Seleccione hasta cuatro países. La vista compara evidencia, supuestos y resultados, sin ocultar los datos ausentes.",
    "Select up to four countries. The view compares evidence, assumptions and results, without hiding what is missing."
  ),
  hmGoToDecision: loc("Ir a decisión", "Go to the decision"),
  hmPickToCompare: loc("Seleccione mercados para comparar", "Select markets to compare"),
  hmPickToCompareDesc: loc(
    "Elija entre dos y cuatro países para crear una vista lado a lado antes de avanzar a la decisión.",
    "Pick two to four countries to build a side-by-side view before moving to the decision."
  ),
  hmDecisionTitle: loc("La decisión debe seguir a la evidencia.", "The decision must follow the evidence."),
  hmDecisionDesc: loc(
    "Cuando haya completado el mandato, los mercados y la calibración, genere una lectura comparativa de atractivo, riesgo, timing y modos de entrada.",
    "Once the mandate, the markets and the calibration are complete, generate a comparative reading of attractiveness, risk, timing and entry modes."
  ),
  hmDecisionEyebrow: loc("lectura ajustada por riesgo", "risk-adjusted reading"),
  hmLeadingScore: loc("Puntuación líder", "Leading score"),
  hmRecalculate: loc("Recalcular", "Recalculate"),
  hmMarketPriority: loc("Prioridad de mercado", "Market priority"),
  hmMarketPriorityDesc: loc(
    "Orden basada en la combinación explícita de atractividad y seguridad. La confianza muestra cuánta información está disponible, no la probabilidad de éxito.",
    "Ordered by the explicit combination of attractiveness and safety. Confidence shows how much information is available, not the probability of success."
  ),
  hmHowToRead: loc("Cómo leer el resultado", "How to read the result"),
  hmAttractivenessHelp: loc(
    "Mercado, recursos, competencia, gobierno y encaje CAGE.",
    "Market, resources, competition, government and CAGE fit."
  ),
  hmSafety: loc("Seguridad", "Safety"),
  hmSafetyHelp: loc(
    "Inverso de la exposición política, económica, competitiva y operativa.",
    "The inverse of political, economic, competitive and operational exposure."
  ),
  hmConfidence: loc("Confianza", "Confidence"),
  hmConfidenceHelp: loc(
    "Cobertura de datos públicos y explicitud de los supuestos introducidos.",
    "Coverage of public data, and how explicit the assumptions entered are."
  ),
  hmRouteTitle: loc("Ruta recomendada por mercado", "Recommended route by market"),
  hmRouteDesc: loc(
    "El modo no se determina solo por puntuación. Cruza atractivo, riesgo, capacidades internas, urgencia, control, IP y apertura regulatoria.",
    "The mode is not decided by score alone. It crosses attractiveness, risk, internal capabilities, urgency, control, IP and regulatory openness."
  ),
  hmDetailedPdf: loc("PDF detallado", "Detailed PDF"),
  hmThresholdDecision: loc("Decisión por umbrales", "Threshold decision"),
  hmEconomicViability: loc("Viabilidad económica", "Economic viability"),
  hmFullCashFlow: loc("Flujo de caja completo", "Full cash flow"),
  hmPendingAssumptions: loc("Supuestos pendientes", "Assumptions still open"),
  hmTamHorizon: loc("TAM horizonte", "TAM at horizon"),
  hmSomRevenue: loc("SOM ingresos", "SOM revenue"),
  hmPayback: loc("Recup.", "Payback"),
  hmYear: loc("Año", "Year"),
  hmYears: loc("años", "years"),
  hmEvidenceConfidence: loc("Confianza de evidencia", "Evidence confidence"),
  hmDecisionCondition: loc("Condición de decisión", "Decision condition"),
  hmGenerateAssessment: loc("Generar evaluación", "Generate the assessment"),
  hmMarketsReady: loc("mercados listos para analizar", "markets ready to analyse"),
  hmMissingMandate: loc(
    "Faltan datos del mandato o mercados que pasen el filtro",
    "The mandate is incomplete, or no market passes the filter"
  ),
  hmComparisonDone: loc("Comparación completada", "Comparison complete"),
  hmMissingColon: loc("Faltan", "Missing"),
  hmPending: loc("Pendiente", "Pending"),
  hmPickAMarket: loc("Seleccione un mercado", "Select a market"),
  hmTaxFxUpdated: loc("Impuesto y FX actualizados", "Tax and FX refreshed"),
  hmCompleteAssumptions: loc("Complete o actualice los supuestos", "Complete or refresh the assumptions"),
  hmEg: loc("Ej.", "E.g."),
  hmFcfFormula: loc("FCF = EBIT − impuestos − Δ capital de trabajo", "FCF = EBIT − taxes − Δ working capital"),
  hmClose: loc("Cerrar", "Close"),
  hmManualAdjustment: loc("ajuste manual", "manual adjustment"),
  hmManualAdjustments: loc("ajustes manuales", "manual adjustments"),
  hmAssumptionsTag: loc("SUPUESTOS", "ASSUMPTIONS"),
  hmSomAtYear: loc("SOM año", "SOM year"),
  hmOfSam: loc("(% SAM)", "(% of SAM)"),
  hmIndicatorsVisible: loc("Indicadores visibles", "Indicators available"),
  hmIndicatorsMacro: loc("macro", "macro"),
  hmIndicatorsTaxes: loc("impuestos", "tax"),
  hmIndicatorsWgiBackground: loc("WGI sigue cargando en segundo plano.", "WGI is still loading in the background."),
  hmWgiRefreshed: loc("Indicadores WGI actualizados para este mercado.", "WGI indicators refreshed for this market."),
  hmWgiUnreachable: loc("No se pudo contactar con la fuente WGI.", "The WGI source could not be reached."),
  hmWgiRetryFailed: loc("No se pudo reintentar WGI para este mercado.", "WGI could not be retried for this market."),
  hmScenarioUpdated: loc(
    "Escenario actualizado y reevaluado con los supuestos de ahora.",
    "Scenario updated and re-evaluated with the current assumptions."
  ),
  hmScenarioUpdateFailed: loc("No se pudo actualizar el escenario.", "The scenario could not be updated."),
  hmNothingToSave: loc("No hay un escenario completo que guardar.", "There is no complete scenario to save."),
  hmScenarioSaved: loc("Escenario guardado en el historial personal.", "Scenario saved to your personal history."),
  hmCopilotFailed: loc("El copiloto no pudo proponer puntuaciones.", "The copilot could not propose scores."),
  hmReviewerFailed: loc("El revisor no pudo ejecutarse.", "The reviewer could not run."),
  hmRationaleFor: loc("Justificación de", "Rationale for"),
  hmPickACountry: loc("Seleccione un país", "Select a country"),
  hmJustified: loc("justificados", "with a rationale"),
  hmAssessed: loc("evaluado", "assessed"),
  hmNewAnalysis: loc("Nuevo análisis", "New analysis"),
  hmUntitledAnalysis: loc("Análisis sin título", "Untitled analysis"),
  hmAlreadyAdded: loc("El país ya está en la comparación.", "That country is already in the comparison."),
  hmMaxTwelve: loc("El análisis admite hasta 12 países por escenario.", "The analysis takes up to 12 countries per scenario."),
  hmMaxFourCompare: loc("La vista lado a lado admite hasta cuatro países.", "The side-by-side view takes up to four countries."),
  hmWgiNoData: loc("La fuente WGI no devolvió datos para este país.", "The WGI source returned no data for this country."),
  hmWgiPartial: loc(
    "Los indicadores macro y financieros se actualizaron; WGI no respondió y se puede intentar de nuevo.",
    "The macro and financial indicators were refreshed; WGI did not answer and can be retried."
  ),
  hmWgiKeepOthers: loc(
    "WGI no devolvió datos; puede conservar los demás indicadores o intentarlo más tarde.",
    "WGI returned no data; you can keep the other indicators or try again later."
  ),
  hmSourceUnavailable: loc(
    "La fuente pública no está disponible temporalmente. El país se mantiene añadido; vuelva a actualizarlo en unos instantes.",
    "The public source is temporarily unavailable. The country stays added; refresh it again in a moment."
  ),
  hmRefreshFailed: loc(
    "No se pudieron actualizar los datos públicos. Revise la conexión e inténtelo de nuevo.",
    "The public data could not be refreshed. Check the connection and try again."
  ),
  hmAddCountryFirst: loc("Añada primero al menos un país candidato.", "Add at least one candidate country first."),
  hmIncompleteProfile: loc(
    "Complete el perfil de empresa y mantenga al menos un país tras el filtro.",
    "Complete the company profile and keep at least one country past the filter."
  ),
  hmEvaluationDone: loc(
    "Análisis estratégico generado. Revise supuestos y alertas antes de decidir.",
    "Strategic analysis generated. Review the assumptions and the alerts before deciding."
  ),
  hmEvaluationFailed: loc("No se pudo generar la evaluación.", "The assessment could not be generated."),
  hmNewCaseCleared: loc(
    "Caso nuevo: el formulario se ha vaciado para no arrastrar el análisis anterior.",
    "New case: the form was cleared so the previous analysis is not carried over."
  ),
  hmIncompleteScenario: loc(
    "El escenario está incompleto: complete el perfil y deje al menos un país tras el filtro.",
    "The scenario is incomplete: complete the profile and leave at least one country past the filter."
  ),
  hmGenerateFirstShort: loc("Genere evaluación", "Generate the assessment"),
  hmCompleteAlternative: loc(
    "Complete los supuestos financieros de una alternativa.",
    "Complete the financial assumptions of one alternative."
  ),
  hmDecisionConditionTail: loc(
    "Antes de invertir, convierta la alternativa preferida en un caso financiero con escenarios, sensibilidad, ROI/NPV y una revisión legal, regulatoria y de socios.",
    "Before investing, turn the preferred alternative into a financial case with scenarios, sensitivity, ROI/NPV and a legal, regulatory and partner review."
  ),
  hmIndicatorsTitle: loc("Indicadores actualizados y estimaciones", "Refreshed indicators and estimates"),
  hmIndicatorsPre: loc(
    "PIB, IED, impuesto corporativo y FX se descargan al añadir el país. WGI se completa después. Use",
    "GDP, FDI, corporate tax and FX download when the country is added. WGI fills in afterwards. Use"
  ),
  hmEdit: loc("Editar", "Edit"),
  hmIndicatorsTail: loc(
    "para sustituir cifras por sus fuentes; la etiqueta Manual evita confundirlas con datos públicos.",
    "to replace figures with your own sources; the Manual tag keeps them from being mistaken for public data."
  ),
  hmLastUpdateBold: loc("Última actualización:", "Last refresh:"),
  hmLastUpdateText: loc("fecha de la última carga pública por país.", "the date of the last public load for that country."),
  hmRetryWgiBold: loc("Reintentar WGI:", "Retry WGI:"),
  hmRetryWgiText: loc("no vuelve a consultar los demás indicadores.", "it does not re-query the other indicators."),
  hmRestoreBold: loc("Restaurar:", "Restore:"),
  hmRestoreText: loc("repone solo el campo público modificado.", "it puts back only the public field you changed."),
  hmColMarket: loc("Mercado", "Market"),
  hmColStatus: loc("Estado", "Status"),
  hmColGdp: loc("PIB (US$)", "GDP (US$)"),
  hmColGdpPc: loc("PIB / hab. (US$)", "GDP per capita (US$)"),
  hmColRealGdp: loc("PIB real", "Real GDP"),
  hmColFdi: loc("IED neta (US$)", "Net FDI (US$)"),
  hmColFdiGdp: loc("IED / PIB", "FDI / GDP"),
  hmColCorpTax: loc("Imp. corp.", "Corp. tax"),
  hmColFx: loc("FX USD / local", "FX USD / local"),
  hmColLastUpdate: loc("Últ. actualización", "Last refresh"),
  hmUpdating: loc("Actualizando", "Refreshing"),
  hmLoading: loc("Cargando", "Loading"),
  hmRetryWgi: loc("Reintentar WGI", "Retry WGI"),
  hmManualTag: loc("Manual", "Manual"),
  hmPublicSource: loc("Fuente pública", "Public source"),
  hmPublicTag: loc("Público", "Public"),
  hmRestorePublic: loc("Restaurar dato público", "Restore the public figure"),
  hmGdpHelp: loc("PIB corriente en US$", "Current GDP in US$"),
  hmGdpPcHelp: loc("PIB corriente por habitante en US$", "Current GDP per capita in US$"),
  hmGdpGrowthHelp: loc("Crecimiento anual del PIB real, en porcentaje", "Annual real GDP growth, in per cent"),
  hmFdiHelp: loc("Flujos netos de IED en US$", "Net FDI flows in US$"),
  hmFdiGdpHelp: loc("IED neta como porcentaje del PIB", "Net FDI as a percentage of GDP"),
  hmTaxHelp: loc("Tasa corporativa estatutaria en porcentaje", "Statutory corporate rate, in per cent"),
  hmFxHelp: loc(
    "Unidades de moneda de reporte por una unidad de moneda local",
    "Units of reporting currency per one unit of local currency"
  ),
  hmLeadingAlternative: loc("Alternativa económica líder", "Leading economic alternative"),
  hmGdp: loc("PIB", "GDP"),
  hmGdpGrowth: loc("Crecimiento PIB", "GDP growth"),
  hmFdiUnctad: loc("IED neta (UNCTAD)", "Net FDI (UNCTAD)"),
  hmGovernanceWgi: loc("Gobernanza WGI", "WGI governance"),
  hmDecision: loc("Decisión", "Decision"),
  hmAttractiveness: loc("Atractividad", "Attractiveness"),
  hmTamAtHorizon: loc("TAM en horizonte", "TAM at horizon"),
  hmSomAtHorizon: loc("SOM · ingresos horizonte", "SOM · revenue at horizon"),
  hmThreeScenarios: loc("Base / optimista / conservador", "Base / optimistic / conservative"),
  hmOppRiskMatrix: loc("Matriz oportunidades x riesgos", "Opportunity × risk matrix"),
  hmOpportunity: loc("Oportunidad", "Opportunity"),
  hmRisk: loc("Riesgo", "Risk"),
  hmProfile: loc("Perfil", "Profile"),
  hmGrowthVolatility: loc("Volatilidad del crecimiento", "Growth volatility"),
  hmChapter6Assessment: loc("Evaluación cap. 6", "Chapter 6 assessment"),
  hmNoSource: loc("Sin fuente", "No source"),
  hmNoSourcePre: loc("pulse", "press"),
  hmSensitivity: loc("Sensibilidad", "Sensitivity"),
  hmSensitivitySelected: loc("Sensibilidad de la alternativa seleccionada", "Sensitivity of the selected alternative"),
  hmCompleteSensitivities: loc("Complete sensibilidades", "Fill in the sensitivities"),
  hmNotMeaningful: loc("No significativo", "Not meaningful"),
  hmStatusComplete: loc("Completo", "Complete"),
  hmStatusPartial: loc("Parcial", "Partial"),
  hmStatusEmpty: loc("Sin datos", "No data"),
  hmUnavailable: loc("No disponible", "Unavailable"),
  hmObserved: loc("observado", "observed"),
  hmNoVariation: loc("Sin variación", "No variation"),
  hmHypotheticalUp: loc("Mejora hipotética", "A hypothetical improvement"),
  hmHypotheticalDown: loc("Tensión hipotética", "A hypothetical strain"),
  hmEnterValue: loc("Introduzca", "Enter"),
  hmPriceRevenue: loc("Precio / ingreso", "Price / revenue"),
  hmMarginShort: loc("Margen operativo", "Operating margin"),
  hmPercentagePoints: loc("p.p.", "pp"),
  hmNoSourceTail: loc("en la fase 2 o introduzca un valor manual.", "in phase 2, or enter a value by hand."),
  hmSaveFirstLogin: loc("Inicie sesión para guardar el escenario.", "Sign in to save the scenario."),
  hmGenerateFirst: loc("Genere primero una evaluación para exportarla.", "Generate an assessment first, so there is something to export."),
  hmPdfDone: loc("Informe PDF detallado generado.", "Detailed PDF report generated."),
  hmPdfFailed: loc("No se pudo crear el informe PDF.", "The PDF report could not be created."),

  // Pila de ingresos
  rsTitle: loc("Cuenta de resultados por líneas", "P&L by line"),
  rsDesc: loc(
    "Las partidas reales del negocio, cada una atada a su propio driver. Sustituye al par captura-más-margen: el ingreso deja de derivarse del SOM y el SOM pasa a ser el contraste contra el que se comprueba.",
    "The real line items of the business, each tied to its own driver. It replaces the capture-and-margin pair: revenue stops being derived from the SOM, and the SOM becomes the check it is measured against."
  ),
  rsNotDeclared: loc("Sin cuenta declarada", "No P&L declared"),
  rsNotDeclaredHelp: loc(
    "Mientras no haya partidas, el caso sigue con el modelo de captura y margen. Parta de una plantilla o escriba la suya.",
    "Until there are line items, the case keeps running on capture and margin. Start from a template or write your own."
  ),
  rsTemplate: loc("Partir de una plantilla", "Start from a template"),
  rsTemplateNone: loc("Elegir plantilla…", "Choose a template…"),
  rsTemplateApply: loc("Usar", "Use it"),
  rsTemplateWarning: loc(
    "Sustituye lo que haya escrito en la pila.",
    "It replaces whatever is in the stack."
  ),
  rsClear: loc("Vaciar la pila", "Empty the stack"),
  rsDrivers: loc("Drivers", "Drivers"),
  rsDriversHelp: loc(
    "Las cantidades base del negocio. Cada una crece del año 1 al horizonte con la forma que elija.",
    "The base quantities of the business. Each grows from year one to the horizon in the shape you choose."
  ),
  rsAddDriver: loc("Añadir driver", "Add driver"),
  rsDriverName: loc("Nombre", "Name"),
  rsDriverUnit: loc("Mide", "Measures"),
  rsDriverYearOne: loc("Año 1", "Year 1"),
  rsDriverHorizon: loc("Horizonte", "Horizon"),
  rsDriverRamp: loc("Rampa", "Ramp"),
  rsLines: loc("Líneas de negocio", "Business lines"),
  rsLinesHelp: loc(
    "Cada línea lleva su ingreso, su coste directo y su parte del coste fijo del modo. Los repartos deben sumar 100.",
    "Each line carries its revenue, its direct cost and its share of the mode's fixed cost. The shares must add up to 100."
  ),
  rsAddLine: loc("Añadir línea", "Add line"),
  rsLineName: loc("Línea", "Line"),
  rsFixedShare: loc("Coste fijo (%)", "Fixed cost (%)"),
  rsAddItem: loc("Añadir partida", "Add item"),
  rsItemName: loc("Partida", "Item"),
  rsItemKind: loc("Tipo", "Type"),
  rsItemDriver: loc("Driver", "Driver"),
  rsItemRateKind: loc("Tarifa", "Rate"),
  rsItemRate: loc("Valor", "Value"),
  rsNoDriver: loc("Sin driver", "No driver"),
  rsRemove: loc("Quitar", "Remove"),
  rsSectorTag: loc("Sector", "Sector"),
  rsUserTag: loc("Propio", "Own"),
  rsResultTitle: loc("Lo que sale de la última evaluación", "What the last assessment produced"),
  rsResultHelp: loc(
    "No se recalcula al escribir. Vuelva a generar la evaluación para ver el efecto de un cambio.",
    "It does not recalculate as you type. Generate the assessment again to see the effect of a change."
  ),
  rsResultPending: loc(
    "Todavía no hay una evaluación que mostrar para este mercado.",
    "There is no assessment to show for this market yet."
  ),
  rsColLine: loc("Línea", "Line"),
  rsColRevenue: loc("Ingreso", "Revenue"),
  rsColDirectCost: loc("Coste directo", "Direct cost"),
  rsColContribution: loc("Contribución", "Contribution"),
  rsColFixed: loc("Coste fijo", "Fixed cost"),
  rsColResult: loc("Resultado", "Operating profit"),
  rsAtHorizon: loc("en el horizonte", "at the horizon"),
  rsTotal: loc("Total", "Total"),
  rsPlausibility: loc("Contraste con el mercado", "Check against the market"),
  rsMissing: loc("Falta por completar", "Still to complete"),
  rsWarnings: loc("Avisos", "Warnings"),

  // Lectura del modelo sobre el caso económico
  erTitle: loc("Lo que dicen los números", "What the numbers say"),
  erSupports: loc("Los números sostienen el supuesto", "The numbers support the assumption"),
  erContradicts: loc("Los números contradicen el supuesto", "The numbers contradict the assumption"),
  erSilent: loc("Los números todavía no dicen nada", "The numbers do not say anything yet"),
  erConflict: loc(
    "Ha declarado que el caso económico se sostiene y el modelo dice lo contrario. Una de las dos cosas hay que corregirla antes del comité.",
    "You have declared that the economic case holds and the model says otherwise. One of the two has to be corrected before the committee."
  ),

  // Mapa de competidores
  clTitle: loc("Mapa de competidores", "Competitor map"),
  clDesc: loc(
    "La puntuación de rivalidad del capítulo 6 sirve para comparar países. Esto sirve para defender la tesis: nombres, cuotas y la razón por la que retienen a sus clientes.",
    "The chapter 6 rivalry score is for comparing countries. This is for defending the thesis: names, shares and the reason they hold their customers."
  ),
  clMarketUnits: loc("Tamaño del mercado (unidades)", "Market size (units)"),
  clMarketUnitsHelp: loc(
    "En clientes, tarjetas, cuentas u hogares, no en dinero. Las unidades se discuten mejor.",
    "In customers, cards, accounts or households, not in money. Units are easier to argue about."
  ),
  clUnitLabel: loc("Nombre de la unidad", "Name of the unit"),
  clUnitPlaceholder: loc("Ej. tarjetas activas", "E.g. active cards"),
  clDriver: loc("Driver de la pila que cuenta lo mismo", "Stack driver that counts the same thing"),
  clDriverNone: loc("Sin correspondencia", "No correspondence"),
  clDriverHelp: loc(
    "Sin esta correspondencia no se puede saber qué cuota implica el plan.",
    "Without this correspondence, the share the plan implies cannot be known."
  ),
  clAcquisitionCost: loc("Coste de captar un cliente", "Cost to acquire one customer"),
  clCompetitors: loc("Competidores", "Competitors"),
  clAddCompetitor: loc("Añadir competidor", "Add competitor"),
  clName: loc("Nombre", "Name"),
  clShare: loc("Cuota (%)", "Share (%)"),
  clHoldReason: loc("Por qué retiene a sus clientes", "Why it holds its customers"),
  clHoldReasonPlaceholder: loc(
    "Ej. es la cuenta principal y el débito por defecto",
    "E.g. it is the main account and the default debit card"
  ),
  clRemove: loc("Quitar", "Remove"),
  clDeclaredShare: loc("Cuota declarada", "Share declared"),
  clUnattributed: loc("Sin atribuir", "Unattributed"),
  clConcentration: loc("Concentración", "Concentration"),
  clImpliedShare: loc("Cuota que implica el plan", "Share the plan implies"),
  clAcquisitionSpend: loc("Coste de captarla", "Cost of winning it"),
  clReadingTitle: loc("Lo que sale de la última evaluación", "What the last assessment produced"),
  clReadingPending: loc(
    "Genere la evaluación para ver qué cuota implica el plan y de quién tiene que salir.",
    "Generate the assessment to see what share the plan implies and who it has to come from."
  ),
  clFindings: loc("Lo que hay que explicar", "What needs explaining"),

  // Memo de decisión
  dmTitle: loc("Memo de decisión", "Decision memo"),
  dmDesc: loc(
    "La página que se lee diez minutos antes del comité: la tesis, lo que la mata, y lo que todavía no se sabe. No lleva puntuaciones ni recomendación de la herramienta; la firma la pone una persona.",
    "The page read ten minutes before the committee: the thesis, what kills it, and what is not yet known. No scores and no recommendation from the tool; a person signs it."
  ),
  dmDownload: loc("Descargar en PDF", "Download as PDF"),
  dmDownloaded: loc("Memo generado.", "Memo generated."),
  dmFailed: loc("No se pudo crear el memo.", "The memo could not be created."),
  dmNoThesis: loc(
    "Enuncie la tesis en la pestaña del caso para poder generar el memo.",
    "State the thesis in the case tab so the memo can be generated."
  ),

  // Dependencias y datos de cada paso
  routeBlockedBy: loc("Le falta esto de antes", "Missing from earlier steps"),
  routeRestsOn: loc("Se apoya en", "It rests on"),
  routeUnlocks: loc("Desbloquea", "It unlocks"),
  routeUnlocksNone: loc("Es el último paso: no desbloquea nada más.", "It is the last step: it unlocks nothing further."),
  routeBring: loc("Qué hay que traer, y de dónde", "What to bring, and from where"),
  routeGoToStepShort: loc("Ir", "Go"),
  routeDependencyNote: loc(
    "Nada está bloqueado: se puede trabajar fuera de orden. Lo que no conviene es hacerlo sin saberlo.",
    "Nothing is blocked: you can work out of order. What you should not do is work out of order without knowing it."
  ),

  // Preparación
  tabPrep: loc("Preparación", "Preparation"),
  prepEyebrow: loc("antes de empezar", "before you start"),
  prepTitle: loc("Reúna esto primero y no se atascará a mitad", "Gather this first and you will not stall halfway"),
  prepIntro: loc(
    "Un análisis de entrada se atasca casi siempre por el mismo sitio, y no es el análisis: es descubrir en la fase 5 que hacen falta las ventas por región, pedirlas, y perder una semana. Esta lista es lo que la ruta pide en sus doce pasos, agrupado por de quién habla el dato en lugar de por cuándo hace falta.",
    "An entry analysis almost always stalls at the same place, and it is not the analysis: it is discovering in phase 5 that sales by region are needed, asking for them, and losing a week. This list is what the route asks for across its twelve steps, grouped by who the data is about rather than by when it is needed."
  ),
  prepGathered: loc("reunido", "gathered"),
  prepOf: loc("de", "of"),
  prepPendingPublic: loc("se descargan solos", "download on their own"),
  prepPendingFieldwork: loc("hay que ir a pedirlos", "have to be asked for"),
  prepPerCountry: loc("por cada país", "per country"),
  prepPerCountryTag: loc("Por país", "Per country"),
  prepNeededBy: loc("Lo piden", "Needed by"),
  prepStepsCount: loc("pasos", "steps"),
  prepStepCount: loc("paso", "step"),
  prepMarkGathered: loc("Marcar como reunido", "Mark as gathered"),
  prepSignIn: loc(
    "Cree o seleccione un caso para poder ir marcando lo que ya tiene.",
    "Create or select a case to start ticking off what you already have."
  ),
  prepCalendarNote: loc(
    "Lo que se descarga solo no marca el calendario. Lo marca lo que hay que ir a pedir, y sobre todo lo que hay que preguntar una vez por cada país.",
    "What downloads on its own does not set the calendar. What sets it is what has to be asked for, and above all what has to be asked once per country."
  ),
  prepGoToRoute: loc("Empezar el análisis", "Start the analysis"),

  // Una sola fuente por dato
  idFrom: loc("Viene de", "Comes from"),
  idFromThesis: loc("la tesis", "the thesis"),
  idChangeThere: loc("Cambiarlo allí", "Change it there"),
  idDivergence: loc("No coincide con la tesis", "It does not match the thesis"),
  idUseThesis: loc("Usar el de la tesis", "Use the thesis value"),
  idPrefilled: loc(
    "Rellenado desde la tesis. Puede cambiarlo, y si lo cambia la herramienta se lo dirá en lugar de elegir por usted.",
    "Filled in from the thesis. You can change it, and if you do the tool will say so rather than choosing for you."
  ),
  idCountryMissing: loc("Añadir país", "Add country"),
  idConsistency: loc("Consistencia con la tesis", "Consistency with the thesis"),
  thUseFromBrief: loc("Usar lo que dice el mandato", "Use what the mandate says"),
  cwUseScenarioName: loc("Usar el nombre del escenario", "Use the scenario name"),

  language: loc("Idioma", "Language"),
} as const;

export type UiKey = keyof typeof UI_STRINGS;
export type { Localized };
