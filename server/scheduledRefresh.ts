import type { Request, Response } from "express";
import * as db from "./db";
import { ENV } from "./_core/env";
import { evaluateStrategy, type EvaluationInput, type MarketData } from "./strategy/engine";
import { getWorldBankMarketData } from "./strategy/worldBank";
import { getCountryFinancialReference } from "./strategy/countryFinancialData";

/** Refreshes the public macro data in all saved scenarios. It is deliberately idempotent. */
export async function refreshScenarioDataHandler(req: Request, res: Response) {
  try {
    /**
     * El refresco programado no lo dispara una persona, así que no usa sesión: se protege
     * con un secreto compartido que el programador de tareas envía en la cabecera.
     * Sin CRON_SECRET configurado el endpoint queda cerrado.
     */
    const provided = req.headers["x-cron-secret"];
    const token = Array.isArray(provided) ? provided[0] : provided;
    if (!ENV.cronSecret || token !== ENV.cronSecret) return res.status(403).json({ error: "cron-only" });

    const scenarios = await db.listStrategyScenariosForRefresh();
    let refreshed = 0;
    const failures: { id: number; message: string }[] = [];

    for (const scenario of scenarios) {
      try {
        const input = scenario.inputJson as EvaluationInput;
        if (!input?.countryInputs?.length) continue;
        const marketData: Record<string, MarketData> = {};
        const financialByCountry = { ...(input.financialByCountry ?? {}) };
        for (const country of input.countryInputs) {
          const refreshedMarket = await getWorldBankMarketData(country.code);
          const previousMarket = input.marketData?.[country.code];
          const manualFields = previousMarket?.manualFields ?? [];
          const manualValues = Object.fromEntries(manualFields.map((field) => [field, previousMarket?.[field as keyof MarketData] ?? null]));
          marketData[country.code] = { ...refreshedMarket, ...manualValues, manualFields };
          const previous = financialByCountry[country.code] ?? {};
          const reportingCurrency = previous.reportingCurrency || "USD";
          const reference = await getCountryFinancialReference(country.code, reportingCurrency);
          financialByCountry[country.code] = {
            ...previous,
            currency: previous.currency ?? reference.fx.localCurrency,
            reportingCurrency: previous.reportingCurrency ?? reference.fx.reportingCurrency,
            taxReference: reference.tax,
            fxReference: reference.fx,
            taxRatePct: previous.taxRateDataMode === "manual" ? previous.taxRatePct : reference.tax.ratePct,
            fxRateToReportingCurrency: previous.fxRateDataMode === "manual" ? previous.fxRateToReportingCurrency : reference.fx.rateToReportingCurrency,
            taxRateDataMode: previous.taxRateDataMode === "manual" ? "manual" : "public",
            fxRateDataMode: previous.fxRateDataMode === "manual" ? "manual" : "public",
          };
        }
        const refreshedInput: EvaluationInput = { ...input, marketData, financialByCountry };
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
