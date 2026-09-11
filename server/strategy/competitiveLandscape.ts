/**
 * Lectura del mapa de competidores, y su cruce con la pila de ingresos.
 *
 * Tres cosas, en orden de cuánto cuesta discutirlas.
 *
 * La primera es aritmética: cuánta cuota está declarada, cuánta queda sin atribuir y cómo de
 * concentrado está el mercado. Sirve para ver si el mapa está completo.
 *
 * La segunda es el contraste que da sentido a todo esto: la pila declara cuántos clientes
 * espera tener en el horizonte y el mapa declara cuántos hay. La división es la cuota que el
 * plan implica, y nadie la había escrito.
 *
 * La tercera es la que suele faltar en la hoja: si esa cuota no cabe en lo que está sin
 * atribuir, tiene que salir de alguien con nombre, y conviene decir de quién. Y captarla
 * cuesta dinero que, si no hay una partida de la pila que lo recoja, no está en el caso.
 */

import { loc, type Localized } from "@shared/i18n";
import {
  CONCENTRATION_BANDS,
  landscapeIsDeclared,
  type CompetitiveLandscape,
  type ConcentrationBand,
} from "@shared/domain/competitiveLandscape";
import type { RevenueStack } from "@shared/domain/revenueStack";

export type LandscapeResult = {
  status: "ok" | "not_declared";
  /** Suma de las cuotas declaradas. */
  declaredSharePct: number;
  /** Lo que queda sin atribuir a un competidor con nombre. */
  unattributedSharePct: number;
  hhi: number | null;
  band: ConcentrationBand;
  bandLabel: Localized;
  bandReading: Localized;
  /** Cuota que implica el plan, cuando hay pila y mercado declarados. */
  impliedSharePct: number | null;
  /** Unidades que el plan espera captar en el horizonte. */
  impliedUnits: number | null;
  /** Lo que cuesta captarlas al coste de adquisición declarado, en moneda local. */
  acquisitionSpend: number | null;
  findings: Localized[];
};

const round = (value: number) => Math.round(value * 100) / 100;

function bandFor(hhi: number | null): ConcentrationBand {
  if (hhi === null) return "unknown";
  if (hhi < 1500) return "fragmented";
  if (hhi <= 2500) return "moderate";
  return "concentrated";
}

function band(id: ConcentrationBand) {
  return CONCENTRATION_BANDS.find((entry) => entry.id === id) ?? CONCENTRATION_BANDS[3];
}

/** El valor del driver en el horizonte, que es lo que el plan promete alcanzar. */
function driverAtHorizon(stack: RevenueStack | null | undefined, driverId: string | null, horizonYears: number): number | null {
  if (!stack || driverId === null) return null;
  const driver = stack.drivers.find((entry) => entry.id === driverId);
  if (!driver) return null;
  if (driver.ramp === "manual") {
    const value = driver.valuesByYear?.[horizonYears - 1] ?? null;
    return value !== null && Number.isFinite(value) ? value : null;
  }
  return driver.valueAtHorizon !== null && Number.isFinite(driver.valueAtHorizon) ? driver.valueAtHorizon : null;
}

/**
 * ¿Hay alguna partida de coste que use el mismo driver? Si la hay, el coste de captar ya está
 * en la cuenta y no procede avisar. Si no la hay, el plan promete clientes que nadie ha
 * presupuestado, que es el agujero más común y el más caro.
 */
function acquisitionIsBudgeted(stack: RevenueStack | null | undefined, driverId: string | null): boolean {
  if (!stack || driverId === null) return false;
  return stack.lines.some((line) =>
    line.items.some((item) => item.kind === "direct_cost" && item.driverId === driverId)
  );
}

export function evaluateLandscape(
  landscape: CompetitiveLandscape | null | undefined,
  stack: RevenueStack | null | undefined,
  horizonYears: number,
): LandscapeResult {
  const blank: LandscapeResult = {
    status: "not_declared",
    declaredSharePct: 0,
    unattributedSharePct: 100,
    hhi: null,
    band: "unknown",
    bandLabel: band("unknown").label,
    bandReading: band("unknown").reading,
    impliedSharePct: null,
    impliedUnits: null,
    acquisitionSpend: null,
    findings: [],
  };
  if (!landscapeIsDeclared(landscape)) return blank;

  const declared = landscape as CompetitiveLandscape;
  const named = declared.competitors.filter((competitor) => competitor.name.trim().length > 0);
  const withShare = named.filter((competitor) => competitor.sharePct !== null && Number.isFinite(competitor.sharePct));
  const declaredSharePct = round(withShare.reduce((sum, competitor) => sum + (competitor.sharePct ?? 0), 0));
  const unattributedSharePct = round(Math.max(0, 100 - declaredSharePct));

  /**
   * El HHI necesita el mercado entero. Si falta cuota por atribuir, lo que queda se trata
   * como atomizado —muchos pequeños— que es el supuesto conservador: da un índice más bajo,
   * es decir, un mercado que parece más fácil de lo que probablemente es.
   */
  const hhi = withShare.length
    ? round(withShare.reduce((sum, competitor) => sum + Math.pow(competitor.sharePct ?? 0, 2), 0))
    : null;
  const bandId = bandFor(hhi);

  const findings: Localized[] = [];

  if (declaredSharePct > 100.5) {
    findings.push(loc(
      `Las cuotas declaradas suman ${declaredSharePct}%. Alguna está medida sobre otro mercado o hay un competidor contado dos veces.`,
      `The declared shares add up to ${declaredSharePct}%. One of them is measured against a different market, or a competitor is counted twice.`
    ));
  }

  const withoutReason = named.filter((competitor) => !(competitor.holdReason ?? "").trim());
  if (withoutReason.length) {
    findings.push(loc(
      `Sin razón escrita de por qué retienen a sus clientes: ${withoutReason.map((competitor) => competitor.name).join(", ")}. Una cuota sin razón no dice si se puede mover.`,
      `With no written reason why they hold their customers: ${withoutReason.map((competitor) => competitor.name).join(", ")}. A share with no reason does not say whether it can be moved.`
    ));
  }

  const impliedUnits = driverAtHorizon(stack, declared.driverId, horizonYears);
  const marketUnits = declared.marketUnits !== null && declared.marketUnits > 0 ? declared.marketUnits : null;
  const impliedSharePct = impliedUnits !== null && marketUnits !== null ? round((impliedUnits / marketUnits) * 100) : null;

  if (impliedSharePct !== null) {
    if (impliedSharePct > unattributedSharePct) {
      const fromIncumbents = round(impliedSharePct - unattributedSharePct);
      const leaders = [...withShare].sort((a, b) => (b.sharePct ?? 0) - (a.sharePct ?? 0)).slice(0, 2).map((competitor) => competitor.name);
      findings.push(loc(
        `El plan implica el ${impliedSharePct}% del mercado y solo hay un ${unattributedSharePct}% sin dueño: ${fromIncumbents} puntos tienen que salir de competidores con nombre${leaders.length ? `, empezando por ${leaders.join(" y ")}` : ""}. Escriba cómo.`,
        `The plan implies ${impliedSharePct}% of the market and only ${unattributedSharePct}% is unowned: ${fromIncumbents} points have to come from named competitors${leaders.length ? `, starting with ${leaders.join(" and ")}` : ""}. Write down how.`
      ));
    } else {
      findings.push(loc(
        `El plan implica el ${impliedSharePct}% del mercado, que cabe en el ${unattributedSharePct}% sin atribuir. Conviene comprobar que ese resto existe y no es un residuo de redondeo.`,
        `The plan implies ${impliedSharePct}% of the market, which fits inside the ${unattributedSharePct}% unattributed. Worth checking that this remainder is real and not a rounding residue.`
      ));
    }
  } else if (declared.driverId === null && (stack?.drivers.length ?? 0) > 0) {
    findings.push(loc(
      "Falta decir qué driver de la pila cuenta lo mismo que el mercado declarado. Sin esa correspondencia no se puede saber qué cuota implica el plan.",
      "It is not stated which stack driver counts the same thing as the declared market. Without that correspondence, the share the plan implies cannot be known."
    ));
  }

  const acquisitionCost = declared.acquisitionCost !== null && Number.isFinite(declared.acquisitionCost) ? declared.acquisitionCost : null;
  const acquisitionSpend = acquisitionCost !== null && impliedUnits !== null ? round(acquisitionCost * impliedUnits) : null;

  if (acquisitionSpend !== null && !acquisitionIsBudgeted(stack, declared.driverId)) {
    findings.push(loc(
      `Captar ${Math.round(impliedUnits!)} ${declared.unitLabel || "clientes"} a ${acquisitionCost} cuesta ${acquisitionSpend}, y ninguna partida de coste de la pila usa ese driver. O está dentro del coste fijo, y conviene decirlo, o falta del caso.`,
      `Acquiring ${Math.round(impliedUnits!)} ${declared.unitLabel || "customers"} at ${acquisitionCost} costs ${acquisitionSpend}, and no cost item in the stack uses that driver. Either it sits inside the fixed cost, and that should be said, or it is missing from the case.`
    ));
  }

  return {
    status: "ok",
    declaredSharePct,
    unattributedSharePct,
    hhi,
    band: bandId,
    bandLabel: band(bandId).label,
    bandReading: band(bandId).reading,
    impliedSharePct,
    impliedUnits: impliedUnits === null ? null : round(impliedUnits),
    acquisitionSpend,
    findings,
  };
}
