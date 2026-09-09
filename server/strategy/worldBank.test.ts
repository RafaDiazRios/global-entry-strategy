import { afterEach, describe, expect, it, vi } from "vitest";

const { governanceSpy } = vi.hoisted(() => ({ governanceSpy: vi.fn() }));
vi.mock("./wgi", () => ({ getWgiGovernanceData: governanceSpy }));

import { getWorldBankMarketData } from "./worldBank";

afterEach(() => {
  vi.unstubAllGlobals();
  governanceSpy.mockReset();
});

describe("getWorldBankMarketData", () => {
  it("returns macroeconomic indicators without waiting for WGI when progressive loading is selected", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{}, [{ date: "2025", value: 123 }]]), { status: 200, headers: { "content-type": "application/json" } })));

    const data = await getWorldBankMarketData("DE", false);

    expect(governanceSpy).not.toHaveBeenCalled();
    expect(data).toMatchObject({ gdpUsd: 123, gdpPerCapita: 123, fdiInflowUsd: 123, sourceYear: 2025, sourceStatus: "live", manualFields: [] });
    expect(data.governance.sourceStatus).toBe("unavailable");
    expect(data.lastUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
