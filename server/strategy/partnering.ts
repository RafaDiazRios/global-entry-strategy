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
  reason: string | null;
  answered: number;
  total: number;
  /** El analista eligió otra vía que la del árbol. No es un error, pero hay que justificarlo. */
  divergesFromChoice: boolean;
};

export function decideRoute(axes: Partial<Record<BbbAxisId, number | null>>): { route: BbbRoute | null; decidedBy: BbbAxisId | null; reason: string | null } {
  const value = (id: BbbAxisId) => {
    const raw = axes[id];
    return raw === null || raw === undefined ? null : raw;
  };

  const relevance = value("internal_relevance");
  if (relevance === null) return { route: null, decidedBy: null, reason: "Falta contestar la relevancia de lo que ya se tiene." };
  if (relevance >= HIGH) {
    return { route: "build", decidedBy: "internal_relevance", reason: "Los recursos internos son una base sólida para desarrollarlo: construir es la vía más barata y la que conserva el control." };
  }

  const tradability = value("tradability");
  if (tradability === null) return { route: null, decidedBy: null, reason: "Falta contestar si el recurso se puede contratar." };
  if (tradability >= HIGH) {
    return { route: "borrow_contract", decidedBy: "tradability", reason: "El recurso se deja delimitar en un contrato: alquilarlo evita comprar toda una organización para obtener una parte." };
  }

  const closeness = value("partner_closeness");
  if (closeness === null) return { route: null, decidedBy: null, reason: "Falta contestar cuánta cercanía exige el socio." };

  const integration = value("integration_capacity");
  if (closeness >= HIGH) {
    if (integration === null) return { route: null, decidedBy: null, reason: "Falta contestar la capacidad de integrar." };
    if (integration >= HIGH) {
      return { route: "buy", decidedBy: "integration_capacity", reason: "El recurso no se construye ni se contrata, exige trabajar codo con codo y hay capacidad de integrar: la compra es defendible." };
    }
    return { route: "borrow_alliance", decidedBy: "integration_capacity", reason: "Hace falta mucha cercanía pero no hay capacidad de integración: comprar destruiría lo que se quiere adquirir. La alianza mantiene el acceso sin la absorción." };
  }

  return { route: "borrow_alliance", decidedBy: "partner_closeness", reason: "El recurso no se contrata pero tampoco exige convivencia diaria: una alianza acotada basta." };
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

export function routeLabel(route: BbbRoute | null) {
  return route ? BBB_ROUTES.find((entry) => entry.id === route)?.label ?? route : null;
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
  weak: { id: string; label: string; score: number; failureSign: string }[];
  unevidenced: string[];
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
      return { id: fit.id, label: definition?.label ?? fit.id, score: fit.score as number, failureSign: definition?.failureSign ?? "" };
    });
  const unevidenced = answered
    .filter((fit) => !(fit.evidence ?? "").trim())
    .map((fit) => PARTNER_FITS.find((entry) => entry.id === fit.id)?.label ?? fit.id);

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
  missing: string[];
  expansionPath: { id: string; label: string; from: string; to: string } | null;
};

/**
 * Una opción sin señales de salida no es una opción: es una inversión pequeña con la
 * esperanza de que salga bien. Lo que hace falta declarar es qué se mira, cuándo y qué se
 * hace en cada caso.
 */
export function diagnoseRealOption(input: PartneringInput): OptionDiagnosis {
  const option = input.realOption;
  const missing: string[] = [];
  if (option.premium === null) missing.push("La prima: cuánto se paga por el derecho a observar");
  if (option.trialYears === null) missing.push("La duración del periodo de observación");
  if (!option.triggers.length) missing.push("Al menos una señal que dispare la decisión");
  if (option.triggers.length && option.triggers.every((trigger) => !(trigger.threshold ?? "").trim())) {
    missing.push("Un umbral concreto en las señales: sin número o condición verificable no se puede decidir");
  }
  if (!option.expansionPathId) missing.push("La vía de ampliación si el negocio se desarrolla");
  if (!option.retreatPathId) missing.push("La vía de repliegue si no se desarrolla");

  return {
    structured: missing.length === 0,
    missing,
    expansionPath: OPTION_EXPANSION_PATHS.find((path) => path.id === option.expansionPathId) ?? null,
  };
}

/* ------------------------------------------------------------------------------------ */
/* Coherencia y exhaustividad                                                            */
/* ------------------------------------------------------------------------------------ */

export type PartneringWarning = { id: string; severity: "block" | "warn"; message: string; provenance: string };

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
      message: `Para «${verdict.label}» el árbol lleva a ${routeLabel(verdict.route)} y la vía elegida es otra. ${verdict.reason ?? ""}`,
      provenance: "Marco de Capron y Mitchell",
    });
  }

  const needsPartner = verdicts.some((verdict) => verdict.route === "borrow_alliance" || verdict.route === "buy");
  if (needsPartner && !input.partnerType) {
    warnings.push({
      id: "partner_type_missing",
      severity: "warn",
      message: "Hay capacidades que exigen alianza o compra y no se ha caracterizado al socio. El tipo de socio cambia por completo lo que se puede esperar y lo que hay que vigilar.",
      provenance: "Tabla 7.3, p. 267",
    });
  }

  if (needsPartner && fits.answered < fits.total) {
    warnings.push({
      id: "fits_incomplete",
      severity: "warn",
      message: "Las cuatro pruebas de encaje se evalúan juntas o no dicen nada: una alianza cae por el encaje más débil, no por la media.",
      provenance: "p. 278",
    });
  }

  for (const weak of fits.weak) {
    warnings.push({
      id: `weak_fit_${weak.id}`,
      severity: "warn",
      message: `${weak.label} es débil (${weak.score}/4). Señal típica de fracaso: ${weak.failureSign.toLowerCase()}.`,
      provenance: "p. 278",
    });
  }

  if (input.realOption.premium !== null && !option.structured) {
    warnings.push({
      id: "option_unstructured",
      severity: "warn",
      message: `Se ha declarado una inversión preliminar pero la opción está sin estructurar: falta ${option.missing[0]?.toLowerCase()}.`,
      provenance: "p. 270",
    });
  }

  return warnings;
}

export type PartneringCompleteness = { complete: boolean; missing: string[]; answered: number; total: number };

export function partneringCompleteness(input: PartneringInput): PartneringCompleteness {
  const verdicts = evaluateGaps(input);
  const fits = diagnoseFits(input);
  const option = diagnoseRealOption(input);
  const needsPartner = verdicts.some((verdict) => verdict.route === "borrow_alliance" || verdict.route === "buy");

  const checks: { label: string; done: boolean }[] = [
    { label: "Al menos una capacidad a conseguir", done: input.gaps.length > 0 },
    { label: "Los cuatro ejes contestados en cada capacidad", done: input.gaps.length > 0 && verdicts.every((verdict) => verdict.route !== null) },
    { label: "Vía elegida para cada capacidad", done: input.gaps.length > 0 && input.gaps.every((gap) => gap.chosenRoute !== null) },
    { label: "Tipo y categoría de socio, cuando hace falta socio", done: !needsPartner || Boolean(input.partnerType && input.partnerCategory) },
    { label: "Las cuatro pruebas de encaje con su evidencia", done: !needsPartner || (fits.answered === fits.total && fits.unevidenced.length === 0) },
    { label: "Opción real estructurada, si hay inversión preliminar", done: input.realOption.premium === null || option.structured },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
