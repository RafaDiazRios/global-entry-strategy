import { describe, expect, it } from "vitest";
import { fitPenetrationCurve, middleClassEffect, predictFromCurve } from "./marketCurves";

describe("curvas de penetración", () => {
  it("reconoce una curva saturante como la de suscripciones móviles", () => {
    // y = 20 + 25·ln(x/1000): crece con la renta y se aplana, la forma de la Figura 6.4 (p. 230).
    const points = [500, 1_200, 3_000, 8_000, 20_000, 45_000, 70_000].map((gdpPerCapita) => ({
      label: `C${gdpPerCapita}`,
      gdpPerCapita,
      value: 20 + 25 * Math.log(gdpPerCapita / 1000),
    }));
    const result = fitPenetrationCurve(points);
    expect(result.best?.model).toBe("logarithmic");
    expect(result.best?.rSquared).toBeGreaterThan(0.99);
    expect(result.best?.r).toBeGreaterThan(0);
    expect(predictFromCurve(result.best!, 10_000)).toBeCloseTo(20 + 25 * Math.log(10), 1);
  });

  it("reconoce una relación en campana como la del cemento", () => {
    // Pico intermedio: los emergentes construyen infraestructura y los maduros ya no (Figura 6.5, p. 230).
    const points = [800, 2_000, 5_000, 12_000, 25_000, 45_000, 70_000].map((gdpPerCapita) => {
      const u = Math.log(gdpPerCapita);
      return { label: `C${gdpPerCapita}`, gdpPerCapita, value: -40 * (u - 9) ** 2 + 300 };
    });
    const result = fitPenetrationCurve(points);
    expect(result.best?.model).toBe("invertedU");
    expect(result.best?.rSquared).toBeGreaterThan(0.99);
  });

  it("devuelve residuos por país para localizar desviaciones", () => {
    const points = [
      { label: "AA", gdpPerCapita: 1_000, value: 10 },
      { label: "BB", gdpPerCapita: 10_000, value: 60 },
      { label: "CC", gdpPerCapita: 30_000, value: 85 },
      { label: "DD", gdpPerCapita: 50_000, value: 40 },
    ];
    const result = fitPenetrationCurve(points, "logarithmic");
    const outlier = result.best?.residuals.find((residual) => residual.label === "DD");
    expect(outlier?.residual).toBeLessThan(0);
  });

  it("no ajusta con menos observaciones de las necesarias", () => {
    const result = fitPenetrationCurve([{ label: "AA", gdpPerCapita: 1_000, value: 10 }]);
    expect(result.best).toBeNull();
    expect(result.candidates).toHaveLength(0);
  });
});

describe("efecto clase media", () => {
  const base = { gdpPerCapita: 4_000, gini: 40, threshold: 6_000, incomeGrowthPct: 20 };

  it("amplifica el segmento muy por encima del crecimiento de la renta", () => {
    const result = middleClassEffect(base)!;
    expect(result.projectedShare).toBeGreaterThan(result.baseShare);
    // Es el punto de la Figura 6.6 (p. 232): +20% de renta no da +20% de segmento.
    expect(result.relativeChangePct).toBeGreaterThan(20);
  });

  it("amplifica más cuanto más masa de población hay justo bajo el umbral", () => {
    const nearThreshold = middleClassEffect({ ...base, threshold: 5_000 })!;
    const farAboveThreshold = middleClassEffect({ ...base, threshold: 30_000 })!;
    expect(nearThreshold.baseShare).toBeGreaterThan(farAboveThreshold.baseShare);
  });

  it("acota el segmento por arriba cuando se define un umbral superior", () => {
    const openEnded = middleClassEffect(base)!;
    const bounded = middleClassEffect({ ...base, upperThreshold: 12_000 })!;
    expect(bounded.baseShare).toBeLessThan(openEnded.baseShare);
  });

  it("una desigualdad mayor ensancha la distribución", () => {
    const equal = middleClassEffect({ ...base, gini: 25 })!;
    const unequal = middleClassEffect({ ...base, gini: 60 })!;
    expect(unequal.sigma).toBeGreaterThan(equal.sigma);
  });

  it("rechaza parámetros imposibles en lugar de inventar un resultado", () => {
    expect(middleClassEffect({ ...base, gini: 0 })).toBeNull();
    expect(middleClassEffect({ ...base, gdpPerCapita: 0 })).toBeNull();
    expect(middleClassEffect({ ...base, threshold: -1 })).toBeNull();
  });
});
