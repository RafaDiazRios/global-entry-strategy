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
  language: loc("Idioma", "Language"),
} as const;

export type UiKey = keyof typeof UI_STRINGS;
export type { Localized };
