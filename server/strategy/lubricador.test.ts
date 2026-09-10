import { describe, expect, it } from "vitest";
import { evaluateFinancials, type FinancialAssumptions, type ModeForFinance } from "./financialEngine";

/**
 * Test de aceptación de la Fase 4: el mini-caso 7.3, Lubricador SA, pp. 275-276.
 *
 * La empresa italiana estudia entrar en China con cuatro alternativas —greenfield al 100%,
 * comprar al competidor japonés, empresa conjunta al 50% y licencia— con WACC del 15% y
 * tipo de cambio de 6,58 yuanes por dólar. El criterio del blueprint es que las cuatro se
 * resuelvan dentro de la herramienta y den cifras distintas y defendibles.
 *
 * Dos advertencias sobre el enunciado, que se dejan escritas porque cualquiera que repita
 * el ejercicio se va a tropezar con ellas:
 *
 * 1. El caso da los costes administrativos y de marketing en «1.200 millones de yuanes»,
 *    creciendo a 1.600, contra un mercado doméstico de 50 millones de litros a 3,5 yuanes,
 *    es decir 175 millones de yuanes. La cifra impresa no puede ser la buena: el gasto
 *    administrativo sería siete veces el mercado entero. Este fixture fija en su lugar un
 *    margen operativo y un coste anual explícitos, declarados aquí como supuesto propio, en
 *    vez de reconstruir una función de costes que el enunciado no determina.
 * 2. El precio va en yuanes por kilo y el mercado en litros. Se toma un litro por kilo.
 *
 * Por eso lo que se comprueba no es un número exacto —el caso no lo fija— sino el patrón
 * que el propio libro describe al comparar modos en la p. 270: las vías con inversión
 * propia y la adquisición mueven el mayor valor absoluto; la licencia rinde mucho en
 * porcentaje sobre una base pequeña; la empresa conjunta queda en medio.
 */

const YUAN_PER_USD = 6.58;
const MILLION = 1_000_000;
const usd = (millions: number) => millions * MILLION * YUAN_PER_USD;

/** Mercado doméstico del aditivo: 50 millones de litros a 3,5 yuanes, creciendo al 8%. */
function market(): Pick<FinancialAssumptions, "currency" | "tamYearOne" | "annualMarketGrowthPct" | "samPct"> {
  return { currency: "CNY", tamYearOne: 50 * MILLION * 3.5, annualMarketGrowthPct: 8, samPct: 100 };
}

const COMMON: Partial<FinancialAssumptions> = {
  taxRatePct: 30,
  workingCapitalPctRevenue: 33,
  discountRatePct: 15,
  terminalGrowthPct: 2,
  operatingMarginPct: 18,
};

/**
 * Coste anual de administración y marketing. Supuesto de este fixture, no del enunciado,
 * por la incoherencia explicada arriba: se toma en torno al 7% del mercado del primer año
 * para los modos que operan, la mitad para la empresa conjunta —que lo comparte con el
 * socio— y una cifra simbólica para la licencia, que no opera nada.
 */
const ADMIN_COST = { operator: 12 * MILLION, jv: 6 * MILLION, licence: 0.5 * MILLION };

const HORIZON = 10;

function run(assumptions: FinancialAssumptions, mode: ModeForFinance) {
  const result = evaluateFinancials(assumptions, [mode], HORIZON);
  const alternative = result.alternatives[0];
  expect(alternative.status).toBe("ok");
  return alternative;
}

/** Greenfield: 10% de cuota el primer año, +5 puntos al año, estable en 20%. */
function greenfield() {
  return run(
    {
      ...market(),
      ...COMMON,
      somPctYearOne: 10,
      somPctHorizon: 20,
      somRampShape: "linear",
      modeProfiles: { greenfield: { initialInvestment: usd(20), annualOperatingCost: ADMIN_COST.operator, revenueCapturePct: 100 } },
    },
    { key: "greenfield", mode: "Filial propia / greenfield" }
  );
}

/** Adquisición del competidor japonés: 30% de cuota desde el primer día por 70 M$. */
function acquisition() {
  return run(
    {
      ...market(),
      ...COMMON,
      somPctYearOne: 30,
      somPctHorizon: 30,
      somRampShape: "linear",
      modeProfiles: { acquisition: { initialInvestment: usd(70), annualOperatingCost: ADMIN_COST.operator, revenueCapturePct: 100 } },
    },
    { key: "acquisition", mode: "Adquisición" }
  );
}

/**
 * Empresa conjunta: 30% de cuota que sube al 50% en el tercer año. La inversión total es de
 * 30 M$, financiada un tercio con fondos propios repartidos al 50% con el socio local, de
 * modo que la aportación del italiano es un sexto del total; y le corresponde la mitad del
 * resultado.
 */
function jointVenture() {
  return run(
    {
      ...market(),
      ...COMMON,
      somPctYearOne: 30,
      somPctHorizon: 50,
      somRampShape: "linear",
      modeProfiles: { alliance: { initialInvestment: usd(30) / 6, annualOperatingCost: ADMIN_COST.jv, revenueCapturePct: 50 } },
    },
    { key: "alliance", mode: "Joint venture o alianza" }
  );
}

/** Licencia: 600.000 $ de transferencia tecnológica y 3 yuanes por litro sobre el 20% del mercado. */
function licensing() {
  const royaltyPerLitre = 3;
  const pricePerLitre = 3.5;
  return run(
    {
      ...market(),
      ...COMMON,
      somPctYearOne: 20,
      somPctHorizon: 20,
      somRampShape: "linear",
      modeProfiles: {
        licensing: {
          initialInvestment: usd(0.6),
          annualOperatingCost: ADMIN_COST.licence,
          // El canon se aplica sobre todas las ventas del licenciatario, que son las modeladas.
          revenueCapturePct: 100,
          // El canon es por litro; sobre el precio de venta equivale a 3 / 3,5 de las ventas.
          royaltyRatePct: (royaltyPerLitre / pricePerLitre) * 100,
        },
      },
    },
    { key: "licensing", mode: "Licencia o franquicia" }
  );
}

describe("mini-caso 7.3 — Lubricador SA", () => {
  it("resuelve las cuatro alternativas sin datos que falten", () => {
    for (const alternative of [greenfield(), acquisition(), jointVenture(), licensing()]) {
      expect(alternative.missingInputs).toEqual([]);
      expect(alternative.npv).not.toBeNull();
      expect(alternative.roiPct).not.toBeNull();
    }
  });

  it("da cuatro cifras distintas, que es lo que el caso pide comparar", () => {
    const npvs = [greenfield(), acquisition(), jointVenture(), licensing()].map((alternative) => Math.round(alternative.npv as number));
    expect(new Set(npvs).size).toBe(4);
  });

  it("la licencia rinde mucho en porcentaje sobre una base pequeña", () => {
    const licence = licensing();
    const green = greenfield();
    expect(licence.roiPct as number).toBeGreaterThan(green.roiPct as number);
    expect(licence.initialInvestment as number).toBeLessThan((green.initialInvestment as number) / 10);
  });

  it("la adquisición exige la mayor inversión inicial de las cuatro", () => {
    const investments = {
      greenfield: greenfield().initialInvestment as number,
      acquisition: acquisition().initialInvestment as number,
      jv: jointVenture().initialInvestment as number,
      licence: licensing().initialInvestment as number,
    };
    expect(investments.acquisition).toBeGreaterThan(investments.greenfield);
    expect(investments.acquisition).toBeGreaterThan(investments.jv);
    expect(investments.acquisition).toBeGreaterThan(investments.licence);
  });

  it("la adquisición captura cuota desde el primer año y el greenfield no", () => {
    const first = (alternative: ReturnType<typeof greenfield>) => alternative.annualProjection[0].revenue;
    expect(first(acquisition())).toBeGreaterThan(first(greenfield()));
  });

  it("la empresa conjunta queda en medio en inversión comprometida", () => {
    const jv = jointVenture().initialInvestment as number;
    expect(jv).toBeGreaterThan(licensing().initialInvestment as number);
    expect(jv).toBeLessThan(greenfield().initialInvestment as number);
  });

  it("aplica el WACC del 15% del enunciado al descontar", () => {
    const projection = greenfield().annualProjection;
    const firstYear = projection[0];
    expect(firstYear.presentValue).toBeCloseTo(firstYear.freeCashFlow / 1.15, 2);
  });
});
