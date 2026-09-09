import type { Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { evaluateStrategy, type EvaluationInput, type MarketData } from "./strategy/engine";
import { getWorldBankMarketData } from "./strategy/worldBank";

/** Refreshes the public macro data in all saved scenarios. It is deliberately idempotent. */
export async function refreshScenarioDataHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

    const scenarios = await db.listStrategyScenariosForRefresh();
    let refreshed = 0;
    const failures: { id: number; message: string }[] = [];

    for (const scenario of scenarios) {
      try {
        const input = scenario.inputJson as EvaluationInput;
        if (!input?.countryInputs?.length) continue;
        const marketData: Record<string, MarketData> = {};
        for (const country of input.countryInputs) {
          marketData[country.code] = await getWorldBankMarketData(country.code);
        }
        const refreshedInput: EvaluationInput = { ...input, marketData };
        const result = evaluateStrategy(refreshedInput);
        await db.refreshStrategyScenario(scenario.id, refreshedInput, result);
        refreshed += 1;
      } catch (error) {
        failures.push({ id: scenario.id, message: error instanceof Error ? error.message : "Unknown refresh error" });
      }
    }

    return res.json({ ok: true, refreshed, failures, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown refresh error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
