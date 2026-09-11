/**
 * La lectura del modelo sobre el caso económico.
 *
 * Hasta aquí el supuesto «el caso económico supera el umbral de retorno» se contestaba a
 * mano como cualquier otro: quien analiza declara si lo cree y qué lo falsaría. Eso sigue
 * siendo así, y a propósito. La herramienta no decide si un supuesto es cierto.
 *
 * Lo que sí puede hacer ahora que existe la pila es traer la evidencia. El motor calcula un
 * NPV y un retorno; la tesis declara un umbral. Poner las dos cosas al lado de la creencia no
 * es decidir por nadie: es hacer difícil declarar que el caso se sostiene mientras el número
 * dice lo contrario sin que nadie lo note.
 *
 * De ahí los tres veredictos. `supports` y `contradicts` son afirmaciones sobre los números,
 * no sobre el supuesto. `silent` es lo más común al principio y no es un fallo: significa que
 * todavía no hay con qué.
 */

import { loc, type Localized } from "../i18n";

export type EconomicsVerdict = "supports" | "contradicts" | "silent";

export type EconomicsReading = {
  verdict: EconomicsVerdict;
  note: Localized;
  /** La creencia declarada choca con lo que dicen los números. */
  conflictsWithBelief: boolean;
};

export type EconomicsInput = {
  npv: number | null;
  roiPct: number | null;
  currency: string | null;
  /** El umbral de retorno que declara la tesis, si lo declara. */
  returnThresholdPct: number | null;
  action: "advance" | "test" | "discard" | "insufficient_data" | null;
  /** Con pila declarada el número descansa en partidas; sin ella, en un margen único. */
  stackDeclared: boolean;
  /** Lo que ha declarado quien analiza, para poder señalar la contradicción. */
  belief: "holds" | "does_not_hold" | "unknown";
};

function money(value: number, currency: string | null) {
  const formatted = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
  return currency ? `${formatted} ${currency}` : formatted;
}

function moneyEn(value: number, currency: string | null) {
  const formatted = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function readEconomics(input: EconomicsInput): EconomicsReading {
  const silent = (note: Localized): EconomicsReading => ({ verdict: "silent", note, conflictsWithBelief: false });

  if (input.action === null || input.action === "insufficient_data" || input.npv === null) {
    return silent(loc(
      "Todavía no hay un caso financiero completo para este mercado, así que el modelo no dice nada sobre este supuesto.",
      "There is no complete financial case for this market yet, so the model says nothing about this assumption."
    ));
  }

  const basis = input.stackDeclared
    ? loc("sobre la cuenta de resultados por líneas", "on the P&L by line")
    : loc("sobre el modelo de captura y margen, no sobre una cuenta por líneas", "on the capture-and-margin model, not on a P&L by line");

  const belowThreshold =
    input.returnThresholdPct !== null && input.roiPct !== null && input.roiPct < input.returnThresholdPct;
  const negative = input.npv < 0;

  if (negative || belowThreshold) {
    const reasonEs = negative
      ? `el NPV es ${money(input.npv, input.currency)}`
      : `el retorno es ${input.roiPct}% frente al umbral declarado del ${input.returnThresholdPct}%`;
    const reasonEn = negative
      ? `NPV is ${moneyEn(input.npv, input.currency)}`
      : `the return is ${input.roiPct}% against the declared threshold of ${input.returnThresholdPct}%`;
    return {
      verdict: "contradicts",
      note: loc(
        `Calculado ${basis.es}, ${reasonEs}.`,
        `Computed ${basis.en}, ${reasonEn}.`
      ),
      conflictsWithBelief: input.belief === "holds",
    };
  }

  const thresholdEs = input.returnThresholdPct === null
    ? "sin umbral declarado con el que compararlo"
    : `por encima del umbral declarado del ${input.returnThresholdPct}%`;
  const thresholdEn = input.returnThresholdPct === null
    ? "with no declared threshold to compare it against"
    : `above the declared threshold of ${input.returnThresholdPct}%`;

  return {
    verdict: "supports",
    note: loc(
      `Calculado ${basis.es}, el NPV es ${money(input.npv, input.currency)}${input.roiPct === null ? "" : ` y el retorno ${input.roiPct}%`}, ${thresholdEs}.`,
      `Computed ${basis.en}, NPV is ${moneyEn(input.npv, input.currency)}${input.roiPct === null ? "" : ` and the return ${input.roiPct}%`}, ${thresholdEn}.`
    ),
    conflictsWithBelief: input.belief === "does_not_hold",
  };
}
