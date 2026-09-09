import { describe, expect, it } from "vitest";
import { parseTaxCsv } from "./countryFinancialData";

describe("parseTaxCsv", () => {
  it("maps a 2025 statutory corporate tax rate by ISO-2 code", () => {
    const rates = parseTaxCsv('"","iso_2","country","2024","2025"\n"1","MX","Mexico",30,30\n"2","AE","United Arab Emirates",9,9\n');
    expect(rates.get("MX")).toEqual({ iso2: "MX", ratePct: 30 });
    expect(rates.get("AE")).toEqual({ iso2: "AE", ratePct: 9 });
  });

  it("preserves missing public values rather than turning them into zero", () => {
    const rates = parseTaxCsv('"","iso_2","country","2025"\n"1","XX","Unknown",NA\n');
    expect(rates.get("XX")?.ratePct).toBeNull();
  });
});
