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

  // Idioma
  language: loc("Idioma", "Language"),
} as const;

export type UiKey = keyof typeof UI_STRINGS;
export type { Localized };
