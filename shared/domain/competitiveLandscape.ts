/**
 * El mapa de competidores.
 *
 * El capítulo 6 pide puntuar la intensidad de la rivalidad de 0 a 4, y esa puntuación es
 * fiel al libro y sirve para comparar países entre sí. Lo que no sirve es para defender una
 * tesis delante de nadie. «Rivalidad 3 sobre 4» no se puede discutir: no hay nada en esa
 * frase con lo que estar en desacuerdo. «ING tiene el 38% y capta un cliente por 180 euros»
 * sí se puede discutir, y de hecho es lo único que se discute en una sala.
 *
 * Por eso esto no sustituye a la puntuación del capítulo 6: la acompaña. La puntuación entra
 * en el índice comparable; el mapa entra en el argumento.
 *
 * Y hace una cosa que ninguna de las dos hacía por separado. La pila de ingresos declara
 * cuántos clientes espera captar; el mapa declara cuántos hay y de quién son. Cruzarlos da la
 * cuota que el plan implica y el coste de conseguirla, que es la cifra que más a menudo falta
 * en estos casos: nadie la escribe porque no hay casilla donde escribirla.
 */

import { loc, type Localized } from "../i18n";

export type Competitor = {
  id: string;
  /** Lo escribe quien analiza. Aquí no hay par bilingüe que valga: es un nombre propio. */
  name: string;
  /** Cuota sobre el mercado servible, en la unidad declarada. */
  sharePct: number | null;
  /**
   * Qué hace difícil quitarle un cliente. No es una puntuación: es la razón, escrita.
   * Sin ella, una cuota es un número sin consecuencia.
   */
  holdReason: string | null;
  note: string | null;
};

export function emptyCompetitor(id: string): Competitor {
  return { id, name: "", sharePct: null, holdReason: null, note: null };
}

export type CompetitiveLandscape = {
  /**
   * Tamaño del mercado servible en unidades —clientes, tarjetas, cuentas, hogares—, no en
   * dinero. Las unidades se discuten mejor: nadie sabe si un mercado de 400 millones es
   * grande, y todo el mundo sabe si dos millones de tarjetas son muchas.
   */
  marketUnits: number | null;
  /** Cómo se llama esa unidad. Lo escribe quien analiza porque cambia con el negocio. */
  unitLabel: string | null;
  /** Driver de la pila que cuenta lo mismo, para poder contrastarlos. */
  driverId: string | null;
  /** Coste de captar un cliente, en moneda local. */
  acquisitionCost: number | null;
  competitors: Competitor[];
  note: string | null;
};

export function emptyCompetitiveLandscape(): CompetitiveLandscape {
  return { marketUnits: null, unitLabel: null, driverId: null, acquisitionCost: null, competitors: [], note: null };
}

export function landscapeIsDeclared(landscape: CompetitiveLandscape | null | undefined): boolean {
  return Boolean(landscape && landscape.competitors.some((competitor) => competitor.name.trim().length > 0));
}

/* ------------------------------------------------------------------------------------ */
/* Concentración                                                                         */
/* ------------------------------------------------------------------------------------ */

export type ConcentrationBand = "fragmented" | "moderate" | "concentrated" | "unknown";

/**
 * Las bandas del índice Herfindahl-Hirschman con los umbrales que usan las autoridades de
 * competencia. No vienen del libro y se marcan como lo que son. Se incluyen porque son el
 * vocabulario con el que un comité ya habla de esto, no porque Lasserre las proponga.
 */
export const CONCENTRATION_BANDS: { id: ConcentrationBand; label: Localized; reading: Localized }[] = [
  {
    id: "fragmented",
    label: loc("Fragmentado", "Fragmented"),
    reading: loc(
      "HHI por debajo de 1.500. Hay hueco sin tener que quitárselo a nadie en particular.",
      "HHI below 1,500. There is room without having to take it from anyone in particular."
    ),
  },
  {
    id: "moderate",
    label: loc("Moderadamente concentrado", "Moderately concentrated"),
    reading: loc(
      "HHI entre 1.500 y 2.500. Entrar significa quitar cuota a alguien con nombre.",
      "HHI between 1,500 and 2,500. Entering means taking share from someone with a name."
    ),
  },
  {
    id: "concentrated",
    label: loc("Concentrado", "Concentrated"),
    reading: loc(
      "HHI por encima de 2.500. La cuota que gane saldrá de uno o dos incumbentes, y se defenderán.",
      "HHI above 2,500. Any share you win comes from one or two incumbents, and they will defend it."
    ),
  },
  {
    id: "unknown",
    label: loc("Sin determinar", "Undetermined"),
    reading: loc(
      "Faltan cuotas para calcular la concentración.",
      "Shares are missing, so concentration cannot be computed."
    ),
  },
];

export const HHI_PROVENANCE: Localized = loc(
  "Índice Herfindahl-Hirschman con los umbrales de las autoridades de competencia. No procede del libro.",
  "Herfindahl-Hirschman index with the thresholds used by competition authorities. It does not come from the book."
);
