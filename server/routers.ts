import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { evaluateStrategy, type EntryObjective, type EvaluationInput, type MarketData } from "./strategy/engine";
import { getIndicatorPoints, getWorldBankMarketData, publicSources } from "./strategy/worldBank";
import { fitPenetrationCurve, middleClassEffect } from "./strategy/marketCurves";
import { critiqueAssessment, extractCaseEvidence, proposeAssessmentBlock, type CaseSource } from "./ai/caseCopilot";
import { extractPdfText } from "./ai/pdfText";
import { storageGetSignedUrl, storagePut } from "./storage";
import { getWgiGovernanceData } from "./strategy/wgi";
import { ambitionCompleteness, ambitionGap, computeIndices, CONVENTIONS, DEFAULT_THRESHOLDS, positionOnAmbitionMap } from "./strategy/globalAmbition";
import { diagnoseValueChain, diagnoseValueCurve, positioningCompleteness, positioningWarnings, resolvePositioning, resourceGap } from "./strategy/globalPositioning";
import { ambitionInputSchema, entryStrategyInputSchema, parseAmbition, parseEntryStrategy, parsePartnering, parsePositioning, parseRouteProgress, parseThesisPayload, partneringInputSchema, positioningInputSchema, routeProgressSchema, thesisPayloadSchema } from "./strategy/globalStrategySchemas";
import { blindSpots, evaluateThesis } from "./strategy/thesis";
import * as thesisDomain from "@shared/domain/thesis";
import * as assumptionDomain from "@shared/domain/assumptionMap";
import { AUTHORITIES } from "@shared/domain/approvalChain";
import { INDUSTRIES, resolveChain } from "@shared/domain/industries";
import { entryStrategyCompleteness, entryStrategyWarnings, mappingShortlist, paceProfile, phaseDefinition } from "./strategy/entryStrategy";
import * as entryDomain from "@shared/domain/entryStrategy";
import * as partneringDomain from "@shared/domain/partnering";
import { completenessIndex, evaluateCoherence } from "./strategy/coherence";
import { diagnoseFits, diagnoseRealOption, evaluateGaps, partneringCompleteness, partneringWarnings, partnerTypeRisks } from "./strategy/partnering";
import { entryModes } from "@shared/domain/entryModes";
import * as ambitionDomain from "@shared/domain/globalAmbition";
import * as positioningDomain from "@shared/domain/globalPositioning";
import { financialPublicSources, getCountryFinancialReference } from "./strategy/countryFinancialData";
import { localizedError } from "@shared/localizedError";
import { DEFAULT_LANG, LANGUAGES, loc, pick, type Lang } from "@shared/i18n";

/**
 * El idioma solo viaja en la petición donde el servidor redacta texto nuevo: los hitos por
 * defecto de un gate, que se guardan como texto editable, y el copiloto, que escribe frases.
 * Todo lo demás sale en los dos idiomas y lo elige el cliente.
 */
const langSchema = z.enum(LANGUAGES).optional();

const score = z.number().min(0).max(100);
const calibrationSchema = z.object({
  demandQuality: score.optional(),
  resourceFit: score.optional(),
  competitionAttractiveness: score.optional(),
  governmentOpenness: score.optional(),
  cageDistance: score.optional(),
  politicalRisk: score.optional(),
  economicRisk: score.optional(),
  competitiveRisk: score.optional(),
  operationalRisk: score.optional(),
  internalReadiness: score.optional(),
  timePressure: score.optional(),
  controlNeed: score.optional(),
  ipSensitivity: score.optional(),
});

const calibrationNoteSchema = z.object({
  rationale: z.string().max(1200).nullable().optional(),
  sourceLabel: z.string().max(300).nullable().optional(),
});

const calibrationNotesSchema = z.object({
  demandQuality: calibrationNoteSchema.optional(),
  resourceFit: calibrationNoteSchema.optional(),
  competitionAttractiveness: calibrationNoteSchema.optional(),
  governmentOpenness: calibrationNoteSchema.optional(),
  cageDistance: calibrationNoteSchema.optional(),
  politicalRisk: calibrationNoteSchema.optional(),
  economicRisk: calibrationNoteSchema.optional(),
  competitiveRisk: calibrationNoteSchema.optional(),
  operationalRisk: calibrationNoteSchema.optional(),
  internalReadiness: calibrationNoteSchema.optional(),
  timePressure: calibrationNoteSchema.optional(),
  controlNeed: calibrationNoteSchema.optional(),
  ipSensitivity: calibrationNoteSchema.optional(),
});

const knockOutPolicySchema = z.object({
  maxPoliticalRisk: score.nullable().optional(),
  maxEconomicRisk: score.nullable().optional(),
  maxCompetitiveRisk: score.nullable().optional(),
  maxOperationalRisk: score.nullable().optional(),
  maxCageDistance: score.nullable().optional(),
  minSafety: score.nullable().optional(),
  requireGovernanceEvidence: z.boolean().nullable().optional(),
});

const countryAssessmentSchema = z.object({
  // Clave `bloque.grupo.item`; el valor 0-4 o null cuando el ítem no se ha evaluado.
  ratings: z.record(z.string().max(120), z.number().min(0).max(4).nullable()).optional(),
  notes: z.record(z.string().max(120), z.string().max(1200)).optional(),
  incentives: z.array(z.string().max(80)).max(40).optional(),
  sustainabilityConcerns: z.array(z.string().max(80)).max(20).optional(),
  lifeCycleCluster: z.enum(["developing", "emerging", "fastIndustrializing", "industrialized"]).nullable().optional(),
  easeOfDoingBusinessScore: z.number().min(0).max(100).nullable().optional(),
  profileOverride: z.enum(["hub", "emergingGiant", "fastIndustrializing", "developing", "oecd", "resourceRich"]).nullable().optional(),
});

const competitorSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().max(120),
  sharePct: z.number().min(0).max(100).nullable(),
  holdReason: z.string().max(400).nullable(),
  note: z.string().max(400).nullable(),
});

const competitiveLandscapeSchema = z.object({
  marketUnits: z.number().nonnegative().nullable(),
  unitLabel: z.string().max(60).nullable(),
  driverId: z.string().max(60).nullable(),
  acquisitionCost: z.number().nullable(),
  competitors: z.array(competitorSchema).max(20),
  note: z.string().max(600).nullable(),
});

const countrySchema = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(2).max(100).optional(),
  calibration: calibrationSchema.optional(),
  calibrationNotes: calibrationNotesSchema.optional(),
  assessment: countryAssessmentSchema.optional(),
  knockOuts: knockOutPolicySchema.optional(),
  competitiveLandscape: competitiveLandscapeSchema.nullable().optional(),
});

const governanceSchema = z.object({
  politicalStability: z.number().nullable(),
  governmentEffectiveness: z.number().nullable(),
  regulatoryQuality: z.number().nullable(),
  ruleOfLaw: z.number().nullable(),
  controlOfCorruption: z.number().nullable(),
  sourceYear: z.number().nullable(),
  sourceStatus: z.enum(["live", "partial", "unavailable"]),
});

const marketDataSchema = z.object({
  gdpUsd: z.number().nullable().optional(),
  gdpPerCapita: z.number().nullable().optional(),
  gdpGrowth: z.number().nullable().optional(),
  population: z.number().nullable().optional(),
  urbanization: z.number().nullable().optional(),
  internetUse: z.number().nullable().optional(),
  tradeOpenness: z.number().nullable().optional(),
  investmentRate: z.number().nullable().optional(),
  fdiInflowUsd: z.number().nullable().optional(),
  fdiInflowPctGdp: z.number().nullable().optional(),
  gdpPpp: z.number().nullable().optional(),
  gdpPerCapitaPpp: z.number().nullable().optional(),
  incomeDistributionGini: z.number().nullable().optional(),
  householdConsumptionPctGdp: z.number().nullable().optional(),
  savingsRate: z.number().nullable().optional(),
  populationGrowth: z.number().nullable().optional(),
  workingAgeSharePct: z.number().nullable().optional(),
  governmentSpendingPctGdp: z.number().nullable().optional(),
  tertiaryEnrolmentPct: z.number().nullable().optional(),
  researchersPerMillion: z.number().nullable().optional(),
  researchSpendingPctGdp: z.number().nullable().optional(),
  electricityAccessPct: z.number().nullable().optional(),
  gdpGrowthSeries: z.array(z.object({ year: z.number().int(), value: z.number() })).max(60).nullable().optional(),
  governance: governanceSchema.optional(),
  sourceYear: z.number().nullable().optional(),
  lastUpdatedAt: z.string().nullable().optional(),
  manualFields: z.array(z.string().min(1).max(80)).max(30).optional(),
  sourceStatus: z.enum(["live", "partial", "unavailable"]),
});

const modeFinancialProfileSchema = z.object({
  initialInvestment: z.number().nonnegative().nullable().optional(),
  annualOperatingCost: z.number().nonnegative().nullable().optional(),
  revenueCapturePct: z.number().min(0).max(100).nullable().optional(),
  economicModel: z.enum(["operator", "royalty", "channel", "cost_only"]).nullable().optional(),
  royaltyRatePct: z.number().min(0).max(100).nullable().optional(),
  upfrontFee: z.number().nonnegative().nullable().optional(),
  componentMarginPct: z.number().min(0).max(100).nullable().optional(),
  channelMarginPct: z.number().min(0).max(100).nullable().optional(),
});

/** Un par `{ es, en }` tal como lo devolvió el servidor y lo reenvía el cliente. */
const localizedSchema = (max: number) => z.object({ es: z.string().min(1).max(max), en: z.string().min(1).max(max) });

const financialDataProvenanceSchema = z.object({
  sourceStatus: z.enum(["live", "partial", "unavailable"]),
  sourceName: z.string().min(1).max(200),
  sourceUrl: z.string().url(),
  sourceYear: z.number().int().nullable().optional(),
  observedAt: z.string().nullable().optional(),
  retrievedAt: z.string().min(1).max(80),
  note: localizedSchema(1500),
});

const sensitivityScenarioSchema = z.object({
  priceRevenuePct: z.number().min(-100).max(500).nullable().optional(),
  operatingMarginPctPoints: z.number().min(-100).max(100).nullable().optional(),
  fxRatePct: z.number().min(-100).max(500).nullable().optional(),
});

/**
 * La pila viaja dentro de los supuestos financieros del país, que es donde vive el resto del
 * caso económico. No es un módulo aparte porque no se puede razonar sobre ella sin el
 * horizonte, la moneda y el coste fijo del modo, y separarla obligaría a mantener dos
 * verdades sobre el mismo negocio.
 */
const revenueDriverSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  unit: z.enum(["count", "amount"]),
  valueYearOne: z.number().nullable(),
  valueAtHorizon: z.number().nullable(),
  ramp: z.enum(["linear", "s_curve", "manual"]),
  valuesByYear: z.array(z.number().nullable()).max(25).nullable().optional(),
  note: z.string().max(400).nullable(),
});

const stackItemSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  kind: z.enum(["revenue", "direct_cost"]),
  driverId: z.string().max(60).nullable(),
  rateKind: z.enum(["pct_of_driver", "amount_per_unit", "fixed_amount"]),
  rate: z.number().nullable(),
  origin: z.enum(["book", "sector", "user"]),
  provenance: localizedSchema(600).nullable(),
});

const stackLineSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  items: z.array(stackItemSchema).max(30),
  fixedCostSharePct: z.number().min(0).max(100).nullable(),
  note: z.string().max(400).nullable(),
});

const revenueStackSchema = z.object({
  drivers: z.array(revenueDriverSchema).max(20),
  lines: z.array(stackLineSchema).max(10),
  templateId: z.string().max(60).nullable(),
});

const financialAssumptionsSchema = z.object({
  currency: z.string().min(1).max(10).nullable().optional(),
  reportingCurrency: z.string().min(1).max(10).nullable().optional(),
  fxRateToReportingCurrency: z.number().positive().nullable().optional(),
  tamYearOne: z.number().nonnegative().nullable().optional(),
  annualMarketGrowthPct: z.number().min(-100).max(500).nullable().optional(),
  samPct: z.number().min(0).max(100).nullable().optional(),
  somPctYearOne: z.number().min(0).max(100).nullable().optional(),
  somPctHorizon: z.number().min(0).max(100).nullable().optional(),
  somRampShape: z.enum(["linear", "s_curve", "manual"]).nullable().optional(),
  somPctByYear: z.array(z.number().min(0).max(100).nullable()).max(25).nullable().optional(),
  operatingMarginPct: z.number().min(-100).max(100).nullable().optional(),
  taxRatePct: z.number().min(0).max(100).nullable().optional(),
  taxLossCarryforward: z.boolean().nullable().optional(),
  taxRateDataMode: z.enum(["public", "manual"]).optional(),
  taxReference: financialDataProvenanceSchema.nullable().optional(),
  workingCapitalPctRevenue: z.number().min(-100).max(100).nullable().optional(),
  discountRatePct: z.number().min(0).max(100).nullable().optional(),
  terminalGrowthPct: z.number().min(-100).max(100).nullable().optional(),
  fxRateDataMode: z.enum(["public", "manual"]).optional(),
  fxReference: financialDataProvenanceSchema.nullable().optional(),
  sensitivityScenarios: z.object({
    optimistic: sensitivityScenarioSchema.optional(),
    conservative: sensitivityScenarioSchema.optional(),
  }).optional(),
  revenueStack: revenueStackSchema.nullable().optional(),
  modeProfiles: z.object({
    greenfield: modeFinancialProfileSchema.optional(),
    acquisition: modeFinancialProfileSchema.optional(),
    alliance: modeFinancialProfileSchema.optional(),
    licensing: modeFinancialProfileSchema.optional(),
    distributor: modeFinancialProfileSchema.optional(),
    office: modeFinancialProfileSchema.optional(),
    digital: modeFinancialProfileSchema.optional(),
  }).optional(),
});

const investmentThresholdsSchema = z.object({
  currency: z.string().min(1).max(10).nullable().optional(),
  roiBasis: z.enum(["operating_horizon", "including_terminal"]).nullable().optional(),
  advanceMinRiskAdjusted: z.number().min(0).max(100).nullable().optional(),
  testMinRiskAdjusted: z.number().min(0).max(100).nullable().optional(),
  minConfidence: z.number().min(0).max(100).nullable().optional(),
  advanceMinNpv: z.number().nullable().optional(),
  testMinNpv: z.number().nullable().optional(),
  advanceMinRoiPct: z.number().min(-100).max(10000).nullable().optional(),
  testMinRoiPct: z.number().min(-100).max(10000).nullable().optional(),
  advanceMaxPaybackYears: z.number().min(1).max(50).nullable().optional(),
  testMaxInitialInvestment: z.number().nonnegative().nullable().optional(),
});

const evaluationSchema = z.object({
  companyName: z.string().min(2).max(180),
  homeCountry: z.string().min(2).max(120),
  industry: z.string().min(2).max(180),
  businessModel: z.string().min(2).max(120),
  valueProposition: z.string().max(1200),
  objective: z.enum(["market", "resources", "learning", "coordination"]),
  horizonYears: z.number().int().min(1).max(25),
  countryInputs: z.array(countrySchema).min(1).max(12),
  marketData: z.record(z.string(), marketDataSchema),
  financialByCountry: z.record(z.string(), financialAssumptionsSchema).optional(),
  investmentThresholds: investmentThresholdsSchema.optional(),
  weights: z.object({
    market: z.number().min(0).max(100).optional(),
    resources: z.number().min(0).max(100).optional(),
    competition: z.number().min(0).max(100).optional(),
    government: z.number().min(0).max(100).optional(),
    distance: z.number().min(0).max(100).optional(),
    risk: z.number().min(0).max(100).optional(),
  }).optional(),
  entryDeliveryModel: z.enum(["relational", "digital", "hybrid"]).optional(),
  entryModeWeights: z.object({
    upFrontInvestment: z.number().min(0).max(100).optional(),
    speedOfEntry: z.number().min(0).max(100).optional(),
    marketPenetration: z.number().min(0).max(100).optional(),
    marketControl: z.number().min(0).max(100).optional(),
    politicalRiskExposure: z.number().min(0).max(100).optional(),
    technologicalLeakage: z.number().min(0).max(100).optional(),
    managerialComplexity: z.number().min(0).max(100).optional(),
    financialReturnPotential: z.number().min(0).max(100).optional(),
  }).optional(),
  knockOuts: knockOutPolicySchema.optional(),
  tornadoDeltaPct: z.number().min(1).max(90).optional(),
});

const approvalStatusSchema = z.enum(["not_started", "in_review", "approved", "changes_requested", "on_hold", "closed"]);
const milestoneStatusSchema = z.enum(["pending", "in_progress", "blocked", "complete", "not_applicable"]);
const approvalMilestoneSchema = z.object({
  title: z.string().min(2).max(220),
  responsible: z.string().max(160).nullable().optional(),
  dueAt: z.number().int().positive().nullable().optional(),
  status: milestoneStatusSchema.optional(),
  evidence: z.string().max(4000).nullable().optional(),
});

function futureDate(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Los hitos se guardan como texto editable, no como pares bilingües: en cuanto alguien los
 * reescribe dejan de ser del marco y pasan a ser del caso. Se redactan una vez, en el idioma
 * de quien abre el gate.
 */
const MILESTONE_TEMPLATES = {
  advance: [
    loc("Confirmar tesis, regulación y estructura fiscal local", "Confirm the thesis, the regulation and the local tax structure"),
    loc("Validar demanda, precio y economía unitaria con evidencia local", "Validate demand, price and unit economics with local evidence"),
    loc("Cerrar plan operativo, socios críticos y riesgos de implementación", "Close the operating plan, the critical partners and the implementation risks"),
  ],
  test: [
    loc("Aprobar carta de prueba, hipótesis y límites de inversión", "Approve the test charter, the hypotheses and the investment limits"),
    loc("Ejecutar prueba comercial y recoger evidencia de demanda y precio", "Run the commercial test and collect evidence on demand and price"),
    loc("Revisar resultados, aprendizaje y condiciones para escalar o abandonar", "Review results, learning and the conditions to scale or walk away"),
  ],
} as const;

const GATE_REVIEW_MILESTONE = loc("Revisión de gate y decisión documentada", "Gate review and documented decision");

function defaultApprovalMilestones(recommendation: "advance" | "test", responsible: string, reviewAt: Date, lang: Lang) {
  const [first, second, third] = MILESTONE_TEMPLATES[recommendation];
  return [
    { title: pick(first, lang), responsible, dueAt: futureDate(reviewAt, -21), status: "pending" as const },
    { title: pick(second, lang), responsible, dueAt: futureDate(reviewAt, -14), status: "pending" as const },
    { title: pick(third, lang), responsible, dueAt: futureDate(reviewAt, -7), status: "pending" as const },
    { title: pick(GATE_REVIEW_MILESTONE, lang), responsible, dueAt: reviewAt, status: "pending" as const },
  ];
}

/**
 * Construye la fuente que se pasa al copiloto. El texto plano permite verificar las citas
 * contra el original; un PDF solo permite exigir que la cita y el localizador existan.
 */
async function loadCaseSource(userId: number, documentId: number): Promise<CaseSource> {
  const document = await db.getCaseDocument(userId, documentId);
  if (!document) throw localizedError("Documento no encontrado o sin acceso.", "Document not found, or no access to it.");
  if (document.textContent) {
    return { text: document.textContent, label: document.filename };
  }
  if (!document.storageKey) throw localizedError("El documento no tiene contenido utilizable.", "The document has no usable content.");
  const signedUrl = await storageGetSignedUrl(document.storageKey);
  return { documentUrl: signedUrl, mimeType: document.mimeType, label: document.filename };
}


/* ------------------------------------------------------------------------------------ */
/* Capítulo 5 — ambición y posicionamiento                                               */
/* ------------------------------------------------------------------------------------ */

/**
 * El análisis derivado se calcula siempre en el servidor y nunca se guarda: lo guardado son
 * las respuestas del analista, y todo lo demás se vuelve a deducir de ellas. Así una
 * corrección del motor alcanza a los casos ya archivados en lugar de dejarlos con cifras
 * viejas.
 */
function analyseAmbition(input: ambitionDomain.AmbitionInput) {
  const indices = computeIndices(input);
  const position = indices.gri !== null && indices.gci !== null ? positionOnAmbitionMap(indices.gri, indices.gci) : null;
  return {
    input,
    indices,
    position,
    gap: ambitionGap(input, indices),
    completeness: ambitionCompleteness(input, indices),
    thresholds: DEFAULT_THRESHOLDS,
    convention: CONVENTIONS[0],
  };
}

function analysePartnering(input: partneringDomain.PartneringInput) {
  return {
    input,
    verdicts: evaluateGaps(input),
    fits: diagnoseFits(input),
    partner: partnerTypeRisks(input.partnerType),
    option: diagnoseRealOption(input),
    warnings: partneringWarnings(input),
    completeness: partneringCompleteness(input),
  };
}

function analyseEntryStrategy(input: entryDomain.EntryStrategyInput) {
  return {
    input,
    phase: phaseDefinition(input.phase),
    pace: paceProfile(input),
    shortlist: mappingShortlist(input.marketAttractiveness, input.politicalClimate),
    warnings: entryStrategyWarnings(input),
    completeness: entryStrategyCompleteness(input),
  };
}

/**
 * La tesis se evalúa contra la cadena de aprobación y, para la comprobación al revés, contra
 * lo que ya haya en los demás módulos. Un caso que empezó en modo aprendizaje y que después
 * enuncia una tesis se beneficia de todo lo que ya estaba contestado.
 */
async function analyseThesis(
  userId: number,
  caseId: number,
  thesis: thesisDomain.ThesisInput,
  answers: assumptionDomain.AssumptionAnswer[],
) {
  const [ambition, positioning, entry, partnering] = await Promise.all([
    db.getCaseModule(userId, caseId, "ambition"),
    db.getCaseModule(userId, caseId, "positioning"),
    db.getCaseModule(userId, caseId, "entry"),
    db.getCaseModule(userId, caseId, "partnering"),
  ]);
  const dossier = {
    ambition: ambition ? parseAmbition(ambition.payload) : null,
    positioning: positioning ? parsePositioning(positioning.payload) : null,
    entry: entry ? parseEntryStrategy(entry.payload) : null,
    partnering: partnering ? parsePartnering(partnering.payload) : null,
  };
  const findings = evaluateCoherence(dossier);
  return {
    thesis,
    answers,
    verdict: evaluateThesis(thesis, answers),
    blindSpots: blindSpots(thesis, answers, findings),
    chain: resolveChain(thesis.industryId),
  };
}

function analysePositioning(input: positioningDomain.PositioningInput) {
  const positioning = resolvePositioning(input);
  return {
    input,
    // La familia se resuelve aquí para que el cliente no tenga que conocer la tabla.
    positioning: positioning
      ? { ...positioning, familyLabel: positioningDomain.positioningFamilyLabel(positioning.familyId) }
      : null,
    valueCurve: diagnoseValueCurve(input),
    valueChain: diagnoseValueChain(input),
    resourceGap: resourceGap(input),
    warnings: positioningWarnings(input),
    completeness: positioningCompleteness(input),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  strategy: router({
    getPublicSources: publicProcedure.query(() => publicSources),
    getFinancialPublicSources: publicProcedure.query(() => financialPublicSources),

    fetchMarketData: protectedProcedure
      .input(z.object({ countryCodes: z.array(z.string().min(2).max(3)).min(1).max(12) }))
      .mutation(async ({ input }) => {
        const normalizedCodes = Array.from(new Set(input.countryCodes.map((code) => code.toUpperCase())));
        const results = await Promise.all(
          normalizedCodes.map(async (code) => [code, await getWorldBankMarketData(code, false)] as const),
        );
        return Object.fromEntries(results) as Record<string, MarketData>;
      }),

    fetchGovernanceData: protectedProcedure
      .input(z.object({ countryCodes: z.array(z.string().min(2).max(3)).min(1).max(12) }))
      .mutation(async ({ input }) => {
        const normalizedCodes = Array.from(new Set(input.countryCodes.map((code) => code.toUpperCase())));
        const results = await Promise.all(normalizedCodes.map(async (code) => [code, await getWgiGovernanceData(code)] as const));
        return Object.fromEntries(results);
      }),

    fetchCountryFinancialData: protectedProcedure
      .input(z.object({ countryCodes: z.array(z.string().min(2).max(3)).min(1).max(12), reportingCurrency: z.string().min(3).max(3).default("USD") }))
      .mutation(async ({ input }) => {
        const normalizedCodes = Array.from(new Set(input.countryCodes.map((code) => code.toUpperCase())));
        const results = await Promise.all(normalizedCodes.map(async (code) => [code, await getCountryFinancialReference(code, input.reportingCurrency.toUpperCase())] as const));
        return Object.fromEntries(results);
      }),

    evaluate: protectedProcedure.input(evaluationSchema).mutation(({ input }) => {
      return evaluateStrategy(input as EvaluationInput);
    }),

    /**
     * Curva de penetración: correlaciona un indicador de consumo con la renta per cápita
     * sobre los países indicados y devuelve el ajuste con su R (Figuras 6.4-6.5, p. 230).
     * Los puntos pueden venir del World Bank por código de indicador o entrarse a mano.
     */
    fitPenetrationCurve: protectedProcedure
      .input(z.object({
        model: z.enum(["linear", "logarithmic", "invertedU"]).optional(),
        points: z.array(z.object({ label: z.string().min(1).max(80), gdpPerCapita: z.number().positive(), value: z.number() })).min(3).max(120).optional(),
        indicator: z.string().min(3).max(40).optional(),
        countryCodes: z.array(z.string().min(2).max(3)).min(3).max(60).optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.points?.length) {
          return { ...fitPenetrationCurve(input.points, input.model), points: input.points };
        }
        if (!input.indicator || !input.countryCodes?.length) {
          throw localizedError("Indique puntos explícitos o un indicador con su lista de países.", "Give explicit points, or an indicator together with its list of countries.");
        }
        const points = await getIndicatorPoints(input.indicator, input.countryCodes);
        if (points.length < 3) throw localizedError("La fuente pública no devolvió suficientes observaciones para ajustar una curva.", "The public source did not return enough observations to fit a curve.");
        return { ...fitPenetrationCurve(points, input.model), points };
      }),

    /**
     * Efecto clase media: cuánto crece el segmento por encima de un umbral de renta
     * cuando la renta media sube (Figura 6.6, p. 232).
     */
    middleClassEffect: protectedProcedure
      .input(z.object({
        gdpPerCapita: z.number().positive(),
        gini: z.number().min(1).max(99),
        threshold: z.number().positive(),
        incomeGrowthPct: z.number().min(-90).max(500),
        upperThreshold: z.number().positive().nullable().optional(),
      }))
      .mutation(({ input }) => {
        const result = middleClassEffect(input);
        if (!result) throw localizedError("Los parámetros no permiten calcular la distribución de renta.", "The parameters do not allow the income distribution to be computed.");
        return result;
      }),

    saveScenario: protectedProcedure
      .input(z.object({ name: z.string().min(2).max(180), evaluation: evaluationSchema }))
      .mutation(async ({ ctx, input }) => {
        const result = evaluateStrategy(input.evaluation as EvaluationInput);
        const id = await db.saveStrategyScenario({
          userId: ctx.user.id,
          name: input.name,
          companyName: input.evaluation.companyName,
          homeCountry: input.evaluation.homeCountry,
          industry: input.evaluation.industry,
          businessModel: input.evaluation.businessModel,
          objective: input.evaluation.objective as EntryObjective,
          horizonYears: input.evaluation.horizonYears,
          inputJson: input.evaluation,
          resultJson: result,
          sourceRefreshAt: new Date(),
        });
        return { id, result };
      }),

    listScenarios: protectedProcedure.query(({ ctx }) => db.listStrategyScenarios(ctx.user.id)),

    /** Abrir un escenario guardado: devuelve los dos documentos para rehidratar el formulario. */
    getScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().positive() }))
      .query(({ ctx, input }) => db.getStrategyScenario(ctx.user.id, input.scenarioId)),

    /**
     * Actualizar reevalúa siempre. Guardar el resultado que traiga el cliente permitiría que
     * un escenario quedara con supuestos nuevos y conclusiones viejas.
     */
    updateScenario: protectedProcedure
      .input(z.object({
        scenarioId: z.number().int().positive(),
        name: z.string().min(2).max(180).optional(),
        caseId: z.number().int().positive().nullable().optional(),
        evaluation: evaluationSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const values: Parameters<typeof db.updateStrategyScenario>[2] = {};
        if (input.name !== undefined) values.name = input.name;
        if (input.caseId !== undefined) values.caseId = input.caseId;
        let result: unknown = null;
        if (input.evaluation) {
          result = evaluateStrategy(input.evaluation as EvaluationInput);
          values.companyName = input.evaluation.companyName;
          values.homeCountry = input.evaluation.homeCountry;
          values.industry = input.evaluation.industry;
          values.businessModel = input.evaluation.businessModel;
          values.objective = input.evaluation.objective as EntryObjective;
          values.horizonYears = input.evaluation.horizonYears;
          values.inputJson = input.evaluation;
          values.resultJson = result;
          values.sourceRefreshAt = new Date();
        }
        const row = await db.updateStrategyScenario(ctx.user.id, input.scenarioId, values);
        return { scenario: row, result: result ?? row?.resultJson ?? null };
      }),

    duplicateScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().positive(), name: z.string().min(2).max(180) }))
      .mutation(({ ctx, input }) => db.duplicateStrategyScenario(ctx.user.id, input.scenarioId, input.name)),

    deleteScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => db.deleteStrategyScenario(ctx.user.id, input.scenarioId)),

    listApprovals: protectedProcedure
      .input(z.object({ scenarioId: z.number().int().positive() }))
      .query(({ ctx, input }) => db.listApprovalWorkflows(ctx.user.id, input.scenarioId)),

    createApproval: protectedProcedure
      .input(z.object({
        scenarioId: z.number().int().positive(),
        countryCode: z.string().min(2).max(3),
        countryName: z.string().min(2).max(120),
        recommendation: z.enum(["advance", "test"]),
        responsible: z.string().min(2).max(160),
        reviewer: z.string().max(160).nullable().optional(),
        reviewAt: z.number().int().positive(),
        notes: z.string().max(4000).nullable().optional(),
        milestones: z.array(approvalMilestoneSchema).max(12).optional(),
        lang: langSchema,
      }))
      .mutation(({ ctx, input }) => {
        const reviewAt = new Date(input.reviewAt);
        if (!Number.isFinite(reviewAt.getTime())) throw localizedError("Fecha de revisión inválida.", "Invalid review date.");
        return db.createApprovalWorkflow({
          ...input,
          userId: ctx.user.id,
          reviewAt,
          milestones: (input.milestones?.length ? input.milestones : defaultApprovalMilestones(input.recommendation, input.responsible, reviewAt, input.lang ?? DEFAULT_LANG)).map((milestone) => ({ ...milestone, dueAt: milestone.dueAt === null || milestone.dueAt === undefined ? null : new Date(milestone.dueAt) })),
        });
      }),

    updateApproval: protectedProcedure
      .input(z.object({
        approvalId: z.number().int().positive(),
        status: approvalStatusSchema.optional(),
        responsible: z.string().min(2).max(160).optional(),
        reviewer: z.string().max(160).nullable().optional(),
        reviewAt: z.number().int().positive().optional(),
        notes: z.string().max(4000).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { approvalId, reviewAt, ...changes } = input;
        return db.updateApprovalWorkflow(ctx.user.id, approvalId, { ...changes, reviewAt: reviewAt === undefined ? undefined : new Date(reviewAt) });
      }),

    updateApprovalMilestone: protectedProcedure
      .input(z.object({
        milestoneId: z.number().int().positive(),
        status: milestoneStatusSchema.optional(),
        responsible: z.string().max(160).nullable().optional(),
        dueAt: z.number().int().positive().nullable().optional(),
        evidence: z.string().max(4000).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { milestoneId, dueAt, ...changes } = input;
        return db.updateApprovalMilestone(ctx.user.id, milestoneId, { ...changes, dueAt: dueAt === undefined ? undefined : dueAt === null ? null : new Date(dueAt) });
      }),
  }),

  /** Casos de estudio: documentos y libro de evidencias. */
  case: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(200),
        decisionQuestion: z.string().max(2000).nullable().optional(),
        companyName: z.string().max(180).nullable().optional(),
        homeCountry: z.string().max(120).nullable().optional(),
        industry: z.string().max(180).nullable().optional(),
        subIndustry: z.string().max(180).nullable().optional(),
        caseYear: z.number().int().min(1900).max(2100).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => ({ id: await db.createCase({ userId: ctx.user.id, ...input }) })),

    update: protectedProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        title: z.string().min(2).max(200).optional(),
        decisionQuestion: z.string().max(2000).nullable().optional(),
        companyName: z.string().max(180).nullable().optional(),
        homeCountry: z.string().max(120).nullable().optional(),
        industry: z.string().max(180).nullable().optional(),
        subIndustry: z.string().max(180).nullable().optional(),
        caseYear: z.number().int().min(1900).max(2100).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { caseId, ...values } = input;
        await db.updateCase(ctx.user.id, caseId, values);
        return db.getCase(ctx.user.id, caseId);
      }),

    list: protectedProcedure.query(({ ctx }) => db.listCases(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(({ ctx, input }) => db.getCase(ctx.user.id, input.caseId)),

    /** Texto pegado. Es la vía preferente: permite verificar las citas contra el original. */
    addTextDocument: protectedProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        filename: z.string().min(1).max(260),
        text: z.string().min(50).max(400_000),
      }))
      .mutation(async ({ ctx, input }) => ({
        id: await db.addCaseDocument({
          userId: ctx.user.id,
          caseId: input.caseId,
          filename: input.filename,
          mimeType: "text/plain",
          textContent: input.text,
          bytes: Buffer.byteLength(input.text, "utf8"),
        }),
      })),

    /** PDF u otro binario. Sin texto no se pueden verificar las citas contra el original. */
    uploadDocument: protectedProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        filename: z.string().min(1).max(260),
        mimeType: z.string().min(3).max(120),
        contentBase64: z.string().min(16).max(28_000_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.contentBase64, "base64");
        if (!buffer.length) throw localizedError("El contenido del fichero está vacío o mal codificado.", "The file content is empty or badly encoded.");
        const safeName = input.filename.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
        const stored = await storagePut(`cases/${ctx.user.id}/${input.caseId}/${safeName}`, buffer, input.mimeType);
        /**
         * Se extrae el texto en el momento de subir. Con texto se puede comprobar que las
         * citas del copiloto están de verdad en el documento; sin él, solo se puede exigir
         * que existan.
         */
        const extraction = input.mimeType.includes("pdf") ? await extractPdfText(buffer) : { text: null, pages: null, note: loc("Formato sin extracción de texto.", "This format has no text extraction.") };
        return {
          id: await db.addCaseDocument({
            userId: ctx.user.id,
            caseId: input.caseId,
            filename: input.filename,
            mimeType: input.mimeType,
            storageKey: stored.key,
            textContent: extraction.text,
            bytes: buffer.length,
          }),
          textExtracted: Boolean(extraction.text),
          pages: extraction.pages,
          note: extraction.note,
        };
      }),

    listEvidence: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(({ ctx, input }) => db.listEvidence(ctx.user.id, input.caseId)),

    addEvidence: protectedProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        entries: z.array(z.object({
          kind: z.enum(["document", "public_data", "interview", "assumption", "ai_extraction"]),
          claim: z.string().min(3).max(2000),
          sourceLabel: z.string().min(1).max(300),
          documentId: z.number().int().positive().nullable().optional(),
          locator: z.string().max(160).nullable().optional(),
          quote: z.string().max(4000).nullable().optional(),
          url: z.string().max(1000).nullable().optional(),
          retrievedAt: z.string().max(80).nullable().optional(),
          reliability: z.number().int().min(1).max(5).optional(),
          targetPath: z.string().max(160).nullable().optional(),
          countryCode: z.string().max(3).nullable().optional(),
          status: z.enum(["accepted", "suggested", "rejected"]).optional(),
        })).min(1).max(200),
      }))
      .mutation(({ ctx, input }) => db.addEvidence(ctx.user.id, input.caseId, input.entries)),

    setEvidenceStatus: protectedProcedure
      .input(z.object({ evidenceId: z.number().int().positive(), status: z.enum(["accepted", "suggested", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.setEvidenceStatus(ctx.user.id, input.evidenceId, input.status);
        return { ok: true };
      }),

    updateEvidence: protectedProcedure
      .input(z.object({
        evidenceId: z.number().int().positive(),
        claim: z.string().min(3).max(2000).optional(),
        sourceLabel: z.string().min(1).max(300).optional(),
        locator: z.string().max(160).nullable().optional(),
        targetPath: z.string().max(160).nullable().optional(),
        reliability: z.number().int().min(1).max(5).optional(),
        countryCode: z.string().max(3).nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { evidenceId, ...values } = input;
        await db.updateEvidence(ctx.user.id, evidenceId, values);
        return { ok: true };
      }),

    deleteEvidence: protectedProcedure
      .input(z.object({ evidenceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEvidence(ctx.user.id, input.evidenceId);
        return { ok: true };
      }),
  }),

  /**
   * Copiloto de caso. Todo lo que devuelve es una propuesta: entra en el libro de
   * evidencias con estado `suggested` y no alimenta ningún cálculo hasta que se acepta.
   *
   * Es el único sitio donde el idioma viaja en la petición. En el resto de la API el
   * servidor devuelve los dos idiomas y el cliente elige, pero una frase que escribe el
   * modelo existe en un solo idioma: hay que decirle en cuál antes de que la escriba.
   */
  ai: router({
    extractEvidence: protectedProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        documentId: z.number().int().positive(),
        context: z.string().max(2000).optional(),
        lang: langSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const source = await loadCaseSource(ctx.user.id, input.documentId);
        const extraction = await extractCaseEvidence(source, { context: input.context, lang: input.lang });
        const stored = await db.addEvidence(ctx.user.id, input.caseId, extraction.evidence.map((entry) => ({
          kind: "ai_extraction" as const,
          claim: entry.claim,
          sourceLabel: source.label,
          documentId: input.documentId,
          locator: entry.locator,
          quote: entry.quote,
          reliability: entry.reliability,
          targetPath: entry.targetPath,
          countryCode: entry.countryCode,
          createdBy: "ai" as const,
          status: "suggested" as const,
          quoteVerified: entry.quoteVerified,
        })));
        return { evidence: stored, discarded: extraction.discarded, model: extraction.model };
      }),

    proposeBlock: protectedProcedure
      .input(z.object({
        documentId: z.number().int().positive(),
        blockKey: z.enum(["market", "resources", "industry", "cage", "risk"]),
        countryName: z.string().min(1).max(120),
        context: z.string().max(2000).optional(),
        lang: langSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const source = await loadCaseSource(ctx.user.id, input.documentId);
        return proposeAssessmentBlock(input.blockKey, source, { countryName: input.countryName, context: input.context, lang: input.lang });
      }),

    critique: protectedProcedure
      .input(z.object({
        documentId: z.number().int().positive(),
        blockKey: z.enum(["market", "resources", "industry", "cage", "risk"]),
        countryName: z.string().max(120).optional(),
        ratings: z.array(z.object({
          itemPath: z.string().min(3).max(160),
          value: z.number().min(0).max(4),
          rationale: z.string().max(1200).nullable().optional(),
        })).max(80),
        lang: langSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const source = await loadCaseSource(ctx.user.id, input.documentId);
        return critiqueAssessment(input.blockKey, input.ratings, source, { countryName: input.countryName, lang: input.lang });
      }),
  }),

  globalStrategy: router({
    /** Tablas del libro que el cliente necesita para pintar los formularios. */
    reference: publicProcedure.query(() => ({
      regionSets: ambitionDomain.REGION_SETS,
      industryDemand: ambitionDomain.INDUSTRY_DEMAND_TABLE,
      industryDemandProvenance: ambitionDomain.INDUSTRY_DEMAND_PROVENANCE,
      motives: ambitionDomain.GLOBALIZATION_MOTIVES,
      globalRoles: ambitionDomain.GLOBAL_ROLES,
      countryRoles: ambitionDomain.COUNTRY_ROLES,
      stages: ambitionDomain.GLOBALIZATION_STAGES,
      organizationalDesigns: ambitionDomain.ORGANIZATIONAL_DESIGNS,
      // Modo trabajo: la tesis, los sectores y la cadena de aprobación.
      industries: INDUSTRIES,
      authorities: AUTHORITIES,
      consequences: assumptionDomain.CONSEQUENCES,
      beliefs: assumptionDomain.BELIEFS,
      countryPresence: thesisDomain.COUNTRY_PRESENCE,
      thesisStances: thesisDomain.THESIS_STANCES,
      entryKinds: thesisDomain.ENTRY_KINDS,
      provenanceOrigins: thesisDomain.PROVENANCE_ORIGINS,
      valuePropositionDimensions: positioningDomain.VALUE_PROPOSITION_DIMENSIONS,
      positionings: positioningDomain.POSITIONINGS,
      positioningsProvenance: positioningDomain.POSITIONINGS_PROVENANCE,
      capabilityTypes: positioningDomain.CAPABILITY_TYPES,
      capabilityTypesProvenance: positioningDomain.CAPABILITY_TYPES_PROVENANCE,
      sustainabilityTypes: positioningDomain.SUSTAINABILITY_TYPES,
      buildingModes: positioningDomain.BUILDING_MODES,
      sustainabilityMatrix: positioningDomain.SUSTAINABILITY_MATRIX,
      valueChainFunctions: positioningDomain.VALUE_CHAIN_FUNCTIONS,
      valueChainLevels: positioningDomain.VALUE_CHAIN_LEVELS,
      configurations: positioningDomain.CONFIGURATIONS,
      tacTags: positioningDomain.TAC_TAGS,
      capabilityKinds: positioningDomain.CAPABILITY_KINDS,
      errcActions: positioningDomain.ERRC_ACTIONS,
      buyerExperienceStages: positioningDomain.BUYER_EXPERIENCE_STAGES,
      buyerUtilityLevers: positioningDomain.BUYER_UTILITY_LEVERS,
      buyerUtilityProvenance: positioningDomain.BUYER_UTILITY_PROVENANCE,
      indicesConventions: CONVENTIONS,
      entryObjectives: entryDomain.ENTRY_OBJECTIVES,
      entryObjectivesProvenance: entryDomain.ENTRY_OBJECTIVES_PROVENANCE,
      windowPhases: entryDomain.WINDOW_PHASES,
      windowPhasesProvenance: entryDomain.WINDOW_PHASES_PROVENANCE,
      firstMover: entryDomain.FIRST_MOVER,
      timingStances: entryDomain.TIMING_STANCES,
      paceFactors: entryDomain.PACE_FACTORS,
      paceProvenance: entryDomain.PACE_PROVENANCE,
      modeGrid: entryDomain.MODE_GRID,
      modeGridProvenance: entryDomain.MODE_GRID_PROVENANCE,
      modeMappingProvenance: entryDomain.MODE_MAPPING_PROVENANCE,
      modeFactors: entryDomain.MODE_FACTORS,
      digitalEntryModels: entryDomain.DIGITAL_ENTRY_MODELS,
      digitalEntryProvenance: entryDomain.DIGITAL_ENTRY_PROVENANCE,
      entryModes: entryModes.map((mode) => ({ key: mode.key, label: mode.label })),
      bbbAxes: partneringDomain.BBB_AXES,
      bbbRoutes: partneringDomain.BBB_ROUTES,
      bbbProvenance: partneringDomain.BBB_PROVENANCE,
      partnerFits: partneringDomain.PARTNER_FITS,
      partnerFitsProvenance: partneringDomain.PARTNER_FITS_PROVENANCE,
      partnerTypes: partneringDomain.PARTNER_TYPES,
      partnerTypesProvenance: partneringDomain.PARTNER_TYPES_PROVENANCE,
      partnerCategories: partneringDomain.PARTNER_CATEGORIES,
      optionExpansionPaths: partneringDomain.OPTION_EXPANSION_PATHS,
      optionRetreatPaths: partneringDomain.OPTION_RETREAT_PATHS,
      realOptionProvenance: partneringDomain.REAL_OPTION_PROVENANCE,
    })),

    getAmbition: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "ambition");
        return analyseAmbition(parseAmbition(stored?.payload));
      }),

    saveAmbition: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: ambitionInputSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "ambition", input.payload);
        return analyseAmbition(input.payload as ambitionDomain.AmbitionInput);
      }),

    /**
     * Coherencia entre módulos e índice de exhaustividad.
     *
     * Lee los cuatro bloques del caso y los cruza. No se guarda nada: el resultado se
     * recalcula siempre, de modo que corregir una regla alcanza también a los casos viejos.
     */
    coherence: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const [ambition, positioning, entry, partnering] = await Promise.all([
          db.getCaseModule(ctx.user.id, input.caseId, "ambition"),
          db.getCaseModule(ctx.user.id, input.caseId, "positioning"),
          db.getCaseModule(ctx.user.id, input.caseId, "entry"),
          db.getCaseModule(ctx.user.id, input.caseId, "partnering"),
        ]);
        const dossier = {
          ambition: ambition ? parseAmbition(ambition.payload) : null,
          positioning: positioning ? parsePositioning(positioning.payload) : null,
          entry: entry ? parseEntryStrategy(entry.payload) : null,
          partnering: partnering ? parsePartnering(partnering.payload) : null,
        };
        const findings = evaluateCoherence(dossier);
        return { findings, index: completenessIndex(dossier, findings) };
      }),

    /** Progreso de la ruta guiada: qué pasos ha confirmado el analista y cuáles se saltó. */
    getThesis: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "thesis");
        const { thesis, answers } = parseThesisPayload(stored?.payload);
        return analyseThesis(ctx.user.id, input.caseId, thesis, answers);
      }),

    saveThesis: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: thesisPayloadSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "thesis", input.payload);
        const { thesis, answers } = input.payload;
        return analyseThesis(ctx.user.id, input.caseId, thesis as never, answers as never);
      }),

    getRouteProgress: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "route");
        return parseRouteProgress(stored?.payload);
      }),

    saveRouteProgress: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: routeProgressSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "route", input.payload);
        return input.payload;
      }),

    getPartnering: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "partnering");
        return analysePartnering(parsePartnering(stored?.payload));
      }),

    savePartnering: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: partneringInputSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "partnering", input.payload);
        return analysePartnering(input.payload as partneringDomain.PartneringInput);
      }),

    getEntryStrategy: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "entry");
        return analyseEntryStrategy(parseEntryStrategy(stored?.payload));
      }),

    saveEntryStrategy: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: entryStrategyInputSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "entry", input.payload);
        return analyseEntryStrategy(input.payload as entryDomain.EntryStrategyInput);
      }),

    getPositioning: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const stored = await db.getCaseModule(ctx.user.id, input.caseId, "positioning");
        return analysePositioning(parsePositioning(stored?.payload));
      }),

    savePositioning: protectedProcedure
      .input(z.object({ caseId: z.number().int().positive(), payload: positioningInputSchema }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCaseModule(ctx.user.id, input.caseId, "positioning", input.payload);
        return analysePositioning(input.payload as positioningDomain.PositioningInput);
      }),
  }),
});

export type AppRouter = typeof appRouter;
