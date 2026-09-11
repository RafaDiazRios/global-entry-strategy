import { loc, pick, type Localized } from "@shared/i18n";
import {
  BBB_AXES,
  BBB_ROUTES,
  BbbAxisId,
  BbbRoute,
  OPTION_EXPANSION_PATHS,
  PARTNER_FITS,
  PARTNER_TYPES,
  PartneringInput,
  PartnerTypeId,
} from "@shared/domain/partnering";

/**
 * Motor del módulo 5.
 *
 * El árbol de build-borrow-buy es una secuencia de preguntas, no una media ponderada:
 * responde en el orden del marco y se detiene en la primera que decide. Un promedio daría
 * un número más cómodo y una recomendación peor.
 */

const HIGH = 2.5; // Sobre 4: el punto en el que una respuesta cuenta como afirmativa.

export type BbbVerdict = {
  gapId: string;
  label: string;
  route: BbbRoute | null;
  /** La pregunta del árbol que ha decidido. */
  decidedBy: BbbAxisId | null;
  reason: Localized | null;
  answered: number;
  total: number;
  /** El analista eligió otra vía que la del árbol. No es un error, pero hay que justificarlo. */
  divergesFromChoice: boolean;
};

export function decideRoute(axes: Partial<Record<BbbAxisId, number | null>>): { route: BbbRoute | null; decidedBy: BbbAxisId | null; reason: Localized | null } {
  const value = (id: BbbAxisId) => {
    const raw = axes[id];
    return raw === null || raw === undefined ? null : raw;
  };

  const relevance = value("internal_relevance");
  if (relevance === null) {
    return { route: null, decidedBy: null, reason: loc("Falta contestar la relevancia de lo que ya se tiene.", "The relevance of what the firm already has is still unanswered.") };
  }
  if (relevance >= HIGH) {
    return {
      route: "build",
      decidedBy: "internal_relevance",
      reason: loc(
        "Los recursos internos son una base sólida para desarrollarlo: construir es la vía más barata y la que conserva el control.",
        "Internal resources are a solid base for developing it: building is the cheapest route and the one that keeps control."
      ),
    };
  }

  const tradability = value("tradability");
  if (tradability === null) {
    return { route: null, decidedBy: null, reason: loc("Falta contestar si el recurso se puede contratar.", "Whether the resource can be contracted for is still unanswered.") };
  }
  if (tradability >= HIGH) {
    return {
      route: "borrow_contract",
      decidedBy: "tradability",
      reason: loc(
        "El recurso se deja delimitar en un contrato: alquilarlo evita comprar toda una organización para obtener una parte.",
        "The resource can be bounded in a contract: borrowing it avoids buying a whole organization to get one part of it."
      ),
    };
  }

  const closeness = value("partner_closeness");
  if (closeness === null) {
    return { route: null, decidedBy: null, reason: loc("Falta contestar cuánta cercanía exige el socio.", "How much closeness the partner requires is still unanswered.") };
  }

  const integration = value("integration_capacity");
  if (closeness >= HIGH) {
    if (integration === null) {
      return { route: null, decidedBy: null, reason: loc("Falta contestar la capacidad de integrar.", "The capacity to integrate is still unanswered.") };
    }
    if (integration >= HIGH) {
      return {
        route: "buy",
        decidedBy: "integration_capacity",
        reason: loc(
          "El recurso no se construye ni se contrata, exige trabajar codo con codo y hay capacidad de integrar: la compra es defendible.",
          "The resource can be neither built nor contracted for, it demands working side by side, and the capacity to integrate is there: buying is defensible."
        ),
      };
    }
    return {
      route: "borrow_alliance",
      decidedBy: "integration_capacity",
      reason: loc(
        "Hace falta mucha cercanía pero no hay capacidad de integración: comprar destruiría lo que se quiere adquirir. La alianza mantiene el acceso sin la absorción.",
        "Close work is needed but the integration capability is not there: buying would destroy what is being acquired. An alliance keeps the access without the absorption."
      ),
    };
  }

  return {
    route: "borrow_alliance",
    decidedBy: "partner_closeness",
    reason: loc(
      "El recurso no se contrata pero tampoco exige convivencia diaria: una alianza acotada basta.",
      "The resource cannot be contracted for but does not demand daily co-working either: a bounded alliance is enough."
    ),
  };
}

export function evaluateGaps(input: PartneringInput): BbbVerdict[] {
  return input.gaps.map((gap) => {
    const answered = BBB_AXES.filter((axis) => gap.axes[axis.id] !== null && gap.axes[axis.id] !== undefined).length;
    const decision = decideRoute(gap.axes);
    return {
      gapId: gap.id,
      label: gap.label,
      route: decision.route,
      decidedBy: decision.decidedBy,
      reason: decision.reason,
      answered,
      total: BBB_AXES.length,
      divergesFromChoice: Boolean(gap.chosenRoute && decision.route && gap.chosenRoute !== decision.route),
    };
  });
}

export function routeLabel(route: BbbRoute | null): Localized | null {
  if (!route) return null;
  return BBB_ROUTES.find((entry) => entry.id === route)?.label ?? loc(route, route);
}

/* ------------------------------------------------------------------------------------ */
/* Encaje del socio                                                                      */
/* ------------------------------------------------------------------------------------ */

export type FitDiagnosis = {
  answered: number;
  total: number;
  /** Media de los encajes contestados, 0 a 4. */
  average: number | null;
  /** Encajes por debajo del umbral: cualquiera de ellos hunde la alianza por sí solo. */
  weak: { id: string; label: Localized; score: number; failureSign: Localized }[];
  unevidenced: Localized[];
};

/**
 * Las cuatro pruebas no se compensan entre sí. Un encaje cultural pésimo no se arregla con
 * un encaje estratégico excelente, así que la media se muestra pero lo que manda es la
 * lista de encajes débiles.
 */
export function diagnoseFits(input: PartneringInput): FitDiagnosis {
  const answered = input.fits.filter((fit) => fit.score !== null);
  const weak = answered
    .filter((fit) => (fit.score as number) < 2)
    .map((fit) => {
      const definition = PARTNER_FITS.find((entry) => entry.id === fit.id);
      return {
        id: fit.id,
        label: definition?.label ?? loc(fit.id, fit.id),
        score: fit.score as number,
        failureSign: definition?.failureSign ?? loc("", ""),
      };
    });
  const unevidenced = answered
    .filter((fit) => !(fit.evidence ?? "").trim())
    .map((fit) => PARTNER_FITS.find((entry) => entry.id === fit.id)?.label ?? loc(fit.id, fit.id));

  return {
    answered: answered.length,
    total: PARTNER_FITS.length,
    average: answered.length ? Number((answered.reduce((total, fit) => total + (fit.score as number), 0) / answered.length).toFixed(2)) : null,
    weak,
    unevidenced,
  };
}

export function partnerTypeRisks(id: PartnerTypeId | null) {
  return id ? PARTNER_TYPES.find((type) => type.id === id) ?? null : null;
}

/* ------------------------------------------------------------------------------------ */
/* Opción real                                                                           */
/* ------------------------------------------------------------------------------------ */

export type OptionDiagnosis = {
  structured: boolean;
  missing: Localized[];
  expansionPath: { id: string; label: Localized; from: string; to: string } | null;
};

/**
 * Una opción sin señales de salida no es una opción: es una inversión pequeña con la
 * esperanza de que salga bien. Lo que hace falta declarar es qué se mira, cuándo y qué se
 * hace en cada caso.
 */
export function diagnoseRealOption(input: PartneringInput): OptionDiagnosis {
  const option = input.realOption;
  const missing: Localized[] = [];
  if (option.premium === null) {
    missing.push(loc("La prima: cuánto se paga por el derecho a observar", "The premium: what is paid for the right to observe"));
  }
  if (option.trialYears === null) {
    missing.push(loc("La duración del periodo de observación", "The length of the observation period"));
  }
  if (!option.triggers.length) {
    missing.push(loc("Al menos una señal que dispare la decisión", "At least one signal that triggers the decision"));
  }
  if (option.triggers.length && option.triggers.every((trigger) => !(trigger.threshold ?? "").trim())) {
    missing.push(loc(
      "Un umbral concreto en las señales: sin número o condición verificable no se puede decidir",
      "A concrete threshold on the signals: without a number or a verifiable condition there is nothing to decide on"
    ));
  }
  if (!option.expansionPathId) {
    missing.push(loc("La vía de ampliación si el negocio se desarrolla", "The expansion path if the business develops"));
  }
  if (!option.retreatPathId) {
    missing.push(loc("La vía de repliegue si no se desarrolla", "The retreat path if it does not"));
  }

  return {
    structured: missing.length === 0,
    missing,
    expansionPath: OPTION_EXPANSION_PATHS.find((path) => path.id === option.expansionPathId) ?? null,
  };
}

/* ------------------------------------------------------------------------------------ */
/* Coherencia y exhaustividad                                                            */
/* ------------------------------------------------------------------------------------ */

export type PartneringWarning = { id: string; severity: "block" | "warn"; message: Localized; provenance: Localized };

export function partneringWarnings(input: PartneringInput): PartneringWarning[] {
  const warnings: PartneringWarning[] = [];
  const verdicts = evaluateGaps(input);
  const fits = diagnoseFits(input);
  const option = diagnoseRealOption(input);

  const diverging = verdicts.filter((verdict) => verdict.divergesFromChoice);
  for (const verdict of diverging) {
    warnings.push({
      id: `route_divergence_${verdict.gapId}`,
      severity: "warn",
      message: loc(
        `Para «${verdict.label}» el árbol lleva a ${pick(routeLabel(verdict.route), "es")} y la vía elegida es otra. ${pick(verdict.reason, "es")}`,
        `For \u201c${verdict.label}\u201d the tree leads to ${pick(routeLabel(verdict.route), "en")} and a different route was chosen. ${pick(verdict.reason, "en")}`
      ),
      provenance: loc("Marco de Capron y Mitchell", "Capron and Mitchell's framework"),
    });
  }

  const needsPartner = verdicts.some((verdict) => verdict.route === "borrow_alliance" || verdict.route === "buy");
  if (needsPartner && !input.partnerType) {
    warnings.push({
      id: "partner_type_missing",
      severity: "warn",
      message: loc(
        "Hay capacidades que exigen alianza o compra y no se ha caracterizado al socio. El tipo de socio cambia por completo lo que se puede esperar y lo que hay que vigilar.",
        "Some capabilities call for an alliance or a purchase and the partner has not been characterized. The type of partner completely changes what can be expected and what has to be watched."
      ),
      provenance: loc("Tabla 7.3, p. 267", "Table 7.3, p. 267"),
    });
  }

  if (needsPartner && fits.answered < fits.total) {
    warnings.push({
      id: "fits_incomplete",
      severity: "warn",
      message: loc(
        "Las cuatro pruebas de encaje se evalúan juntas o no dicen nada: una alianza cae por el encaje más débil, no por la media.",
        "The four fit tests are assessed together or they say nothing: an alliance fails on its weakest fit, not on the average."
      ),
      provenance: loc("p. 278", "p. 278"),
    });
  }

  for (const weak of fits.weak) {
    warnings.push({
      id: `weak_fit_${weak.id}`,
      severity: "warn",
      message: loc(
        `${pick(weak.label, "es")} es débil (${weak.score}/4). Señal típica de fracaso: ${pick(weak.failureSign, "es").toLowerCase()}.`,
        `${pick(weak.label, "en")} is weak (${weak.score}/4). Typical failure sign: ${pick(weak.failureSign, "en").toLowerCase()}.`
      ),
      provenance: loc("p. 278", "p. 278"),
    });
  }

  if (input.realOption.premium !== null && !option.structured) {
    warnings.push({
      id: "option_unstructured",
      severity: "warn",
      message: loc(
        `Se ha declarado una inversión preliminar pero la opción está sin estructurar: falta ${pick(option.missing[0], "es").toLowerCase()}.`,
        `A preliminary investment has been declared but the option is unstructured: it is missing ${pick(option.missing[0], "en").toLowerCase()}.`
      ),
      provenance: loc("p. 270", "p. 270"),
    });
  }

  return warnings;
}

export type PartneringCompleteness = { complete: boolean; missing: Localized[]; answered: number; total: number };

export function partneringCompleteness(input: PartneringInput): PartneringCompleteness {
  const verdicts = evaluateGaps(input);
  const fits = diagnoseFits(input);
  const option = diagnoseRealOption(input);
  const needsPartner = verdicts.some((verdict) => verdict.route === "borrow_alliance" || verdict.route === "buy");

  const checks: { label: Localized; done: boolean }[] = [
    { label: loc("Al menos una capacidad a conseguir", "At least one capability to obtain"), done: input.gaps.length > 0 },
    { label: loc("Los cuatro ejes contestados en cada capacidad", "The four axes answered for every capability"), done: input.gaps.length > 0 && verdicts.every((verdict) => verdict.route !== null) },
    { label: loc("Vía elegida para cada capacidad", "A route chosen for every capability"), done: input.gaps.length > 0 && input.gaps.every((gap) => gap.chosenRoute !== null) },
    { label: loc("Tipo y categoría de socio, cuando hace falta socio", "Partner type and category, where a partner is needed"), done: !needsPartner || Boolean(input.partnerType && input.partnerCategory) },
    { label: loc("Las cuatro pruebas de encaje con su evidencia", "The four fit tests with their evidence"), done: !needsPartner || (fits.answered === fits.total && fits.unevidenced.length === 0) },
    { label: loc("Opción real estructurada, si hay inversión preliminar", "A structured real option, if there is a preliminary investment"), done: input.realOption.premium === null || option.structured },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
