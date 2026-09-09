export type EntryObjective = "market" | "resources" | "learning" | "coordination";

export type QualitativeCalibration = {
  demandQuality: number;
  resourceFit: number;
  competitionAttractiveness: number;
  governmentOpenness: number;
  cageDistance: number;
  politicalRisk: number;
  economicRisk: number;
  competitiveRisk: number;
  operationalRisk: number;
  internalReadiness: number;
  timePressure: number;
  controlNeed: number;
  ipSensitivity: number;
};

export type MarketData = {
  gdpUsd?: number | null;
  gdpPerCapita?: number | null;
  gdpGrowth?: number | null;
  population?: number | null;
  urbanization?: number | null;
  internetUse?: number | null;
  tradeOpenness?: number | null;
  investmentRate?: number | null;
  sourceYear?: number | null;
  sourceStatus: "live" | "partial" | "unavailable";
};

export type CountryInput = {
  code: string;
  name?: string;
  calibration?: Partial<QualitativeCalibration>;
};

export type EvaluationInput = {
  companyName: string;
  homeCountry: string;
  industry: string;
  businessModel: string;
  valueProposition: string;
  objective: EntryObjective;
  horizonYears: number;
  countryInputs: CountryInput[];
  marketData: Record<string, MarketData>;
  weights?: Partial<ScoreWeights>;
};

export type ScoreWeights = {
  market: number;
  resources: number;
  competition: number;
  government: number;
  distance: number;
  risk: number;
};

export type CountryResult = {
  code: string;
  name: string;
  data: MarketData;
  calibration: QualitativeCalibration;
  scores: {
    market: number;
    resources: number;
    competition: number;
    government: number;
    distanceFit: number;
    safety: number;
    attractiveness: number;
    riskAdjusted: number;
    confidence: number;
  };
  entryModes: EntryModeRecommendation[];
  timing: TimingRecommendation;
  flags: string[];
};

export type EntryModeRecommendation = {
  mode: string;
  score: number;
  rationale: string;
  commitment: "Bajo" | "Medio" | "Alto";
};

export type TimingRecommendation = {
  label: string;
  description: string;
};

export type EvaluationResult = {
  generatedAt: string;
  methodology: string;
  countries: CountryResult[];
  portfolio: {
    leadingCountry?: string;
    recommendation: string;
    caveats: string[];
  };
};

const defaults: QualitativeCalibration = {
  demandQuality: 50,
  resourceFit: 50,
  competitionAttractiveness: 50,
  governmentOpenness: 50,
  cageDistance: 50,
  politicalRisk: 50,
  economicRisk: 50,
  competitiveRisk: 50,
  operationalRisk: 50,
  internalReadiness: 50,
  timePressure: 50,
  controlNeed: 50,
  ipSensitivity: 50,
};

const defaultWeights: ScoreWeights = {
  market: 28,
  resources: 16,
  competition: 16,
  government: 10,
  distance: 10,
  risk: 20,
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mean(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 50;
}

function normalize(value: number | null | undefined, low: number, high: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 50;
  if (high === low) return 50;
  return clamp(((value - low) / (high - low)) * 100);
}

function logNormalize(value: number | null | undefined, low: number, high: number) {
  if (!value || value <= 0) return 50;
  return normalize(Math.log10(value), Math.log10(low), Math.log10(high));
}

function labelForObjective(objective: EntryObjective) {
  return {
    market: "desarrollo de mercado",
    resources: "acceso a recursos",
    learning: "aprendizaje y capacidades",
    coordination: "coordinación regional",
  }[objective];
}

function calculateConfidence(data: MarketData, calibration: QualitativeCalibration) {
  const dataPoints = [
    data.gdpUsd,
    data.gdpPerCapita,
    data.gdpGrowth,
    data.population,
    data.urbanization,
    data.internetUse,
    data.tradeOpenness,
    data.investmentRate,
  ].filter((value) => value !== null && value !== undefined).length;
  const manualValues = Object.values(calibration).filter((value) => value !== 50).length;
  return clamp(35 + dataPoints * 6 + Math.min(manualValues, 8) * 2);
}

function calculateEntryModes(
  attractiveness: number,
  safety: number,
  calibration: QualitativeCalibration,
  objective: EntryObjective,
  businessModel: string,
): EntryModeRecommendation[] {
  const risk = 100 - safety;
  const strategicFit = objective === "market" ? 8 : objective === "resources" ? 5 : 0;
  const directInvestment = clamp(
    0.28 * attractiveness +
      0.22 * safety +
      0.2 * calibration.internalReadiness +
      0.15 * calibration.controlNeed +
      0.15 * calibration.governmentOpenness +
      strategicFit,
  );
  const acquisition = clamp(
    0.26 * attractiveness +
      0.16 * safety +
      0.18 * calibration.internalReadiness +
      0.2 * calibration.timePressure +
      0.1 * calibration.controlNeed +
      0.1 * calibration.competitionAttractiveness,
  );
  const jointVenture = clamp(
    0.18 * attractiveness +
      0.12 * safety +
      0.18 * (100 - calibration.cageDistance) +
      0.18 * calibration.governmentOpenness +
      0.16 * (100 - calibration.internalReadiness) +
      0.18 * calibration.resourceFit,
  );
  const licensing = clamp(
    0.22 * risk +
      0.18 * (100 - calibration.internalReadiness) +
      0.18 * (100 - calibration.controlNeed) +
      0.2 * (100 - calibration.ipSensitivity) +
      0.12 * attractiveness +
      0.1 * calibration.timePressure,
  );
  const distributor = clamp(
    0.26 * risk +
      0.18 * (100 - calibration.internalReadiness) +
      0.14 * (100 - calibration.controlNeed) +
      0.14 * calibration.timePressure +
      0.16 * attractiveness +
      0.12 * calibration.demandQuality,
  );
  const office = clamp(
    0.28 * calibration.cageDistance +
      0.24 * risk +
      0.18 * (100 - calibration.internalReadiness) +
      0.15 * (100 - attractiveness) +
      0.15 * (100 - calibration.timePressure),
  );
  const digital = clamp(
    0.24 * attractiveness +
      0.18 * safety +
      0.16 * (100 - calibration.cageDistance) +
      0.18 * calibration.timePressure +
      0.12 * calibration.internalReadiness +
      0.12 * (100 - calibration.controlNeed),
  );

  const modes: EntryModeRecommendation[] = [
    {
      mode: "Filial propia / greenfield",
      score: directInvestment,
      commitment: "Alto",
      rationale: "Maximiza el control y la captura de valor, pero requiere capacidad interna, permiso regulatorio y una exposición al riesgo razonable.",
    },
    {
      mode: "Adquisición",
      score: acquisition,
      commitment: "Alto",
      rationale: "Acelera el acceso a activos, clientes y capacidades. Exige debida diligencia, precio disciplinado y capacidad de integración intercultural.",
    },
    {
      mode: "Joint venture o alianza",
      score: jointVenture,
      commitment: "Medio",
      rationale: "Comparte riesgo y aporta legitimidad o acceso local. La recomendación presupone un análisis de encaje estratégico, operativo, cultural y organizativo del socio.",
    },
    {
      mode: "Licencia o franquicia",
      score: licensing,
      commitment: "Bajo",
      rationale: "Reduce la inversión y la exposición, a cambio de menor control sobre mercado, calidad y conocimiento. Es menos apropiada cuando el IP es muy sensible.",
    },
    {
      mode: "Agente o distribuidor",
      score: distributor,
      commitment: "Bajo",
      rationale: "Permite probar demanda y cobertura comercial con bajo compromiso. Debe incluir hitos de revisión para evitar dependencia o pérdida de conocimiento del cliente.",
    },
    {
      mode: "Oficina de representación / observatorio",
      score: office,
      commitment: "Bajo",
      rationale: "Opción de aprendizaje y construcción de relaciones cuando la distancia, la incertidumbre o el conocimiento local todavía limitan una entrada más comprometida.",
    },
  ];

  if (/(digital|saas|software|plataforma|marketplace|e-commerce|ecommerce)/i.test(businessModel)) {
    modes.push({
      mode: "Entrada digital o híbrida",
      score: digital,
      commitment: "Bajo",
      rationale: "Adecuada cuando la oferta puede desplegarse digitalmente; requiere validar regulación, localización, pagos, datos y la necesidad de una capa física o de socios locales.",
    });
  }

  return modes.sort((a, b) => b.score - a.score).slice(0, 3);
}

function recommendTiming(attractiveness: number, safety: number, calibration: QualitativeCalibration): TimingRecommendation {
  if (attractiveness >= 72 && safety >= 60 && calibration.timePressure >= 60) {
    return {
      label: "Ventana de entrada: actuar",
      description: "La combinación de oportunidad, riesgo tolerable y urgencia justifica preparar una entrada con hitos de ejecución y validación financiera.",
    };
  }
  if (attractiveness >= 58 && safety >= 45) {
    return {
      label: "Entrada gradual / opción real",
      description: "Existe interés estratégico, pero conviene comenzar con un compromiso reversible y definir criterios explícitos para ampliar, mantener o abandonar.",
    };
  }
  return {
    label: "Observar y aprender",
    description: "La evidencia actual no justifica una inversión material. Priorice inteligencia local, relaciones y señales que reabran la decisión.",
  };
}

export function evaluateStrategy(input: EvaluationInput): EvaluationResult {
  const weights = { ...defaultWeights, ...input.weights };
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const countries = input.countryInputs.map((country) => {
    const data = input.marketData[country.code] ?? { sourceStatus: "unavailable" as const };
    const calibration = { ...defaults, ...country.calibration };

    const macroMarket = mean([
      logNormalize(data.gdpUsd, 20_000_000_000, 25_000_000_000_000),
      logNormalize(data.population, 500_000, 1_500_000_000),
      normalize(data.gdpPerCapita, 1_000, 80_000),
      normalize(data.gdpGrowth, -5, 12),
      normalize(data.urbanization, 20, 95),
    ]);
    const market = clamp(0.65 * macroMarket + 0.35 * calibration.demandQuality);
    const macroResources = mean([
      normalize(data.internetUse, 10, 100),
      normalize(data.investmentRate, 10, 40),
      normalize(data.tradeOpenness, 20, 220),
      normalize(data.urbanization, 20, 95),
    ]);
    const resources = clamp(0.52 * macroResources + 0.48 * calibration.resourceFit);
    const competition = clamp(calibration.competitionAttractiveness);
    const government = clamp(calibration.governmentOpenness);
    const distanceFit = clamp(100 - calibration.cageDistance);
    const safety = clamp(
      100 - mean([calibration.politicalRisk, calibration.economicRisk, calibration.competitiveRisk, calibration.operationalRisk]),
    );
    const attractiveness = clamp(
      (market * weights.market +
        resources * weights.resources +
        competition * weights.competition +
        government * weights.government +
        distanceFit * weights.distance) /
        (weights.market + weights.resources + weights.competition + weights.government + weights.distance),
    );
    const riskAdjusted = clamp(
      (attractiveness * (totalWeight - weights.risk) + safety * weights.risk) / totalWeight,
    );
    const flags: string[] = [];
    if (calibration.politicalRisk >= 70) flags.push("Riesgo político alto: limite activos hundidos y considere cobertura contractual/financiera.");
    if (calibration.cageDistance >= 70) flags.push("Distancia CAGE alta: exija evidencia local y una ruta de aprendizaje antes de escalar.");
    if (calibration.ipSensitivity >= 70) flags.push("Sensibilidad alta de IP: extreme controles antes de licenciar o compartir tecnología.");
    if (calibration.competitionAttractiveness <= 35) flags.push("Contexto competitivo desfavorable: valide rivalidad, barreras y poder de canal antes de comprometer inversión.");
    if (data.sourceStatus !== "live") flags.push("Datos macroeconómicos incompletos o no disponibles: la puntuación se apoya más en calibración cualitativa.");

    return {
      code: country.code,
      name: country.name ?? country.code,
      data,
      calibration,
      scores: {
        market,
        resources,
        competition,
        government,
        distanceFit,
        safety,
        attractiveness,
        riskAdjusted,
        confidence: calculateConfidence(data, calibration),
      },
      entryModes: calculateEntryModes(attractiveness, safety, calibration, input.objective, input.businessModel),
      timing: recommendTiming(attractiveness, safety, calibration),
      flags,
    } satisfies CountryResult;
  });

  countries.sort((a, b) => b.scores.riskAdjusted - a.scores.riskAdjusted);
  const leader = countries[0];
  const caveats = [
    "La comparación no sustituye el análisis específico de industria, validación de clientes, regulación ni debida diligencia.",
    "Los indicadores públicos son señales de contexto; la decisión debe comprobarse con evidencia local y un caso financiero ajustado al riesgo.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    methodology: `Evaluación multicriterio basada en ambición, atractividad, riesgo, distancia y modo de entrada para el objetivo de ${labelForObjective(input.objective)}.`,
    countries,
    portfolio: {
      leadingCountry: leader?.name,
      recommendation: leader
        ? `${leader.name} lidera la comparación actual con una puntuación ajustada por riesgo de ${leader.scores.riskAdjusted}/100. El resultado es condicional a la calibración cualitativa y a los supuestos introducidos.`
        : "Añada al menos un país para construir una comparación.",
      caveats,
    },
  };
}
