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

export const CONVENTIONS: { id: IndicesConvention; label: string; formula: string; note: string }[] = [
  {
    id: "overlap",
    label: "Solapamiento de distribuciones",
    formula: "GRI = Σᵢ min(Sᵢ, Wᵢ)",
    note:
      "Sᵢ es el porcentaje de ventas de la empresa en la región i y Wᵢ el porcentaje de la demanda mundial de la industria en esa región. " +
      "Equivale exactamente a Σᵢ Wᵢ · min(Sᵢ/Wᵢ, 1), que es la lectura literal de la definición del libro —«the ratio of the company's " +
      "distribution of sales to the industry distribution of demand» (p. 218)— ponderada por el peso de cada región y con el cociente " +
      "limitado a 1, y también a 1 − ½·Σᵢ|Sᵢ − Wᵢ|. Escala 0-1: 1 significa que la empresa reparte sus ventas igual que el mercado mundial.",
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
  zone: string;
  gri: number;
  gci: number;
  thresholds: AmbitionThresholds;
  provenance: string;
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
  let zone: string;

  if (y === "low") {
    if (x === "low") { role = "regional_player"; zone = "Jugador regional"; }
    else if (x === "mid") { role = "global_exporter"; zone = "Exportador"; }
    else { role = "global_exporter"; zone = "Exportador global"; }
  } else if (x === "low") {
    role = "global_sourcer";
    zone = "Aprovisionador global";
  } else if (x === "high" && y === "high") {
    role = "global_player";
    zone = "Jugador global";
  } else {
    role = "regional_dominant_global_player";
    zone = "Jugador global de dominante regional";
  }

  return { role, zone, gri, gci, thresholds, provenance: "Fig. 5.5, p. 185" };
}

export function roleLabel(id: GlobalRoleId) {
  return GLOBAL_ROLES.find((role) => role.id === id)?.label ?? id;
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
  note: string | null;
};

export function ambitionGap(input: AmbitionInput, indices: Indices, thresholds: AmbitionThresholds = DEFAULT_THRESHOLDS): AmbitionGap {
  const observed = indices.gri !== null && indices.gci !== null ? positionOnAmbitionMap(indices.gri, indices.gci, thresholds).role : null;
  const mismatch = Boolean(input.currentRole && observed && input.currentRole !== observed);
  const hasGap = Boolean(input.targetRole && (input.currentRole ?? observed) && input.targetRole !== (input.currentRole ?? observed));

  let note: string | null = null;
  if (mismatch) {
    note = `La empresa se declara «${roleLabel(input.currentRole as GlobalRoleId)}» pero sus índices la sitúan como «${roleLabel(observed as GlobalRoleId)}». Conviene resolver esa contradicción antes de fijar el objetivo.`;
  } else if (!input.targetRole) {
    note = "Falta declarar el rol objetivo: sin él no hay brecha que medir ni prioridad de inversión que derivar.";
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

export type AmbitionCompleteness = { complete: boolean; missing: string[]; answered: number; total: number };

export function ambitionCompleteness(input: AmbitionInput, indices: Indices): AmbitionCompleteness {
  const checks: { label: string; done: boolean }[] = [
    { label: "Al menos un motivo de globalización, con justificación", done: input.motives.some((motive) => motive.selected && (motive.justification ?? "").trim().length > 0) },
    { label: "Rol global actual", done: Boolean(input.currentRole) },
    { label: "Rol global objetivo y horizonte", done: Boolean(input.targetRole && input.targetHorizonYears) },
    { label: "Demanda de la industria por regiones", done: indices.missing.industry.length === 0 },
    { label: "Ventas de la empresa por regiones", done: indices.missing.revenue.length === 0 },
    { label: "Activos o empleo por regiones", done: indices.missing.capability.length === 0 },
    { label: "Etapa de globalización", done: Boolean(input.stage) },
    { label: "Rol asignado a cada país del universo", done: input.countryRoles.length > 0 && input.countryRoles.every((entry) => entry.role !== null) },
    { label: "Liability of foreignness declarada", done: (input.liabilityOfForeignness ?? "").trim().length > 0 },
  ];
  const missing = checks.filter((check) => !check.done).map((check) => check.label);
  return { complete: missing.length === 0, missing, answered: checks.length - missing.length, total: checks.length };
}
