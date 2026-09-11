import { loc, pick, type Localized } from "@shared/i18n";
import {
  AmbitionInput,
  GLOBAL_ROLES,
  GlobalRoleId,
  RegionalFigures,
  regionSet,
} from "@shared/domain/globalAmbition";

/**
 * Índices de globalización GRI y GCI, y mapa de ambición de la Fig. 5.5 (p. 185).
 *
 * El libro define los índices pero remite el cálculo al «Online Appendix 5.1» (p. 184), que
 * no forma parte del texto. La herramienta fija por tanto una convención propia y la
 * declara en pantalla: los números son internamente coherentes y comparables entre casos,
 * pero no necesariamente con los que publique la bibliografía del programa.
 */

export type IndicesConvention = "overlap";

export const CONVENTIONS: { id: IndicesConvention; label: Localized; formula: string; note: Localized }[] = [
  {
    id: "overlap",
    label: loc("Solapamiento de distribuciones", "Overlap of distributions"),
    formula: "GRI = Σᵢ min(Sᵢ, Wᵢ)",
    note: loc(
      "Sᵢ es el porcentaje de ventas de la empresa en la región i y Wᵢ el porcentaje de la demanda mundial de la industria en esa región. " +
        "Equivale exactamente a Σᵢ Wᵢ · min(Sᵢ/Wᵢ, 1), que es la lectura literal de la definición del libro —«the ratio of the company's " +
        "distribution of sales to the industry distribution of demand» (p. 218)— ponderada por el peso de cada región y con el cociente " +
        "limitado a 1, y también a 1 − ½·Σᵢ|Sᵢ − Wᵢ|. Escala 0-1: 1 significa que la empresa reparte sus ventas igual que el mercado mundial.",
      "Sᵢ is the share of company sales in region i and Wᵢ the share of world industry demand in that region. " +
        "It is exactly equivalent to Σᵢ Wᵢ · min(Sᵢ/Wᵢ, 1), the literal reading of the book's definition \u2014\u201cthe ratio of the company's " +
        "distribution of sales to the industry distribution of demand\u201d (p. 218)\u2014 weighted by each region's size and with the ratio " +
        "capped at 1, and also to 1 − ½·Σᵢ|Sᵢ − Wᵢ|. Scale 0-1: 1 means the company spreads its sales exactly like the world market."
    ),
  },
];

export type Indices = {
  gri: number | null;
  gci: number | null;
  convention: IndicesConvention;
  /** Distribuciones normalizadas, en tanto por uno, tal y como han entrado en el cálculo. */
  normalized: {
    industry: Record<string, number>;
    revenue: Record<string, number>;
    capability: Record<string, number>;
  };
  /** Regiones sin dato que han impedido el cálculo. */
  missing: { industry: string[]; revenue: string[]; capability: string[] };
};

function normalize(figures: RegionalFigures, regions: string[]): { shares: Record<string, number>; missing: string[] } {
  const missing: string[] = [];
  let total = 0;
  for (const region of regions) {
    const value = figures[region];
    if (value === null || value === undefined || Number.isNaN(value)) missing.push(region);
    else total += Math.max(0, value);
  }
  const shares: Record<string, number> = {};
  if (missing.length || total <= 0) return { shares, missing: missing.length ? missing : regions };
  for (const region of regions) shares[region] = Math.max(0, figures[region] as number) / total;
  return { shares, missing: [] };
}

/** Índice de solapamiento entre dos distribuciones ya normalizadas. */
export function overlapIndex(companyShares: Record<string, number>, industryShares: Record<string, number>, regions: string[]) {
  let sum = 0;
  for (const region of regions) sum += Math.min(companyShares[region] ?? 0, industryShares[region] ?? 0);
  // El redondeo puede dejar 1.0000000002; el índice está acotado por construcción.
  return Math.min(1, Math.max(0, Number(sum.toFixed(6))));
}

export function computeIndices(input: AmbitionInput, convention: IndicesConvention = "overlap"): Indices {
  const regions = regionSet(input.regionSetId).regions.map((region) => region.id);
  const industry = normalize(input.industryDemand, regions);
  const revenue = normalize(input.companyRevenue, regions);
  const capability = normalize(input.companyCapability, regions);

  const gri = industry.missing.length || revenue.missing.length ? null : overlapIndex(revenue.shares, industry.shares, regions);
  const gci = industry.missing.length || capability.missing.length ? null : overlapIndex(capability.shares, industry.shares, regions);

  return {
    gri,
    gci,
    convention,
    normalized: { industry: industry.shares, revenue: revenue.shares, capability: capability.shares },
    missing: { industry: industry.missing, revenue: revenue.missing, capability: capability.missing },
  };
}

/* ------------------------------------------------------------------------------------ */
/* Mapa de ambición                                                                      */
/* ------------------------------------------------------------------------------------ */

export type AmbitionThresholds = { low: number; high: number };

export const DEFAULT_THRESHOLDS: AmbitionThresholds = { low: 0.4, high: 0.6 };

export type AmbitionPosition = {
  role: GlobalRoleId;
  /** Etiqueta de la casilla tal y como aparece dibujada en la Fig. 5.5. */
  zone: Localized;
  gri: number;
  gci: number;
  thresholds: AmbitionThresholds;
  provenance: Localized;
};

function band(value: number, thresholds: AmbitionThresholds): "low" | "mid" | "high" {
  if (value < thresholds.low) return "low";
  if (value >= thresholds.high) return "high";
  return "mid";
}

/**
 * Fig. 5.5, p. 185.
 *
 * Aviso sobre el original: el texto de la p. 185 dice que una empresa con puntuación media
 * en ambos ejes sería un «regional player», mientras que la figura rotula esa casilla como
 * «regional dominant global player». Aquí se sigue la figura, que es la que discrimina.
 */
export function positionOnAmbitionMap(gri: number, gci: number, thresholds: AmbitionThresholds = DEFAULT_THRESHOLDS): AmbitionPosition {
  const x = band(gri, thresholds);
  const y = band(gci, thresholds);
  let role: GlobalRoleId;
  let zone: Localized;

  if (y === "low") {
    if (x === "low") { role = "regional_player"; zone = loc("Jugador regional", "Regional player"); }
    else if (x === "mid") { role = "global_exporter"; zone = loc("Exportador", "Exporter"); }
    else { role = "global_exporter"; zone = loc("Exportador global", "Global exporter"); }
  } else if (x === "low") {
    role = "global_sourcer";
    zone = loc("Aprovisionador global", "Global sourcer");
  } else if (x === "high" && y === "high") {
    role = "global_player";
    zone = loc("Jugador global", "Global player");
  } else {
    role = "regional_dominant_global_player";
    zone = loc("Jugador global de dominante regional", "Regional dominant global player");
  }

  return { role, zone, gri, gci, thresholds, provenance: loc("Fig. 5.5, p. 185", "Fig. 5.5, p. 185") };
}

export function roleLabel(id: GlobalRoleId): Localized {
  return GLOBAL_ROLES.find((role) => role.id === id)?.label ?? loc(id, id);
}

/* ------------------------------------------------------------------------------------ */
/* Brecha de ambición                                                                    */
/* ------------------------------------------------------------------------------------ */

export type AmbitionGap = {
  current: GlobalRoleId | null;
  target: GlobalRoleId | null;
  observed: GlobalRoleId | null;
  /** El rol declarado como actual no coincide con el que sale de los índices. */
  selfAssessmentMismatch: boolean;
  /** Hay una distancia real entre lo que la empresa es y lo que dice querer ser. */
  hasGap: boolean;
  horizonYears: number | null;
  note: Localized | null;
};

export function ambitionGap(input: AmbitionInput, indices: Indices, thresholds: AmbitionThresholds = DEFAULT_THRESHOLDS): AmbitionGap {
  const observed = indices.gri !== null && indices.gci !== null ? positionOnAmbitionMap(indices.gri, indices.gci, thresholds).role : null;
  const mismatch = Boolean(input.currentRole && observed && input.currentRole !== observed);
  const hasGap = Boolean(input.targetRole && (input.currentRole ?? observed) && input.targetRole !== (input.currentRole ?? observed));

  let note: Localized | null = null;
  if (mismatch) {
    const declared = roleLabel(input.currentRole as GlobalRoleId);
    const measured = roleLabel(observed as GlobalRoleId);
    note = loc(
      `La empresa se declara «${pick(declared, "es")}» pero sus índices la sitúan como «${pick(measured, "es")}». Conviene resolver esa contradicción antes de fijar el objetivo.`,
      `The company declares itself a \u201c${pick(declared, "en")}\u201d but its indices place it as a \u201c${pick(measured, "en")}\u201d. That contradiction is worth resolving before setting the target.`
    );
  } else if (!input.targetRole) {
    note = loc(
      "Falta declarar el rol objetivo: sin él no hay brecha que medir ni prioridad de inversión que derivar.",
      "The target role is missing: without it there is no gap to measure and no investment priority to derive."
    );
  }

  return {
    current: input.currentRole ?? observed,
    target: input.targetRole ?? null,
    observed,
    selfAssessmentMismatch: mismatch,
    hasGap,
    horizonYears: input.targetHorizonYears ?? null,
    note,
  };
}

/* ------------------------------------------------------------------------------------ */
/* Exhaustividad del módulo                                                              */
/* ------------------------------------------------------------------------------------ */

export type AmbitionCompleteness = { complete: boolean; missing: Localized[]; answered: number; total: number };

export function ambitionCompleteness(input: AmbitionInput, indices: Indices): AmbitionCompleteness {
  const checks: { label: Localized; done: boolean }[] = [
    { label: loc("Al menos un motivo de globalización, con justificación", "At least one globalization motive, with a justification"), done: input.motives.some((motive) => motive.selected && (motive.justification ?? "").trim().length > 0) },
    { label: loc("Rol global actual", "Current global role"), done: Boolean(input.currentRole) },
    { label: loc("Rol global objetivo y horizonte", "Target global role and horizon"), done: Boolean(input.targetRole && input.targetHorizonYears) },
    { label: loc("Demanda de la industria por regiones", "Industry demand by region"), done: indices.missing.industry.length === 0 },
    { label: loc("Ventas de la empresa por regiones", "Company revenue by region"), done: indices.missing.revenue.length === 0 },
    { label: loc("Activos o empleo por regiones", "Assets or headcount by region"), done: indices.missing.capability.length === 0 },
    { label: loc("Etapa de globalización", "Stage of globalization"), done: Boolean(input.stage) },
    { label: loc("Rol asignado a cada país del universo", "A role assigned to every country in the universe"), done: input.countryRoles.length > 0 && input.countryRoles.every((entry) => entry.role !== null) },
    { label: loc("Liability of foreignness declarada", "Liability of foreignness declared"), done: (input.liabilityOfForeignness ?? "").trim().length > 0 },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
