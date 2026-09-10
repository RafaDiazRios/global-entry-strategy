/**
 * Instrumentos cuantitativos del capítulo 6 para estimar demanda.
 *
 * - Curvas de penetración: correlación entre un indicador de consumo y la renta per cápita
 *   (Figuras 6.4 y 6.5, p. 230). El libro muestra los dos casos que importan: una curva
 *   saturante con R = 0,85 (móviles) y una relación en campana con R = 0,36 (cemento).
 * - Efecto clase media: el salto no lineal del tamaño del segmento cuando la renta cruza
 *   un umbral, por lo sesgado de la distribución en países emergentes (Figura 6.6, p. 232).
 */

export type CurveModel = "linear" | "logarithmic" | "invertedU";

export type CurvePoint = {
  /** Etiqueta del punto: normalmente el código de país. */
  label: string;
  /** Variable explicativa: renta per cápita. */
  gdpPerCapita: number;
  /** Variable explicada: consumo de la categoría por habitante o por cien habitantes. */
  value: number;
};

export type CurveFit = {
  model: CurveModel;
  /** Coeficientes en el orden del modelo: [a, b] o [a, b, c]. */
  coefficients: number[];
  /** Coeficiente de correlación. Para el modelo en campana es la correlación múltiple. */
  r: number;
  rSquared: number;
  observations: number;
  /** Residuo por punto: valor observado menos valor ajustado. */
  residuals: { label: string; observed: number; fitted: number; residual: number }[];
  note: string;
};

export type CurveFitResult = {
  best: CurveFit | null;
  candidates: CurveFit[];
  source: string;
};

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Mínimos cuadrados ordinarios sobre una matriz de diseño pequeña, resuelto por Gauss. */
function solveLeastSquares(design: number[][], target: number[]): number[] | null {
  const columns = design[0].length;
  const normal: number[][] = Array.from({ length: columns }, () => new Array(columns + 1).fill(0));
  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < columns; j += 1) {
      normal[i][j] = design.reduce((sum, row) => sum + row[i] * row[j], 0);
    }
    normal[i][columns] = design.reduce((sum, row, index) => sum + row[i] * target[index], 0);
  }
  for (let i = 0; i < columns; i += 1) {
    let pivot = i;
    for (let row = i + 1; row < columns; row += 1) {
      if (Math.abs(normal[row][i]) > Math.abs(normal[pivot][i])) pivot = row;
    }
    if (Math.abs(normal[pivot][i]) < 1e-12) return null;
    [normal[i], normal[pivot]] = [normal[pivot], normal[i]];
    for (let row = 0; row < columns; row += 1) {
      if (row === i) continue;
      const factor = normal[row][i] / normal[i][i];
      for (let col = i; col <= columns; col += 1) normal[row][col] -= factor * normal[i][col];
    }
  }
  return normal.map((row, index) => row[columns] / row[index]);
}

function designFor(model: CurveModel, x: number) {
  const u = Math.log(x);
  if (model === "linear") return [1, x];
  if (model === "logarithmic") return [1, u];
  return [1, u, u * u];
}

const modelNotes: Record<CurveModel, string> = {
  linear: "Relación lineal con la renta per cápita.",
  logarithmic: "Curva saturante: el consumo crece con la renta y se aplana. Es la forma del caso de suscripciones móviles del libro (Figura 6.4, p. 230).",
  invertedU: "Relación en campana: la demanda crece con el desarrollo y decae tras un pico. Es la forma del caso de cemento del libro (Figura 6.5, p. 230).",
};

function fitModel(points: CurvePoint[], model: CurveModel): CurveFit | null {
  const usable = points.filter((point) => Number.isFinite(point.gdpPerCapita) && point.gdpPerCapita > 0 && Number.isFinite(point.value));
  const minimum = model === "invertedU" ? 4 : 3;
  if (usable.length < minimum) return null;
  const design = usable.map((point) => designFor(model, point.gdpPerCapita));
  const target = usable.map((point) => point.value);
  const coefficients = solveLeastSquares(design, target);
  if (!coefficients || coefficients.some((value) => !Number.isFinite(value))) return null;

  const fittedValues = design.map((row) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const targetMean = mean(target);
  const totalSumSquares = target.reduce((sum, value) => sum + (value - targetMean) ** 2, 0);
  const residualSumSquares = target.reduce((sum, value, index) => sum + (value - fittedValues[index]) ** 2, 0);
  if (totalSumSquares < 1e-12) return null;
  const rSquared = 1 - residualSumSquares / totalSumSquares;
  const sign = model === "invertedU" ? 1 : Math.sign(coefficients[1]) || 1;
  return {
    model,
    coefficients: coefficients.map((value) => round(value, 6)),
    r: round(sign * Math.sqrt(Math.max(0, rSquared)), 3),
    rSquared: round(Math.max(0, rSquared), 3),
    observations: usable.length,
    residuals: usable.map((point, index) => ({
      label: point.label,
      observed: round(point.value, 3),
      fitted: round(fittedValues[index], 3),
      residual: round(point.value - fittedValues[index], 3),
    })),
    note: modelNotes[model],
  };
}

export function fitPenetrationCurve(points: CurvePoint[], model?: CurveModel): CurveFitResult {
  const models: CurveModel[] = model ? [model] : ["logarithmic", "linear", "invertedU"];
  const candidates = models.map((candidate) => fitModel(points, candidate)).filter((fit): fit is CurveFit => fit !== null);
  const best = [...candidates].sort((a, b) => b.rSquared - a.rSquared)[0] ?? null;
  return {
    best,
    candidates,
    source: "Figuras 6.4 y 6.5, p. 230",
  };
}

/** Consumo previsto por el ajuste para una renta per cápita dada. */
export function predictFromCurve(fit: CurveFit, gdpPerCapita: number): number | null {
  if (!Number.isFinite(gdpPerCapita) || gdpPerCapita <= 0) return null;
  const row = designFor(fit.model, gdpPerCapita);
  return round(row.reduce((sum, value, index) => sum + value * (fit.coefficients[index] ?? 0), 0), 3);
}

// ---------------------------------------------------------------------------
// Efecto clase media — Figura 6.6, p. 232
// ---------------------------------------------------------------------------

/** Función de distribución normal estándar, por aproximación de Abramowitz y Stegun. */
function normalCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-(z * z) / 2);
  const probability = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - probability : probability;
}

/** Inversa de la normal estándar, por aproximación de Acklam. */
function normalInverse(p: number) {
  if (p <= 0 || p >= 1) return Number.NaN;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export type MiddleClassInput = {
  /** Renta media por habitante, en la misma unidad que el umbral. */
  gdpPerCapita: number;
  /** Índice de Gini, 0-100. */
  gini: number;
  /** Umbral de renta a partir del cual el hogar entra en el segmento objetivo. */
  threshold: number;
  /** Crecimiento acumulado de la renta per cápita en el horizonte, en porcentaje. */
  incomeGrowthPct: number;
  /** Umbral superior opcional, para acotar el segmento por arriba. */
  upperThreshold?: number | null;
};

export type MiddleClassResult = {
  /** Proporción de población dentro del segmento hoy, 0-1. */
  baseShare: number;
  /** Proporción tras aplicar el crecimiento de renta, 0-1. */
  projectedShare: number;
  /** Variación relativa del tamaño del segmento, en porcentaje. */
  relativeChangePct: number;
  /** Sigma de la distribución lognormal implícita en el Gini. */
  sigma: number;
  note: string;
  source: string;
};

/**
 * Modela la distribución de renta como lognormal calibrada por el Gini
 * (sigma = raíz de 2 por la inversa normal de (G+1)/2) y mide qué proporción queda por
 * encima del umbral antes y después de un crecimiento de la renta media.
 *
 * Es el mecanismo que el libro ilustra en la Figura 6.6: un aumento del 20% de la renta
 * per cápita amplía la clase media mucho más de un 20%, porque la masa de población se
 * concentra justo por debajo del umbral.
 */
export function middleClassEffect(input: MiddleClassInput): MiddleClassResult | null {
  const { gdpPerCapita, gini, threshold, incomeGrowthPct } = input;
  if (!Number.isFinite(gdpPerCapita) || gdpPerCapita <= 0) return null;
  if (!Number.isFinite(gini) || gini <= 0 || gini >= 100) return null;
  if (!Number.isFinite(threshold) || threshold <= 0) return null;

  const sigma = Math.SQRT2 * normalInverse((gini / 100 + 1) / 2);
  if (!Number.isFinite(sigma) || sigma <= 0) return null;

  const shareAbove = (meanIncome: number, limit: number) => {
    const mu = Math.log(meanIncome) - (sigma * sigma) / 2;
    return 1 - normalCdf((Math.log(limit) - mu) / sigma);
  };
  const shareWithin = (meanIncome: number) => {
    const lower = shareAbove(meanIncome, threshold);
    if (!input.upperThreshold || input.upperThreshold <= threshold) return lower;
    return Math.max(0, lower - shareAbove(meanIncome, input.upperThreshold));
  };

  const baseShare = shareWithin(gdpPerCapita);
  const projectedShare = shareWithin(gdpPerCapita * (1 + incomeGrowthPct / 100));
  const relativeChangePct = baseShare < 1e-9 ? 0 : ((projectedShare - baseShare) / baseShare) * 100;

  return {
    baseShare: round(baseShare, 4),
    projectedShare: round(projectedShare, 4),
    relativeChangePct: Math.round(relativeChangePct * 10) / 10,
    sigma: round(sigma, 3),
    note: "Distribución lognormal calibrada con el Gini. La proporción es de población, no de gasto: el segmento suele pesar más en consumo que en habitantes.",
    source: "Figura 6.6, p. 232",
  };
}
