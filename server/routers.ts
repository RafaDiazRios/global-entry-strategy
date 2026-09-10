import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { evaluateStrategy, type EntryObjective, type EvaluationInput, type MarketData } from "./strategy/engine";
import { getIndicatorPoints, getWorldBankMarketData, publicSources } from "./strategy/worldBank";
import { fitPenetrationCurve, middleClassEffect } from "./strategy/marketCurves";
import { getWgiGovernanceData } from "./strategy/wgi";
import { financialPublicSources, getCountryFinancialReference } from "./strategy/countryFinancialData";

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

const countrySchema = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(2).max(100).optional(),
  calibration: calibrationSchema.optional(),
  calibrationNotes: calibrationNotesSchema.optional(),
  assessment: countryAssessmentSchema.optional(),
  knockOuts: knockOutPolicySchema.optional(),
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

const financialDataProvenanceSchema = z.object({
  sourceStatus: z.enum(["live", "partial", "unavailable"]),
  sourceName: z.string().min(1).max(200),
  sourceUrl: z.string().url(),
  sourceYear: z.number().int().nullable().optional(),
  observedAt: z.string().nullable().optional(),
  retrievedAt: z.string().min(1).max(80),
  note: z.string().min(1).max(1500),
});

const sensitivityScenarioSchema = z.object({
  priceRevenuePct: z.number().min(-100).max(500).nullable().optional(),
  operatingMarginPctPoints: z.number().min(-100).max(100).nullable().optional(),
  fxRatePct: z.number().min(-100).max(500).nullable().optional(),
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

function defaultApprovalMilestones(recommendation: "advance" | "test", responsible: string, reviewAt: Date) {
  const first = recommendation === "advance"
    ? "Confirmar tesis, regulación y estructura fiscal local"
    : "Aprobar carta de prueba, hipótesis y límites de inversión";
  const second = recommendation === "advance"
    ? "Validar demanda, precio y economía unitaria con evidencia local"
    : "Ejecutar prueba comercial y recoger evidencia de demanda y precio";
  const third = recommendation === "advance"
    ? "Cerrar plan operativo, socios críticos y riesgos de implementación"
    : "Revisar resultados, aprendizaje y condiciones para escalar o abandonar";
  return [
    { title: first, responsible, dueAt: futureDate(reviewAt, -21), status: "pending" as const },
    { title: second, responsible, dueAt: futureDate(reviewAt, -14), status: "pending" as const },
    { title: third, responsible, dueAt: futureDate(reviewAt, -7), status: "pending" as const },
    { title: "Revisión de gate y decisión documentada", responsible, dueAt: reviewAt, status: "pending" as const },
  ];
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
          throw new Error("Indique puntos explícitos o un indicador con su lista de países.");
        }
        const points = await getIndicatorPoints(input.indicator, input.countryCodes);
        if (points.length < 3) throw new Error("La fuente pública no devolvió suficientes observaciones para ajustar una curva.");
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
        if (!result) throw new Error("Los parámetros no permiten calcular la distribución de renta.");
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
      }))
      .mutation(({ ctx, input }) => {
        const reviewAt = new Date(input.reviewAt);
        if (!Number.isFinite(reviewAt.getTime())) throw new Error("Fecha de revisión inválida.");
        return db.createApprovalWorkflow({
          ...input,
          userId: ctx.user.id,
          reviewAt,
          milestones: (input.milestones?.length ? input.milestones : defaultApprovalMilestones(input.recommendation, input.responsible, reviewAt)).map((milestone) => ({ ...milestone, dueAt: milestone.dueAt === null || milestone.dueAt === undefined ? null : new Date(milestone.dueAt) })),
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
});

export type AppRouter = typeof appRouter;
