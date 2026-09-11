import { loc, pick, type Localized } from "@shared/i18n";
import {
  CaseDossier,
  CoherenceFinding,
  MODULE_LABELS,
  MODULE_WEIGHTS,
  ModuleKey,
} from "@shared/domain/coherence";
import { entryModes } from "@shared/domain/entryModes";
import { ambitionCompleteness, computeIndices } from "./globalAmbition";
import { positioningCompleteness, resolvePositioning, diagnoseValueChain, resourceGap } from "./globalPositioning";
import { entryStrategyCompleteness, phaseDefinition } from "./entryStrategy";
import { diagnoseFits, evaluateGaps, partneringCompleteness } from "./partnering";

/**
 * Las trece reglas cruzadas. Cada una responde a una pregunta que solo tiene sentido con
 * dos módulos delante, y por eso ninguna vive dentro de un módulo.
 */

function modeLabel(key: string | null): Localized | null {
  if (!key) return null;
  return entryModes.find((mode) => mode.key === key)?.label ?? loc(key, key);
}

export function evaluateCoherence(dossier: CaseDossier): CoherenceFinding[] {
  const findings: CoherenceFinding[] = [];
  const { ambition, positioning, entry, partnering } = dossier;

  /* --- Ambición contra países y organización ---------------------------------------- */

  // 1. Querer ser jugador global sin ningún país clave es una ambición sin consecuencias.
  if (ambition?.targetRole === "global_player" && ambition.countryRoles.length > 0 && !ambition.countryRoles.some((entry) => entry.role === "key")) {
    findings.push({
      id: "global_ambition_without_key_countries",
      severity: "warn",
      modules: ["ambition"],
      title: loc("Ambición global sin países clave", "Global ambition with no key countries"),
      detail: loc(
        "El objetivo declarado es jugador global, pero ningún país del universo está marcado como clave. No estar presente en los países clave es un handicap serio para quien quiera serlo: o falta marcar alguno, o la ambición no es la que se ha declarado.",
        "The declared target is global player, but no country in the universe is marked as key. Not being present in the key countries is a serious handicap for anyone aiming to be one: either a country is missing that mark, or the ambition is not the one declared."
      ),
      provenance: loc("pp. 187-188", "pp. 187-188"),
    });
  }

  // 2. Ambición global con etapa de exportación y todo gestionado en local.
  if (ambition?.targetRole === "global_player" && ambition.stage === "export") {
    const chain = positioning ? diagnoseValueChain(positioning) : null;
    if (!chain || chain.targetConfiguration === "multinational" || chain.targetConfiguration === null) {
      findings.push({
        id: "global_ambition_export_stage",
        severity: "warn",
        modules: ["ambition", "positioning"],
        title: loc("Ambición global con organización de exportador", "Global ambition with an exporter's organization"),
        detail: loc(
          "Se aspira a jugador global desde la etapa de exportación y sin una configuración integrada de la cadena de valor. La etapa global exige operaciones coordinadas, no una confederación de ventas exteriores.",
          "The aim is global player from the export stage and without an integrated value-chain configuration. The global stage demands coordinated operations, not a confederation of foreign sales."
        ),
        provenance: loc("p. 193 y Tabla 5.8, pp. 200-202", "p. 193 and Table 5.8, pp. 200-202"),
      });
    }
  }

  /* --- Posicionamiento contra entrada ------------------------------------------------ */

  // 3. Propuesta adaptativa con modo que no permite conocer al cliente local.
  const positioningChoice = positioning ? resolvePositioning(positioning) : null;
  if (positioningChoice?.standardization === "adaptive" && entry?.preferredMode && ["licensing", "distributor"].includes(entry.preferredMode)) {
    findings.push({
      id: "adaptive_without_market_contact",
      severity: "warn",
      modules: ["positioning", "entry"],
      title: loc("Propuesta adaptativa con entrada a distancia", "Adaptive proposition with an arm's-length entry"),
      detail: loc(
        `La propuesta de valor se adapta por país, pero el modo elegido es ${pick(modeLabel(entry.preferredMode), "es")}, que deja a la empresa lejos del mercado y sin control sobre la relación con el cliente. Adaptar lo que no se observa es difícil.`,
        `The value proposition is adapted country by country, but the chosen mode is ${pick(modeLabel(entry.preferredMode), "en")}, which keeps the firm far from the market and without control over the customer relationship. Adapting what you cannot observe is hard.`
      ),
      provenance: loc("Tabla 7.4, p. 271 y p. 269", "Table 7.4, p. 271 and p. 269"),
    });
  }

  // 4. Ventaja en coste que depende de escala, entrando con un modo de penetración baja.
  if (positioningChoice?.advantage === "cost" && entry?.preferredMode && ["office", "licensing"].includes(entry.preferredMode)) {
    findings.push({
      id: "cost_advantage_low_penetration",
      severity: "warn",
      modules: ["positioning", "entry"],
      title: loc("Ventaja en coste con penetración baja", "Cost advantage with low penetration"),
      detail: loc(
        "Se compite por coste, que vive de volumen acumulado y escala, con un modo cuya penetración de mercado el libro califica de baja. El volumen que sostiene la ventaja no va a llegar por esa vía.",
        "You are competing on cost, which lives off accumulated volume and scale, with a mode whose market penetration the book rates as low. The volume that sustains the advantage will not arrive that way."
      ),
      provenance: loc("Tabla 5.5, p. 194 y Tabla 7.4, p. 271", "Table 5.5, p. 194 and Table 7.4, p. 271"),
    });
  }

  /* --- Objetivo de entrada contra modo ------------------------------------------------ */

  const selectedObjectives = entry?.objectives.filter((objective) => objective.selected).map((objective) => objective.id) ?? [];

  // 5. Aprender exige presencia; no se aprende por contrato.
  if (selectedObjectives.includes("learning") && entry?.preferredMode && ["licensing", "distributor"].includes(entry.preferredMode)) {
    findings.push({
      id: "learning_objective_arms_length",
      severity: "warn",
      modules: ["entry"],
      title: loc("Objetivo de aprendizaje con entrada por contrato", "Learning objective with a contractual entry"),
      detail: loc(
        "El objetivo declarado incluye aprender, y el libro asocia ese objetivo a la empresa conjunta, el centro de I+D o el observatorio. Una licencia o un distribuidor dejan el conocimiento del otro lado.",
        "The declared objective includes learning, and the book ties that objective to the joint venture, the R&D centre or the listening post. A licence or a distributor leaves the knowledge on the other side."
      ),
      provenance: loc("Tabla 7.1, p. 261", "Table 7.1, p. 261"),
    });
  }

  // 6. Coordinar no pide una fábrica.
  if (selectedObjectives.includes("coordination") && entry?.preferredMode && ["greenfield", "acquisition"].includes(entry.preferredMode)) {
    findings.push({
      id: "coordination_objective_heavy_mode",
      severity: "info",
      modules: ["entry"],
      title: loc("Objetivo de coordinación con inversión productiva", "Coordination objective with a productive investment"),
      detail: loc(
        "Para un país hub, el libro asocia oficina de representación, sede regional o centro logístico. Si además hay una razón de mercado para invertir, conviene declararla como segundo objetivo en lugar de dejar que la coordinación justifique la fábrica.",
        "For a hub country the book points to a representative office, regional headquarters or a logistics centre. If there is also a market reason to invest, declare it as a second objective rather than letting coordination justify the plant."
      ),
      provenance: loc("Tabla 7.1, pp. 260-261", "Table 7.1, pp. 260-261"),
    });
  }

  // 7. Buscar recursos con una oficina que no opera nada.
  if (selectedObjectives.includes("resources") && entry?.preferredMode === "office") {
    findings.push({
      id: "resource_objective_office",
      severity: "warn",
      modules: ["entry"],
      title: loc("Objetivo de recursos con oficina de representación", "Resource objective with a representative office"),
      detail: loc(
        "Acceder a un recurso pide explotarlo o contratarlo a largo plazo: filial propia si se permite, empresa conjunta si se exige, o contrato de suministro. Una oficina observa, no asegura suministro.",
        "Getting access to a resource means exploiting it or contracting for it long term: a wholly owned subsidiary where allowed, a joint venture where required, or a supply contract. An office observes; it does not secure supply."
      ),
      provenance: loc("Tabla 7.1, pp. 260-261", "Table 7.1, pp. 260-261"),
    });
  }

  /* --- El país y su rol --------------------------------------------------------------- */

  // 8. Compromiso máximo en un país que no es clave ni emergente.
  if (entry?.countryCode && ambition) {
    const role = ambition.countryRoles.find((candidate) => candidate.countryCode === entry.countryCode)?.role ?? null;
    if (role && ["marketing", "sourcing"].includes(role) && entry.preferredMode && ["greenfield", "acquisition"].includes(entry.preferredMode)) {
      findings.push({
        id: "overcommitment_to_secondary_country",
        severity: "warn",
        modules: ["ambition", "entry"],
        title: loc("Inversión máxima en un país secundario", "Maximum investment in a secondary country"),
        detail: loc(
          `${entry.countryCode} está clasificado como país de ${role === "marketing" ? "mercado" : "aprovisionamiento"} y el modo elegido es el de mayor compromiso. La clasificación existe precisamente para ordenar prioridades de inversión: o el país merece otro rol, o la inversión es desproporcionada.`,
          `${entry.countryCode} is classified as a ${role === "marketing" ? "marketing" : "sourcing"} country and the chosen mode is the highest-commitment one. The classification exists precisely to order investment priorities: either the country deserves another role, or the investment is out of proportion.`
        ),
        provenance: loc("pp. 187-188", "pp. 187-188"),
      });
    }
    if (!role && ambition.countryRoles.length > 0) {
      findings.push({
        id: "entry_country_without_role",
        severity: "info",
        modules: ["ambition", "entry"],
        title: loc("El país de entrada no tiene rol asignado", "The entry country has no role assigned"),
        detail: loc(
          `Se está diseñando la entrada en ${entry.countryCode} y ese país no aparece con rol en el universo de la ambición. Sin rol no hay prioridad de inversión con la que contrastar el modo.`,
          `The entry into ${entry.countryCode} is being designed and that country carries no role in the ambition's country universe. Without a role there is no investment priority to test the mode against.`
        ),
        provenance: loc("pp. 187-188", "pp. 187-188"),
      });
    }
  }

  /* --- La brecha de recursos y su resolución ------------------------------------------ */

  const gap = positioning ? resourceGap(positioning) : null;

  // 9. Lo que el TAC marcó como «crear» no llegó al módulo de vía de acceso.
  if (gap && gap.toCreate.length > 0 && partnering) {
    const unresolved = gap.toCreate.filter((entry) => !partnering.gaps.some((candidate) => candidate.label.trim().toLowerCase() === entry.label.trim().toLowerCase()));
    if (unresolved.length > 0) {
      findings.push({
        id: "unresolved_resource_gap",
        severity: "block",
        modules: ["positioning", "partnering"],
        title: loc("Capacidades declaradas «crear» sin vía de acceso", "Capabilities tagged \u201ccreate\u201d with no access route"),
        detail: loc(
          `El Transfer-Adapt-Create marcó ${unresolved.length} capacidad(es) que hay que crear y que no aparecen en la decisión de construir, alquilar o comprar: ${unresolved.slice(0, 3).map((entry) => entry.label).join(", ")}${unresolved.length > 3 ? "…" : ""}. Declarar una brecha y no resolverla es el agujero más común del análisis.`,
          `Transfer-Adapt-Create tagged ${unresolved.length} capability(ies) to be created that do not appear in the build, borrow or buy decision: ${unresolved.slice(0, 3).map((entry) => entry.label).join(", ")}${unresolved.length > 3 ? "\u2026" : ""}. Declaring a gap and never resolving it is the most common hole in the analysis.`
        ),
        provenance: loc("Fig. 5.14, p. 199 y capítulo 8", "Fig. 5.14, p. 199 and chapter 8"),
      });
    }
  }

  // 10. Mucho que crear y un modo que no construye nada.
  if (gap && gap.creationLoad !== null && gap.creationLoad > 0.6 && entry?.preferredMode && ["licensing", "distributor", "office"].includes(entry.preferredMode)) {
    findings.push({
      id: "high_creation_load_light_mode",
      severity: "warn",
      modules: ["positioning", "entry"],
      title: loc("Mucho que construir con una entrada ligera", "A lot to build with a light entry"),
      detail: loc(
        `El ${Math.round(gap.creationLoad * 100)}% de las capacidades no viaja tal cual, y el modo elegido no construye capacidades locales. O se revisa el modo, o alguien tiene que construirlas: normalmente, un socio.`,
        `${Math.round(gap.creationLoad * 100)}% of the capabilities do not travel as they are, and the chosen mode builds no local capabilities. Either revisit the mode, or someone has to build them: usually a partner.`
      ),
      provenance: loc("Fig. 5.14, p. 199 y Tabla 7.4, p. 271", "Fig. 5.14, p. 199 and Table 7.4, p. 271"),
    });
  }

  /* --- Fase de la ventana contra vía de acceso ---------------------------------------- */

  const verdicts = partnering ? evaluateGaps(partnering) : [];

  // 11. Construir desde cero en un mercado maduro.
  if (entry?.phase === "mature" && verdicts.some((verdict) => verdict.route === "build")) {
    findings.push({
      id: "build_in_mature_market",
      severity: "warn",
      modules: ["entry", "partnering"],
      title: loc("Construir en un mercado maduro", "Building in a mature market"),
      detail: loc(
        "La fase declarada es madura, donde el libro solo ve viable la adquisición o la inversión directa con un producto innovador, y sin embargo hay capacidades que se piensa construir desde cero. Construir lleva tiempo, y en fase madura el tiempo ya se agotó.",
        "The declared phase is mature, where the book sees only acquisition or direct investment with an innovative product as viable, and yet some capabilities are to be built from scratch. Building takes time, and in the mature phase the time is already gone."
      ),
      provenance: loc("p. 262 y p. 277", "p. 262 and p. 277"),
    });
  }

  // 12. Comprar sin capacidad de integrar es comprar un problema.
  if (verdicts.some((verdict) => verdict.route === "buy") && partnering) {
    const fits = diagnoseFits(partnering);
    const weakIntegration = fits.weak.some((weak) => weak.id === "organizational" || weak.id === "cultural");
    if (weakIntegration) {
      findings.push({
        id: "buy_with_weak_integration_fit",
        severity: "warn",
        modules: ["partnering"],
        title: loc("Adquisición con encaje organizativo o cultural débil", "Acquisition with weak organizational or cultural fit"),
        detail: loc(
          "El árbol lleva a comprar y el encaje cultural u organizativo con el objetivo es débil. Las adquisiciones en el extranjero exigen capacidad de integración intercultural, que no suele ser el talento principal del inversor.",
          "The tree leads to buying and the cultural or organizational fit with the target is weak. Foreign acquisitions demand cross-cultural integration capability, which is rarely the investor's main talent."
        ),
        provenance: loc("p. 265 y p. 278", "p. 265 and p. 278"),
      });
    }
  }

  // 13. Modo de entrada por alianza sin socio caracterizado en el módulo que le corresponde.
  if (entry?.preferredMode === "alliance" && partnering && !partnering.partnerType) {
    findings.push({
      id: "alliance_mode_without_partner_analysis",
      severity: "block",
      modules: ["entry", "partnering"],
      title: loc("Entrada por alianza sin análisis de socio", "Alliance entry with no partner analysis"),
      detail: loc(
        "El modo elegido es la empresa conjunta y el socio no está caracterizado. Elegir bien al socio local es probablemente la decisión más crítica de una empresa conjunta, y aquí está sin tomar.",
        "The chosen mode is the joint venture and the partner has not been characterized. Choosing the local partner well is probably the most critical decision in a joint venture, and it is still unmade."
      ),
      provenance: loc("p. 265 y Tabla 7.3, p. 267", "p. 265 and Table 7.3, p. 267"),
    });
  }

  return findings;
}

/* ------------------------------------------------------------------------------------ */
/* Índice de exhaustividad                                                               */
/* ------------------------------------------------------------------------------------ */

export type ModuleScore = { key: ModuleKey; label: Localized; answered: number; total: number; weight: number; pct: number };

export type CompletenessIndex = {
  /** 0 a 100, ponderado por la importancia de cada módulo en la decisión. */
  pct: number;
  modules: ModuleScore[];
  /** Lo que impide cerrar la decisión: findings bloqueantes más módulos vacíos. */
  blockers: Localized[];
};

/**
 * Un módulo sin tocar puntúa cero, aunque algunas de sus comprobaciones se cumplan sola.
 *
 * Varias comprobaciones son condicionales —«tipo de socio, cuando hace falta socio»— y en un
 * módulo vacío se dan por satisfechas porque no hay nada que las active. Contarlas haría que
 * un análisis sin empezar apareciera con un 13% hecho, que es justo la clase de falsa
 * tranquilidad que esta herramienta existe para evitar.
 */
function isStarted(key: ModuleKey, dossier: CaseDossier): boolean {
  switch (key) {
    case "ambition": {
      const input = dossier.ambition;
      if (!input) return false;
      return (
        input.motives.some((motive) => motive.selected) ||
        Boolean(input.currentRole || input.targetRole || input.stage || input.organizationalPhase) ||
        input.countryRoles.length > 0 ||
        Boolean((input.liabilityOfForeignness ?? "").trim()) ||
        Object.values({ ...input.industryDemand, ...input.companyRevenue, ...input.companyCapability }).some((value) => value !== null && value !== undefined)
      );
    }
    case "positioning": {
      const input = dossier.positioning;
      if (!input) return false;
      return (
        Boolean(input.scope || input.advantage || input.standardization) ||
        input.valueCurve.length > 0 ||
        input.tac.length > 0 ||
        input.capabilities.length > 0 ||
        Object.values(input.valueChain).some((cell) => cell.current || cell.target) ||
        Boolean((input.liabilityOfForeignness.handicap ?? "").trim())
      );
    }
    case "entry": {
      const input = dossier.entry;
      if (!input) return false;
      return (
        input.objectives.some((objective) => objective.selected) ||
        Boolean(input.phase || input.timingStance || input.preferredMode || input.countryCode) ||
        Object.values(input.paceFactors).some((value) => value !== null && value !== undefined)
      );
    }
    case "partnering": {
      const input = dossier.partnering;
      if (!input) return false;
      return (
        input.gaps.length > 0 ||
        Boolean(input.partnerType || input.partnerCategory || input.partnerName) ||
        input.fits.some((fit) => fit.score !== null) ||
        input.realOption.premium !== null
      );
    }
  }
}

export function completenessIndex(dossier: CaseDossier, findings: CoherenceFinding[]): CompletenessIndex {
  const modules: ModuleScore[] = [];

  const push = (key: ModuleKey, progress: { answered: number; total: number } | null) => {
    if (!isStarted(key, dossier)) {
      modules.push({ key, label: MODULE_LABELS[key], answered: 0, total: progress?.total ?? 1, weight: MODULE_WEIGHTS[key], pct: 0 });
      return;
    }
    const answered = progress?.answered ?? 0;
    const total = progress?.total ?? 1;
    modules.push({
      key,
      label: MODULE_LABELS[key],
      answered,
      total,
      weight: MODULE_WEIGHTS[key],
      pct: total ? Math.round((answered / total) * 100) : 0,
    });
  };

  push("ambition", dossier.ambition ? ambitionCompleteness(dossier.ambition, computeIndices(dossier.ambition)) : null);
  push("positioning", dossier.positioning ? positioningCompleteness(dossier.positioning) : null);
  push("entry", dossier.entry ? entryStrategyCompleteness(dossier.entry) : null);
  push("partnering", dossier.partnering ? partneringCompleteness(dossier.partnering) : null);

  const weighted = modules.reduce((total, module) => total + (module.pct * module.weight) / 100, 0);

  const blockers: Localized[] = [
    ...findings.filter((finding) => finding.severity === "block").map((finding) => finding.title),
    ...modules
      .filter((module) => module.pct === 0)
      .map((module) => loc(`${pick(module.label, "es")}: sin empezar`, `${pick(module.label, "en")}: not started`)),
  ];

  return { pct: Math.round(weighted), modules, blockers };
}
