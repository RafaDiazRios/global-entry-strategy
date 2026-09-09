import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { evaluateStrategy, type EntryObjective, type EvaluationInput, type MarketData } from "./strategy/engine";
import { getWorldBankMarketData, publicSources } from "./strategy/worldBank";

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

const countrySchema = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(2).max(100).optional(),
  calibration: calibrationSchema.optional(),
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
  sourceYear: z.number().nullable().optional(),
  sourceStatus: z.enum(["live", "partial", "unavailable"]),
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
  weights: z.object({
    market: z.number().min(0).max(100).optional(),
    resources: z.number().min(0).max(100).optional(),
    competition: z.number().min(0).max(100).optional(),
    government: z.number().min(0).max(100).optional(),
    distance: z.number().min(0).max(100).optional(),
    risk: z.number().min(0).max(100).optional(),
  }).optional(),
});

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

    fetchMarketData: protectedProcedure
      .input(z.object({ countryCodes: z.array(z.string().min(2).max(3)).min(1).max(12) }))
      .mutation(async ({ input }) => {
        const normalizedCodes = Array.from(new Set(input.countryCodes.map((code) => code.toUpperCase())));
        const results = await Promise.all(
          normalizedCodes.map(async (code) => [code, await getWorldBankMarketData(code)] as const),
        );
        return Object.fromEntries(results) as Record<string, MarketData>;
      }),

    evaluate: protectedProcedure.input(evaluationSchema).mutation(({ input }) => {
      return evaluateStrategy(input as EvaluationInput);
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
  }),
});

export type AppRouter = typeof appRouter;
