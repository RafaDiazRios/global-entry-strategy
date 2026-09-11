/**
 * La pila de ingresos.
 *
 * Hasta aquí el caso económico tenía una sola forma: un mercado (TAM, SAM, SOM), un
 * porcentaje de captura y un margen operativo. Eso describe razonablemente a un fabricante
 * que vende un producto, y no describe a casi nadie más. Un negocio de tarjetas de crédito
 * no tiene «margen operativo»: tiene interchange sobre el volumen de compra, margen de
 * intereses sobre el saldo dispuesto, cuotas por tarjeta, y enfrente un coste de riesgo
 * sobre ese mismo saldo que es la partida que decide si el negocio existe. Pedirle que
 * exprese todo eso como «un 18% de margen sobre un 3% de captura del SOM» es pedirle que
 * mienta, y la mentira entra en el NPV sin dejar rastro.
 *
 * De ahí la pila: las partidas de la cuenta de resultados como dato, no como fórmula fija.
 *
 * Tres decisiones que explican la forma.
 *
 * Primera: las cantidades base son propias, no derivadas del SOM. Un banco sabe cuántas
 * tarjetas activas espera y cuánto gastan; no sabe qué fracción del «SOM» es el interchange.
 * Derivarlo del SOM obligaría a traducir hacia atrás, y esa traducción es justo donde se
 * pierde la trazabilidad. El SOM no desaparece: se queda como contraste de plausibilidad —
 * si la pila implica capturar más mercado del declarado, alguien tiene que explicarlo.
 *
 * Segunda: cada línea lleva su cuenta completa. Ingreso, coste directo que escala con un
 * driver, y una parte del coste fijo del modo. Así se puede ver qué línea gana dinero y cuál
 * lo pierde, que es la pregunta que hace el CFO y que un margen agregado no contesta.
 *
 * Tercera: nada de esto viene del libro. Lasserre y Monteiro no modelan cuentas de
 * resultados, y confundir una convención sectorial con una afirmación suya erosionaría lo
 * único que hace defendible a esta herramienta. Toda partida lleva su procedencia, y las
 * plantillas de sector salen marcadas como tales.
 */

import { loc, pick, type Lang, type Localized } from "../i18n";
import type { ProvenanceOrigin } from "./thesis";

/* ------------------------------------------------------------------------------------ */
/* Drivers                                                                               */
/* ------------------------------------------------------------------------------------ */

/**
 * Qué mide un driver. Solo importa para saber cómo se muestra y qué tarifas admite: una
 * cuenta admite un importe por unidad, un importe admite un porcentaje.
 */
export type DriverUnit = "count" | "amount";

export const DRIVER_UNITS: { id: DriverUnit; label: Localized; help: Localized }[] = [
  {
    id: "count",
    label: loc("Cantidad", "Count"),
    help: loc(
      "Número de clientes, cuentas, tarjetas activas, unidades vendidas o tiendas.",
      "A number of customers, accounts, active cards, units sold or stores."
    ),
  },
  {
    id: "amount",
    label: loc("Importe", "Amount"),
    help: loc(
      "Volumen transaccionado, saldo medio o valor de mercancía, en moneda local.",
      "Transacted volume, average balance or merchandise value, in local currency."
    ),
  },
];

/** Forma de la rampa entre el año 1 y el horizonte. La misma que usa el SOM. */
export type DriverRamp = "linear" | "s_curve" | "manual";

export const DRIVER_RAMPS: { id: DriverRamp; label: Localized; help: Localized }[] = [
  { id: "linear", label: loc("Lineal", "Linear"), help: loc("Crece a ritmo constante hasta el horizonte.", "Grows at a constant rate to the horizon.") },
  { id: "s_curve", label: loc("Curva en S", "S-curve"), help: loc("Arranca despacio, acelera y se satura.", "Starts slowly, accelerates and saturates.") },
  { id: "manual", label: loc("Año a año", "Year by year"), help: loc("Un valor por cada año del horizonte.", "One value for each year of the horizon.") },
];

export type RevenueDriver = {
  id: string;
  /** Escrito por quien construye el caso, o traído de una plantilla de sector. */
  label: string;
  unit: DriverUnit;
  valueYearOne: number | null;
  valueAtHorizon: number | null;
  ramp: DriverRamp;
  /** Solo cuando `ramp` es `manual`. Un hueco invalida el driver. */
  valuesByYear?: (number | null)[] | null;
  note: string | null;
};

/* ------------------------------------------------------------------------------------ */
/* Partidas                                                                              */
/* ------------------------------------------------------------------------------------ */

export type StackItemKind = "revenue" | "direct_cost";

export const STACK_ITEM_KINDS: { id: StackItemKind; label: Localized }[] = [
  { id: "revenue", label: loc("Ingreso", "Revenue") },
  { id: "direct_cost", label: loc("Coste directo", "Direct cost") },
];

/**
 * Cómo se convierte el driver en dinero.
 *
 * `pct_of_driver` solo tiene sentido sobre un driver de importe: un 1,2% de interchange
 * sobre el volumen de compra. `amount_per_unit` solo sobre uno de cantidad: 40 euros por
 * tarjeta activa. `fixed_amount` no usa driver, y existe porque hay partidas reales que no
 * escalan con nada —una tasa regulatoria anual, un canon de marca.
 */
export type RateKind = "pct_of_driver" | "amount_per_unit" | "fixed_amount";

export const RATE_KINDS: { id: RateKind; label: Localized; unit: DriverUnit | null; suffix: string }[] = [
  { id: "pct_of_driver", label: loc("% sobre el driver", "% of the driver"), unit: "amount", suffix: "%" },
  { id: "amount_per_unit", label: loc("Importe por unidad", "Amount per unit"), unit: "count", suffix: "" },
  { id: "fixed_amount", label: loc("Importe fijo anual", "Fixed annual amount"), unit: null, suffix: "" },
];

export function rateKindFitsDriver(rateKind: RateKind, unit: DriverUnit | null): boolean {
  const declared = RATE_KINDS.find((entry) => entry.id === rateKind)?.unit ?? null;
  if (declared === null) return true;
  return declared === unit;
}

export type StackItem = {
  id: string;
  label: string;
  kind: StackItemKind;
  /** `null` solo con `fixed_amount`. */
  driverId: string | null;
  rateKind: RateKind;
  rate: number | null;
  origin: ProvenanceOrigin;
  /** De dónde sale la partida. Vacío cuando la escribe el usuario. */
  provenance: Localized | null;
};

/* ------------------------------------------------------------------------------------ */
/* Líneas                                                                                */
/* ------------------------------------------------------------------------------------ */

/**
 * Una línea de negocio con su cuenta completa. El reparto del coste fijo es un porcentaje
 * del coste operativo anual que ya declara el perfil del modo: no se introduce dos veces.
 * Si los repartos no suman 100, el motor lo dice en lugar de normalizarlos por su cuenta;
 * un reparto que no cuadra suele ser una línea que alguien olvidó.
 */
export type StackLine = {
  id: string;
  label: string;
  items: StackItem[];
  fixedCostSharePct: number | null;
  note: string | null;
};

export type RevenueStack = {
  /** Vacía significa que el caso sigue con el modelo de captura sobre el SOM. */
  drivers: RevenueDriver[];
  lines: StackLine[];
  /** Plantilla de la que se partió, para poder decir de dónde venía. */
  templateId: string | null;
};

export function emptyRevenueStack(): RevenueStack {
  return { drivers: [], lines: [], templateId: null };
}

export function stackIsDeclared(stack: RevenueStack | null | undefined): boolean {
  return Boolean(stack && stack.lines.some((line) => line.items.length > 0));
}

/** Las partidas de todas las líneas, para recorrerlas sin anidar dos bucles cada vez. */
export function allItems(stack: RevenueStack): { line: StackLine; item: StackItem }[] {
  return stack.lines.flatMap((line) => line.items.map((item) => ({ line, item })));
}

export function driverById(stack: RevenueStack, driverId: string | null): RevenueDriver | null {
  if (driverId === null) return null;
  return stack.drivers.find((driver) => driver.id === driverId) ?? null;
}

/* ------------------------------------------------------------------------------------ */
/* Plantillas                                                                            */
/* ------------------------------------------------------------------------------------ */

/**
 * Una plantilla es una pila a medio escribir: las partidas con su nombre y su driver, sin
 * cifras. Se ofrece al elegir industria y desde ahí se edita; no se impone.
 */
export type StackTemplate = {
  id: string;
  label: Localized;
  description: Localized;
  origin: ProvenanceOrigin;
  provenance: Localized;
  /**
   * La plantilla es texto del marco y está en los dos idiomas; la pila que produce es dato
   * del usuario, que la reescribirá a su gusto, y por eso sale ya resuelta a un idioma. El
   * momento de elegir es el de instanciar, no el de mostrar: en cuanto alguien renombra una
   * partida deja de haber par que elegir.
   */
  build: (lang: Lang) => RevenueStack;
};

/** Identificadores estables para que una pila guardada sepa de qué plantilla salió. */
export function templateDriver(id: string, label: Localized, unit: DriverUnit, lang: Lang): RevenueDriver {
  return { id, label: pick(label, lang), unit, valueYearOne: null, valueAtHorizon: null, ramp: "linear", valuesByYear: null, note: null };
}

export function templateItem(
  id: string,
  label: Localized,
  kind: StackItemKind,
  driverId: string | null,
  rateKind: RateKind,
  provenance: Localized,
  lang: Lang,
): StackItem {
  return { id, label: pick(label, lang), kind, driverId, rateKind, rate: null, origin: "sector", provenance };
}
