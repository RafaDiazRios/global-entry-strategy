import { z } from "zod";
import { emptyAmbitionInput, type AmbitionInput } from "@shared/domain/globalAmbition";
import { emptyPositioningInput, type PositioningInput } from "@shared/domain/globalPositioning";

/**
 * Validación de los bloques del capítulo 5 antes de guardarlos.
 *
 * El payload viaja como JSON y se guarda como JSON, así que la única defensa contra un
 * documento mal formado —o contra un cliente de otra versión— es esta capa. Los campos que
 * el analista aún no ha contestado entran como null; lo que no se admite es una forma
 * distinta de la esperada.
 */

const regionFigures = z.record(z.string().max(40), z.number().finite().nullable());
const text = (max: number) => z.string().max(max).nullable();

export const ambitionInputSchema = z.object({
  regionSetId: z.enum(["four_regions", "three_regions"]),
  motives: z.array(z.object({
    id: z.enum(["market_seeking", "resource_seeking", "capability_seeking"]),
    selected: z.boolean(),
    justification: text(1200),
  })).max(3),
  currentRole: z.enum(["global_player", "regional_player", "global_exporter", "global_sourcer", "regional_dominant_global_player"]).nullable(),
  targetRole: z.enum(["global_player", "regional_player", "global_exporter", "global_sourcer", "regional_dominant_global_player"]).nullable(),
  targetHorizonYears: z.number().int().min(1).max(30).nullable(),
  industryId: z.string().max(60).nullable(),
  industryDemand: regionFigures,
  companyRevenue: regionFigures,
  companyCapability: regionFigures,
  capabilityBasis: z.enum(["assets", "personnel"]),
  stage: z.enum(["export", "multinational", "global"]).nullable(),
  organizationalPhase: z.enum(["early_export", "large_export_early_multinational", "full_multinational", "global", "global_multi_business"]).nullable(),
  countryRoles: z.array(z.object({
    countryCode: z.string().min(2).max(3),
    role: z.enum(["key", "emerging", "platform", "marketing", "sourcing"]).nullable(),
    justification: text(800),
  })).max(60),
  liabilityOfForeignness: text(1500),
});

const valueChainCell = z.object({
  current: z.enum(["global", "regional", "local"]).nullable(),
  target: z.enum(["global", "regional", "local"]).nullable(),
});

export const positioningInputSchema = z.object({
  scope: z.enum(["niche", "broad"]).nullable(),
  advantage: z.enum(["cost", "differentiated"]).nullable(),
  standardization: z.enum(["standardized", "adaptive"]).nullable(),
  positioningRationale: text(1500),
  competitors: z.array(z.object({ id: z.string().max(40), label: z.string().min(1).max(120) })).max(3),
  valueCurve: z.array(z.object({
    id: z.string().max(40),
    label: z.string().min(1).max(140),
    asIs: z.number().min(0).max(5).nullable(),
    toBe: z.number().min(0).max(5).nullable(),
    competitors: z.record(z.string().max(40), z.number().min(0).max(5).nullable()),
    note: text(600),
  })).max(20),
  buyerUtility: z.record(z.string().max(60), z.string().max(400).nullable()),
  valueChain: z.object({
    rnd: valueChainCell,
    sourcing_production: valueChainCell,
    marketing: valueChainCell,
    customer_services: valueChainCell,
    finances: valueChainCell,
    hrm: valueChainCell,
  }),
  capabilities: z.array(z.object({
    id: z.string().max(40),
    typeId: z.enum(["differentiation", "cost_leadership", "innovative", "time_based", "blue_ocean"]),
    label: z.string().min(1).max(180),
    isAdvantage: z.boolean(),
  })).max(40),
  sustainability: z.array(z.object({
    typeId: z.enum(["customer_loyalty", "network_externalities", "accumulated_volume", "pre_emption"]),
    modeId: z.enum(["first_mover", "leverage"]),
    how: text(800),
  })).max(8),
  tac: z.array(z.object({
    id: z.string().max(40),
    kind: z.enum(["resource", "asset", "competency"]),
    label: z.string().min(1).max(180),
    functionId: z.enum(["rnd", "sourcing_production", "marketing", "customer_services", "finances", "hrm"]).nullable(),
    tag: z.enum(["transfer", "adapt", "create"]).nullable(),
    note: text(600),
  })).max(60),
  liabilityOfForeignness: z.object({
    handicap: text(1500),
    compensatingAdvantage: text(1500),
  }),
});

/** Un módulo nunca guardado devuelve el bloque vacío, no null: el cliente no debe adivinar. */
export function parseAmbition(payload: unknown): AmbitionInput {
  const parsed = ambitionInputSchema.safeParse(payload);
  return parsed.success ? (parsed.data as AmbitionInput) : emptyAmbitionInput();
}

export function parsePositioning(payload: unknown): PositioningInput {
  const parsed = positioningInputSchema.safeParse(payload);
  return parsed.success ? (parsed.data as PositioningInput) : emptyPositioningInput();
}
