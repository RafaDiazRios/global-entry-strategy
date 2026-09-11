/**
 * Cálculo de la pila de ingresos.
 *
 * Vive aparte del motor financiero por una razón concreta: el motor financiero compara
 * alternativas de entrada, y la pila describe el negocio. Son cosas distintas y con ritmos
 * distintos —la pila cambia cuando cambia la tesis del negocio, las alternativas cambian
 * cuando cambia el modo—, y mezclarlas haría que tocar una obligara a releer la otra.
 *
 * Lo que produce es una serie anual por línea y un total. El motor financiero la consume
 * como ingreso operativo ya neto de coste directo, en lugar de derivar el ingreso del SOM.
 */

import { loc, type Localized } from "@shared/i18n";
import {
  driverById,
  stackIsDeclared,
  type RevenueDriver,
  type RevenueStack,
  type StackItem,
  type StackLine,
} from "@shared/domain/revenueStack";

export type StackItemYear = {
  itemId: string;
  label: string;
  kind: StackItem["kind"];
  /** Importe en moneda local, positivo para ingreso y para coste. El signo lo pone el uso. */
  amount: number;
};

export type StackLineYear = {
  lineId: string;
  label: string;
  year: number;
  revenue: number;
  directCost: number;
  /** Ingreso menos coste directo, antes de repartir el coste fijo. */
  contribution: number;
  allocatedFixedCost: number;
  operatingProfit: number;
  items: StackItemYear[];
};

export type StackYear = {
  year: number;
  revenue: number;
  directCost: number;
  contribution: number;
  allocatedFixedCost: number;
  operatingProfit: number;
  lines: StackLineYear[];
};

export type StackResult = {
  status: "ok" | "insufficient_data" | "not_declared";
  /** Todo en moneda local: la conversión a moneda de reporte la hace el motor financiero. */
  years: StackYear[];
  missingInputs: Localized[];
  warnings: Localized[];
  /** Suma de los repartos de coste fijo declarados. Debería ser 100. */
  fixedCostShareTotal: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * La misma rampa que usa el SOM, para que un driver y una cuota se comporten igual. Si las
 * dos formas divergieran, dos supuestos que el analista cree paralelos dejarían de serlo sin
 * que nada lo dijera.
 */
function rampProgress(index: number, horizonYears: number, shape: RevenueDriver["ramp"]) {
  if (horizonYears <= 1) return 1;
  const t = index / (horizonYears - 1);
  if (shape !== "s_curve") return t;
  const k = 6;
  const logistic = (x: number) => 1 / (1 + Math.exp(-k * (x - 0.5)));
  const low = logistic(0);
  const high = logistic(1);
  return (logistic(t) - low) / (high - low);
}

function driverSeries(driver: RevenueDriver, horizonYears: number): number[] | null {
  if (driver.ramp === "manual") {
    const values = Array.from({ length: horizonYears }, (_, index) => driver.valuesByYear?.[index] ?? null);
    if (values.some((value) => value === null || !Number.isFinite(value))) return null;
    return values as number[];
  }
  const first = driver.valueYearOne;
  const last = driver.valueAtHorizon;
  if (first === null || last === null || !Number.isFinite(first) || !Number.isFinite(last)) return null;
  return Array.from({ length: horizonYears }, (_, index) => first + (last - first) * rampProgress(index, horizonYears, driver.ramp));
}

function amountFor(item: StackItem, driverValue: number | null): number | null {
  if (item.rate === null || !Number.isFinite(item.rate)) return null;
  if (item.rateKind === "fixed_amount") return item.rate;
  if (driverValue === null) return null;
  if (item.rateKind === "pct_of_driver") return driverValue * (item.rate / 100);
  return driverValue * item.rate;
}

/**
 * Comprueba antes de calcular. Una partida sin tarifa o con un driver que no existe no se
 * trata como cero: se nombra y el resultado queda incompleto. Un cero silencioso en una
 * partida de coste es exactamente la forma en que un caso pasa un comité sin merecerlo.
 */
function collectMissing(stack: RevenueStack, horizonYears: number): Localized[] {
  const missing: Localized[] = [];
  for (const driver of stack.drivers) {
    if (driverSeries(driver, horizonYears) === null) {
      missing.push(loc(`driver «${driver.label}»`, `driver “${driver.label}”`));
    }
  }
  for (const line of stack.lines) {
    for (const item of line.items) {
      if (item.rateKind !== "fixed_amount" && driverById(stack, item.driverId) === null) {
        missing.push(loc(
          `driver de la partida «${item.label}»`,
          `driver for the item “${item.label}”`
        ));
        continue;
      }
      if (item.rate === null || !Number.isFinite(item.rate)) {
        missing.push(loc(`tarifa de «${item.label}»`, `rate for “${item.label}”`));
      }
    }
  }
  return missing;
}

function collectWarnings(stack: RevenueStack, shareTotal: number): Localized[] {
  const warnings: Localized[] = [];

  if (stack.lines.length && Math.abs(shareTotal - 100) > 0.5) {
    warnings.push(loc(
      `El reparto del coste fijo suma ${round(shareTotal)}% en lugar de 100%. Falta una línea o sobra reparto en alguna.`,
      `The fixed-cost allocation adds up to ${round(shareTotal)}% instead of 100%. A line is missing, or one of them is over-allocated.`
    ));
  }

  const unused = stack.drivers.filter((driver) =>
    !stack.lines.some((line) => line.items.some((item) => item.driverId === driver.id))
  );
  for (const driver of unused) {
    warnings.push(loc(
      `El driver «${driver.label}» no lo usa ninguna partida.`,
      `The driver “${driver.label}” is used by no item.`
    ));
  }

  const withoutCost = stack.lines.filter((line) =>
    line.items.some((item) => item.kind === "revenue") && !line.items.some((item) => item.kind === "direct_cost")
  );
  for (const line of withoutCost) {
    warnings.push(loc(
      `La línea «${line.label}» tiene ingreso y ningún coste directo. Puede ser cierto; conviene que sea deliberado.`,
      `The line “${line.label}” has revenue and no direct cost. It may be true; it should be deliberate.`
    ));
  }

  return warnings;
}

export function evaluateRevenueStack(
  stack: RevenueStack | null | undefined,
  horizonYears: number,
  annualFixedCost: number | null,
): StackResult {
  if (!stackIsDeclared(stack)) {
    return { status: "not_declared", years: [], missingInputs: [], warnings: [], fixedCostShareTotal: 0 };
  }
  const declared = stack as RevenueStack;
  const shareTotal = declared.lines.reduce((sum, line) => sum + (line.fixedCostSharePct ?? 0), 0);
  const missingInputs = collectMissing(declared, horizonYears);
  const warnings = collectWarnings(declared, shareTotal);

  if (missingInputs.length) {
    return { status: "insufficient_data", years: [], missingInputs, warnings, fixedCostShareTotal: round(shareTotal) };
  }

  const series = new Map<string, number[]>();
  for (const driver of declared.drivers) {
    const values = driverSeries(driver, horizonYears);
    if (values) series.set(driver.id, values);
  }

  const fixedCost = annualFixedCost ?? 0;

  const years: StackYear[] = Array.from({ length: horizonYears }, (_, index) => {
    const lines: StackLineYear[] = declared.lines.map((line: StackLine) => {
      const items: StackItemYear[] = line.items.map((item) => {
        const driverValue = item.driverId === null ? null : series.get(item.driverId)?.[index] ?? null;
        return { itemId: item.id, label: item.label, kind: item.kind, amount: round(amountFor(item, driverValue) ?? 0) };
      });
      const revenue = items.filter((item) => item.kind === "revenue").reduce((sum, item) => sum + item.amount, 0);
      const directCost = items.filter((item) => item.kind === "direct_cost").reduce((sum, item) => sum + item.amount, 0);
      const allocatedFixedCost = fixedCost * ((line.fixedCostSharePct ?? 0) / 100);
      return {
        lineId: line.id,
        label: line.label,
        year: index + 1,
        revenue: round(revenue),
        directCost: round(directCost),
        contribution: round(revenue - directCost),
        allocatedFixedCost: round(allocatedFixedCost),
        operatingProfit: round(revenue - directCost - allocatedFixedCost),
        items,
      };
    });
    const sum = (pickValue: (line: StackLineYear) => number) => round(lines.reduce((total, line) => total + pickValue(line), 0));
    return {
      year: index + 1,
      revenue: sum((line) => line.revenue),
      directCost: sum((line) => line.directCost),
      contribution: sum((line) => line.contribution),
      allocatedFixedCost: sum((line) => line.allocatedFixedCost),
      operatingProfit: sum((line) => line.operatingProfit),
      lines,
    };
  });

  return { status: "ok", years, missingInputs: [], warnings, fixedCostShareTotal: round(shareTotal) };
}

/* ------------------------------------------------------------------------------------ */
/* Contraste con el mercado                                                              */
/* ------------------------------------------------------------------------------------ */

export type StackPlausibility = {
  status: "ok" | "above_som" | "far_below_som" | "no_market";
  /** Ingreso de la pila en el horizonte, en moneda local. */
  stackRevenueAtHorizon: number | null;
  somRevenueAtHorizon: number | null;
  /** Ingreso de la pila como porcentaje del SOM declarado. */
  sharePct: number | null;
  note: Localized;
};

/**
 * El contraste que justifica haber conservado TAM/SAM/SOM.
 *
 * La pila se construye de abajo arriba —tantas tarjetas, tanto gasto— y el SOM se declara de
 * arriba abajo. Cuando las dos no cuadran, una de las dos está mal, y saber cuál es trabajo
 * de quien defiende el caso, no de la herramienta. Lo que sí puede hacer la herramienta es
 * negarse a dejar pasar la contradicción en silencio, que es lo que ocurría cuando el ingreso
 * solo podía venir del SOM: era imposible contradecirlo porque era la única fuente.
 */
export function checkPlausibility(
  stack: StackResult,
  somRevenueAtHorizon: number | null,
): StackPlausibility {
  const stackRevenue = stack.status === "ok" ? stack.years[stack.years.length - 1]?.revenue ?? null : null;

  if (stackRevenue === null) {
    return {
      status: "no_market",
      stackRevenueAtHorizon: null,
      somRevenueAtHorizon: somRevenueAtHorizon,
      sharePct: null,
      note: loc(
        "La pila todavía no produce un ingreso completo, así que no hay nada que contrastar.",
        "The stack does not yet produce a complete revenue figure, so there is nothing to check it against."
      ),
    };
  }
  if (somRevenueAtHorizon === null || somRevenueAtHorizon <= 0) {
    return {
      status: "no_market",
      stackRevenueAtHorizon: round(stackRevenue),
      somRevenueAtHorizon: null,
      sharePct: null,
      note: loc(
        "No hay un SOM declarado contra el que contrastar la pila. El tamaño de mercado es la única comprobación externa que tiene este caso.",
        "There is no declared SOM to check the stack against. Market size is the only external check this case has."
      ),
    };
  }

  const sharePct = round((stackRevenue / somRevenueAtHorizon) * 100);

  if (sharePct > 105) {
    return {
      status: "above_som",
      stackRevenueAtHorizon: round(stackRevenue),
      somRevenueAtHorizon: round(somRevenueAtHorizon),
      sharePct,
      note: loc(
        `La pila implica un ingreso del ${sharePct}% del SOM declarado en el horizonte. O los drivers son optimistas o el mercado servible está mal dimensionado; las dos cosas no pueden ser ciertas a la vez.`,
        `The stack implies revenue at ${sharePct}% of the declared SOM at the horizon. Either the drivers are optimistic or the serviceable market is mis-sized; both cannot be true at once.`
      ),
    };
  }

  if (sharePct < 20) {
    return {
      status: "far_below_som",
      stackRevenueAtHorizon: round(stackRevenue),
      somRevenueAtHorizon: round(somRevenueAtHorizon),
      sharePct,
      note: loc(
        `La pila solo recoge el ${sharePct}% del SOM declarado. Si el mercado servible es correcto, o faltan líneas de negocio o la ambición declarada no se corresponde con el plan.`,
        `The stack captures only ${sharePct}% of the declared SOM. If the serviceable market is right, either business lines are missing or the declared ambition does not match the plan.`
      ),
    };
  }

  return {
    status: "ok",
    stackRevenueAtHorizon: round(stackRevenue),
    somRevenueAtHorizon: round(somRevenueAtHorizon),
    sharePct,
    note: loc(
      `La pila recoge el ${sharePct}% del SOM declarado en el horizonte, que es coherente con haberlo dimensionado bien.`,
      `The stack captures ${sharePct}% of the declared SOM at the horizon, which is consistent with having sized it right.`
    ),
  };
}
