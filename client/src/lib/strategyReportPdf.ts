import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Lang } from "@shared/i18n";

/**
 * El informe se imprime en un idioma, no en dos: un PDF no tiene conmutador. Quien lo genera
 * elige, y todo lo que viene del dominio llega ya resuelto a ese idioma desde la pantalla.
 * Lo que queda aquí es el armazón del documento —encabezados, cabeceras de tabla, notas de
 * método— que es propio del informe y por eso vive aquí y no en `shared/domain`.
 */
const PDF_STRINGS = {
  es: {
    defaultTitle: "Análisis de entrada internacional",
    filenameFallback: "analisis-entrada",
    filenameSuffix: "informe-entrada",
    locale: "es-ES",
    page: "Página",
    pageOf: "de",
    homeCountry: "País base",
    horizon: "Horizonte",
    years: "años",
    generated: "Generado",
    coverDisclaimer: "Documento de apoyo a decisión. No constituye una aprobación de inversión.",
    executiveSummary: "Resumen ejecutivo",
    comparisonDone: "Comparación completada",
    thPriority: "Prioridad",
    thCountry: "País",
    thRisk: "Riesgo",
    thAttractiveness: "Atractivo",
    thSafety: "Seguridad",
    thAction: "Acción",
    thEconomicMode: "Modo económico",
    mandate: "Mandato y criterio de decisión",
    company: "Empresa",
    industry: "Industria",
    model: "Modelo",
    objective: "Objetivo",
    valueProposition: "Propuesta de valor",
    notDocumented: "No documentada",
    thresholdPolicy: "Política de umbrales",
    thParameter: "Parámetro",
    thConfigured: "Valor configurado",
    unconstrained: "No restringe",
    scoreReading: "Puntuación y lectura de entrada",
    thConfidence: "Confianza",
    thTiming: "Timing",
    assumptionsSection: "Supuestos financieros y tamaño de mercado",
    localReportingCurrency: "Moneda local / reporte",
    exchangeRate: "Tipo de cambio",
    tamYearOneHorizon: "TAM año 1 / horizonte",
    samSomHorizon: "SAM horizonte / SOM horizonte",
    taxWorkingCapital: "Impuesto / capital de trabajo",
    ofRevenue: "de ingresos",
    discountTerminal: "Descuento / crecimiento terminal",
    alternativesSection: "Alternativas de entrada y resultado financiero",
    thAlternative: "Alternativa",
    thStatus: "Estado",
    thNpv: "NPV",
    thPayback: "Recup.",
    thInvestment: "Inversión",
    thTerminalPv: "VP terminal",
    year: "Año",
    sensitivitySection: "Sensibilidad de precio, margen y FX",
    thCase: "Caso",
    thPriceRevenue: "Precio / ingreso",
    thMargin: "Margen",
    thNpvAlternative: "NPV alternativa",
    thRoiAlternative: "ROI alternativa",
    points: "p.p.",
    complete: "Completar",
    notMeaningful: "No significativo",
    cashFlowSection: "Flujo de caja anual",
    thRevenue: "Ingresos",
    thTaxes: "Impuestos",
    thWorkingCapitalChange: "Cambio cap. trabajo",
    rulesSection: "Reglas y alertas",
    noRules: "No se han podido evaluar las reglas por falta de datos.",
    strategicAlerts: "Alertas estratégicas",
    suggestedModes: "Modos estratégicos sugeridos",
    methodologySection: "Metodología, fuentes y límites",
    methodologyOne: "El caso financiero usa flujos de caja libres después de impuestos y capital de trabajo, convierte importes a moneda de reporte cuando se informa un tipo de cambio y calcula el valor terminal con una perpetuidad de crecimiento. La fórmula exige que la tasa de descuento sea superior al crecimiento terminal; de lo contrario la alternativa se marca como no significativa.",
    methodologyTwo: "Los umbrales son reglas configurables de gobierno de inversión; no reemplazan la debida diligencia ni autorizan gasto, adquisición o entrada. ‘Avanzar’ exige superar todos los criterios de avance. ‘Probar’ admite una entrada reversible cuando supera la prueba mínima pero no el avance. ‘Descartar’ refleja que no se cumple el mínimo de prueba. ‘Completar evidencia’ se muestra cuando faltan datos o hay una incoherencia de moneda.",
    sourcesSection: "Fuentes externas",
    sourcesText: "World Bank Open Data: PIB, población, crecimiento, conectividad e inversión. UNCTAD (distribuida vía World Bank Open Data): flujos netos de inversión extranjera directa. Worldwide Governance Indicators, revisión 2025: estabilidad política, efectividad gubernamental, calidad regulatoria, estado de derecho y control de corrupción. Tax Foundation, Corporate Tax Rates Around the World 2025: tasa corporativa estatutaria estándar, editable. Frankfurter: tipo de cambio de referencia de bancos centrales, editable y no ejecutable.",
    caveatsSection: "Caveats obligatorios",
    thresholds: {
      currency: "Moneda de umbrales",
      advanceMinRiskAdjusted: "Riesgo ajustado mínimo · avanzar",
      testMinRiskAdjusted: "Riesgo ajustado mínimo · probar",
      minConfidence: "Confianza mínima de evidencia",
      advanceMinNpv: "NPV mínimo · avanzar",
      testMinNpv: "NPV mínimo · probar",
      advanceMinRoiPct: "ROI mínimo · avanzar",
      testMinRoiPct: "ROI mínimo · probar",
      advanceMaxPaybackYears: "Recuperación máxima · avanzar",
      testMaxInitialInvestment: "Inversión máxima · prueba",
    } as Record<string, string>,
  },
  en: {
    defaultTitle: "International entry analysis",
    filenameFallback: "entry-analysis",
    filenameSuffix: "entry-report",
    locale: "en-GB",
    page: "Page",
    pageOf: "of",
    homeCountry: "Home country",
    horizon: "Horizon",
    years: "years",
    generated: "Generated",
    coverDisclaimer: "A document to support a decision. It is not an investment approval.",
    executiveSummary: "Executive summary",
    comparisonDone: "Comparison complete",
    thPriority: "Priority",
    thCountry: "Country",
    thRisk: "Risk",
    thAttractiveness: "Attractiveness",
    thSafety: "Safety",
    thAction: "Action",
    thEconomicMode: "Economic mode",
    mandate: "Mandate and decision criterion",
    company: "Company",
    industry: "Industry",
    model: "Model",
    objective: "Objective",
    valueProposition: "Value proposition",
    notDocumented: "Not documented",
    thresholdPolicy: "Threshold policy",
    thParameter: "Parameter",
    thConfigured: "Value configured",
    unconstrained: "No constraint",
    scoreReading: "Score and entry reading",
    thConfidence: "Confidence",
    thTiming: "Timing",
    assumptionsSection: "Financial assumptions and market size",
    localReportingCurrency: "Local / reporting currency",
    exchangeRate: "Exchange rate",
    tamYearOneHorizon: "TAM year 1 / horizon",
    samSomHorizon: "SAM horizon / SOM horizon",
    taxWorkingCapital: "Tax / working capital",
    ofRevenue: "of revenue",
    discountTerminal: "Discount / terminal growth",
    alternativesSection: "Entry alternatives and financial outcome",
    thAlternative: "Alternative",
    thStatus: "Status",
    thNpv: "NPV",
    thPayback: "Payback",
    thInvestment: "Investment",
    thTerminalPv: "Terminal PV",
    year: "Year",
    sensitivitySection: "Sensitivity to price, margin and FX",
    thCase: "Case",
    thPriceRevenue: "Price / revenue",
    thMargin: "Margin",
    thNpvAlternative: "Alternative NPV",
    thRoiAlternative: "Alternative ROI",
    points: "pp",
    complete: "Complete it",
    notMeaningful: "Not meaningful",
    cashFlowSection: "Annual cash flow",
    thRevenue: "Revenue",
    thTaxes: "Taxes",
    thWorkingCapitalChange: "Change in working capital",
    rulesSection: "Rules and alerts",
    noRules: "The rules could not be evaluated for lack of data.",
    strategicAlerts: "Strategic alerts",
    suggestedModes: "Suggested strategic modes",
    methodologySection: "Methodology, sources and limits",
    methodologyOne: "The financial case uses free cash flow after tax and working capital, converts amounts into the reporting currency when an exchange rate is given, and computes terminal value as a growing perpetuity. The formula requires the discount rate to exceed terminal growth; otherwise the alternative is marked as not meaningful.",
    methodologyTwo: "The thresholds are configurable investment governance rules; they do not replace due diligence and they authorise no spending, acquisition or entry. ‘Advance’ requires clearing every advance criterion. ‘Test’ allows a reversible entry when the minimum test is met but the advance criteria are not. ‘Discard’ reflects that the minimum test is not met. ‘Complete the evidence’ appears when data is missing or there is a currency inconsistency.",
    sourcesSection: "External sources",
    sourcesText: "World Bank Open Data: GDP, population, growth, connectivity and investment. UNCTAD (distributed through World Bank Open Data): net foreign direct investment flows. Worldwide Governance Indicators, 2025 revision: political stability, government effectiveness, regulatory quality, rule of law and control of corruption. Tax Foundation, Corporate Tax Rates Around the World 2025: standard statutory corporate rate, editable. Frankfurter: reference exchange rate from central banks, editable and not executable.",
    caveatsSection: "Mandatory caveats",
    thresholds: {
      currency: "Threshold currency",
      advanceMinRiskAdjusted: "Minimum risk-adjusted score · advance",
      testMinRiskAdjusted: "Minimum risk-adjusted score · test",
      minConfidence: "Minimum evidence confidence",
      advanceMinNpv: "Minimum NPV · advance",
      testMinNpv: "Minimum NPV · test",
      advanceMinRoiPct: "Minimum ROI · advance",
      testMinRoiPct: "Minimum ROI · test",
      advanceMaxPaybackYears: "Maximum payback · advance",
      testMaxInitialInvestment: "Maximum investment · test",
    } as Record<string, string>,
  },
} as const;

type PdfStrings = (typeof PDF_STRINGS)[Lang];

export type PdfAlternative = {
  key: string;
  mode: string;
  status: string;
  roiPct: number | null;
  npv: number | null;
  paybackYear: number | null;
  initialInvestment: number | null;
  annualOperatingCost: number | null;
  revenueCapturePct: number | null;
  cumulativeFreeCashFlow: number | null;
  terminalValue: number | null;
  presentValueTerminal: number | null;
  annualProjection: { year: number; revenue: number; operatingProfit: number; taxes: number; changeInWorkingCapital: number; freeCashFlow: number; presentValue: number }[];
  missingInputs: string[];
};

export type PdfScenario = {
  key: "base" | "optimistic" | "conservative";
  label: string;
  priceRevenuePct: number | null;
  operatingMarginPctPoints: number | null;
  fxRatePct: number | null;
  status: string;
  financial: {
    currency: string | null;
    alternatives: PdfAlternative[];
  } | null;
  missingInputs: string[];
  note: string;
};

export type PdfCountry = {
  code: string;
  name: string;
  scores: { attractiveness: number; safety: number; riskAdjusted: number; confidence: number };
  timing: { label: string; description: string };
  flags: string[];
  entryModes: { mode: string; commitment: string; rationale: string }[];
  investmentRecommendation: { action: string; label: string; summary: string; selectedMode: string | null; reasons: string[] };
  financial: {
    status: string;
    currency: string | null;
    localCurrency: string | null;
    reportingCurrency: string | null;
    fxRateToReportingCurrency: number | null;
    horizonYears: number;
    assumptions: { taxRatePct: number | null; workingCapitalPctRevenue: number | null; discountRatePct: number | null; terminalGrowthPct: number | null };
    market: { tamYearOne: number | null; tamAtHorizon: number | null; samAtHorizon: number | null; somRevenueYearOne: number | null; somRevenueAtHorizon: number | null };
    alternatives: PdfAlternative[];
    scenarios: PdfScenario[];
    missingInputs: string[];
    methodology: string;
  };
};

export type PdfReportInput = {
  scenarioName: string;
  companyName: string;
  homeCountry: string;
  industry: string;
  businessModel: string;
  valueProposition: string;
  objectiveLabel: string;
  horizonYears: string;
  generatedAt: string;
  /** Idioma del informe. Todo lo que llega ya viene resuelto a él. */
  lang: Lang;
  portfolio: { leadingCountry?: string; recommendation: string; caveats: string[] };
  thresholds: Record<string, unknown>;
  countries: PdfCountry[];
};

function money(value: number | null | undefined, locale: string, currency?: string | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
}

function number(value: number | null | undefined, locale: string, digits = 1) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

function safeFilename(value: string, fallback: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || fallback;
}

function autoTableEndY(doc: jsPDF, fallback: number) {
  return (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 18) return y;
  doc.addPage();
  return 22;
}

function textBlock(doc: jsPDF, text: string, x: number, y: number, width: number, color: [number, number, number] = [63, 83, 72]) {
  doc.setFontSize(9);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * 4.3;
}

function sectionHeading(doc: jsPDF, title: string, y: number) {
  doc.setDrawColor(197, 219, 205);
  doc.line(14, y - 4, 196, y - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 76, 53);
  doc.text(title.toUpperCase(), 14, y);
  doc.setFont("helvetica", "normal");
  return y + 7;
}

function actionColor(action: string): [number, number, number] {
  if (action === "advance") return [37, 117, 82];
  if (action === "test") return [162, 112, 22];
  if (action === "discard") return [166, 65, 62];
  return [91, 105, 96];
}

function addHeaderFooter(doc: jsPDF, title: string, text: PdfStrings) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(208, 224, 214);
    doc.line(14, 10, 196, 10);
    doc.setFontSize(7.5);
    doc.setTextColor(87, 111, 98);
    doc.text("GLOBAL ENTRY STRATEGY STUDIO", 14, 7);
    doc.text(title, 196, 7, { align: "right" });
    doc.text(`${text.page} ${page} ${text.pageOf} ${pages}`, 196, 289, { align: "right" });
  }
}

export function buildStrategyPdf(input: PdfReportInput) {
  const text = PDF_STRINGS[input.lang];
  const locale = text.locale;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const title = input.scenarioName || text.defaultTitle;
  doc.setFillColor(16, 61, 43);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(175, 232, 198);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("GLOBAL ENTRY STRATEGY STUDIO", 18, 32);
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text(doc.splitTextToSize(title, 160), 18, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(220, 239, 228);
  doc.text(`${input.companyName} · ${input.industry}`, 18, 95);
  doc.text(`${text.homeCountry}: ${input.homeCountry} · ${text.horizon}: ${input.horizonYears} ${text.years}`, 18, 103);
  doc.setFontSize(9);
  doc.setTextColor(179, 214, 194);
  doc.text(`${text.generated}: ${new Date(input.generatedAt).toLocaleString(locale)}`, 18, 272);
  doc.text(text.coverDisclaimer, 18, 281);

  doc.addPage();
  let y = 25;
  y = sectionHeading(doc, text.executiveSummary, y);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 67, 49);
  doc.text(input.portfolio.leadingCountry || text.comparisonDone, 14, y + 7);
  doc.setFont("helvetica", "normal");
  y = textBlock(doc, input.portfolio.recommendation, 14, y + 16, 182) + 8;

  autoTable(doc, {
    startY: y,
    head: [[text.thPriority, text.thCountry, text.thRisk, text.thAttractiveness, text.thSafety, text.thAction, text.thEconomicMode]],
    body: input.countries.map((country, index) => [
      `${index + 1}`,
      country.name,
      `${country.scores.riskAdjusted}/100`,
      `${country.scores.attractiveness}/100`,
      `${country.scores.safety}/100`,
      country.investmentRecommendation.label,
      country.investmentRecommendation.selectedMode || "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [21, 83, 57], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.6, cellPadding: 1.8, textColor: [45, 72, 58], overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 31 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 22 }, 6: { cellWidth: 47 } },
    alternateRowStyles: { fillColor: [245, 250, 246] },
  });
  y = autoTableEndY(doc, y + 38) + 10;

  y = ensureSpace(doc, y, 34);
  y = sectionHeading(doc, text.mandate, y);
  autoTable(doc, {
    startY: y,
    body: [
      [text.company, input.companyName], [text.industry, input.industry], [text.model, input.businessModel], [text.objective, input.objectiveLabel], [text.horizon, `${input.horizonYears} ${text.years}`],
      [text.valueProposition, input.valueProposition || text.notDocumented],
    ],
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [45, 72, 58] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 41, textColor: [30, 83, 58] }, 1: { cellWidth: 140 } },
  });
  y = autoTableEndY(doc, y + 30) + 9;

  y = ensureSpace(doc, y, 34);
  y = sectionHeading(doc, text.thresholdPolicy, y);
  const thresholdRows = Object.entries(input.thresholds).map(([key, value]) => [text.thresholds[key] ?? key, value === null || value === undefined || value === "" ? text.unconstrained : String(value)]);
  autoTable(doc, {
    startY: y,
    head: [[text.thParameter, text.thConfigured]],
    body: thresholdRows,
    theme: "grid",
    headStyles: { fillColor: [51, 112, 82], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 88 } },
  });

  input.countries.forEach((country) => {
    doc.addPage();
    let countryY = 24;
    doc.setFont("times", "bold");
    doc.setFontSize(21);
    doc.setTextColor(25, 72, 50);
    doc.text(`${country.name} (${country.code})`, 14, countryY);
    countryY += 10;
    const action = country.investmentRecommendation;
    doc.setFillColor(...actionColor(action.action));
    doc.roundedRect(14, countryY, 46, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(action.label.toUpperCase(), 37, countryY + 5.3, { align: "center" });
    doc.setFont("helvetica", "normal");
    countryY = textBlock(doc, action.summary, 66, countryY + 5, 130) + 8;

    countryY = sectionHeading(doc, text.scoreReading, countryY);
    autoTable(doc, {
      startY: countryY,
      head: [[text.thAttractiveness, text.thSafety, text.thRisk, text.thConfidence, text.thTiming]],
      body: [[`${country.scores.attractiveness}/100`, `${country.scores.safety}/100`, `${country.scores.riskAdjusted}/100`, `${country.scores.confidence}%`, country.timing.label]],
      theme: "grid",
      headStyles: { fillColor: [46, 105, 77], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.7, halign: "center", overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 28 }, 2: { cellWidth: 34 }, 3: { cellWidth: 28 }, 4: { cellWidth: 58 } },
    });
    countryY = autoTableEndY(doc, countryY + 18) + 7;

    countryY = ensureSpace(doc, countryY, 46);
    countryY = sectionHeading(doc, text.assumptionsSection, countryY);
    const f = country.financial;
    autoTable(doc, {
      startY: countryY,
      body: [
        [text.localReportingCurrency, `${f.localCurrency || "—"} / ${f.reportingCurrency || "—"}`],
        [text.exchangeRate, number(f.fxRateToReportingCurrency, locale, 4)],
        [text.tamYearOneHorizon, `${money(f.market.tamYearOne, locale, f.currency)} / ${money(f.market.tamAtHorizon, locale, f.currency)}`],
        [text.samSomHorizon, `${money(f.market.samAtHorizon, locale, f.currency)} / ${money(f.market.somRevenueAtHorizon, locale, f.currency)}`],
        [text.taxWorkingCapital, `${number(f.assumptions.taxRatePct, locale)}% / ${number(f.assumptions.workingCapitalPctRevenue, locale)}% ${text.ofRevenue}`],
        [text.discountTerminal, `${number(f.assumptions.discountRatePct, locale)}% / ${number(f.assumptions.terminalGrowthPct, locale)}%`],
      ],
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 58, textColor: [30, 83, 58] }, 1: { cellWidth: 123 } },
    });
    countryY = autoTableEndY(doc, countryY + 42) + 7;

    countryY = ensureSpace(doc, countryY, 45);
    countryY = sectionHeading(doc, text.alternativesSection, countryY);
    autoTable(doc, {
      startY: countryY,
      head: [[text.thAlternative, text.thStatus, "ROI", text.thNpv, text.thPayback, text.thInvestment, text.thTerminalPv]],
      body: f.alternatives.map((alternative) => [
        alternative.mode, alternative.status, alternative.roiPct === null ? "—" : `${number(alternative.roiPct, locale)}%`, money(alternative.npv, locale, f.currency), alternative.paybackYear ? `${text.year} ${alternative.paybackYear}` : "—", money(alternative.initialInvestment, locale, f.currency), money(alternative.presentValueTerminal, locale, f.currency),
      ]),
      theme: "grid",
      headStyles: { fillColor: [46, 105, 77], textColor: [255, 255, 255], fontSize: 7.2 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 }, 3: { cellWidth: 27 }, 4: { cellWidth: 18 }, 5: { cellWidth: 26 }, 6: { cellWidth: 26 } },
    });
    countryY = autoTableEndY(doc, countryY + 34) + 8;

    countryY = ensureSpace(doc, countryY, 42);
    countryY = sectionHeading(doc, text.sensitivitySection, countryY);
    autoTable(doc, {
      startY: countryY,
      head: [[text.thCase, text.thPriceRevenue, text.thMargin, "FX", text.thNpvAlternative, text.thRoiAlternative]],
      body: f.scenarios.map((scenario) => {
        const alternative = scenario.financial?.alternatives.find((item) => item.mode === country.investmentRecommendation.selectedMode) ?? scenario.financial?.alternatives.find((item) => item.status === "ok");
        return [scenario.label, scenario.priceRevenuePct === null ? "—" : `${number(scenario.priceRevenuePct, locale)}%`, scenario.operatingMarginPctPoints === null ? "—" : `${number(scenario.operatingMarginPctPoints, locale)} ${text.points}`, scenario.fxRatePct === null ? "—" : `${number(scenario.fxRatePct, locale)}%`, alternative ? money(alternative.npv, locale, scenario.financial?.currency) : scenario.status === "insufficient_data" ? text.complete : text.notMeaningful, alternative?.roiPct === null || alternative?.roiPct === undefined ? "—" : `${number(alternative.roiPct, locale)}%`];
      }),
      theme: "grid",
      headStyles: { fillColor: [53, 111, 82], textColor: [255, 255, 255], fontSize: 7.4 },
      styles: { fontSize: 7.1, cellPadding: 1.6, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 31 }, 2: { cellWidth: 25 }, 3: { cellWidth: 20 }, 4: { cellWidth: 42 }, 5: { cellWidth: 32 } },
      alternateRowStyles: { fillColor: [245, 250, 246] },
    });
    countryY = autoTableEndY(doc, countryY + 30) + 8;

    const selected = f.alternatives.find((alternative) => alternative.key === country.investmentRecommendation.selectedMode?.toLowerCase()) || f.alternatives.find((alternative) => alternative.mode === country.investmentRecommendation.selectedMode);
    const detailed = selected ?? f.alternatives.find((alternative) => alternative.status === "ok");
    if (detailed?.annualProjection.length) {
      countryY = ensureSpace(doc, countryY, 53);
      countryY = sectionHeading(doc, `${text.cashFlowSection} · ${detailed.mode}`, countryY);
      autoTable(doc, {
        startY: countryY,
        head: [[text.year, text.thRevenue, "EBIT", text.thTaxes, text.thWorkingCapitalChange, "FCF", "VP FCF"]],
        body: detailed.annualProjection.map((row) => [row.year, money(row.revenue, locale, f.currency), money(row.operatingProfit, locale, f.currency), money(row.taxes, locale, f.currency), money(row.changeInWorkingCapital, locale, f.currency), money(row.freeCashFlow, locale, f.currency), money(row.presentValue, locale, f.currency)]),
        theme: "grid",
        headStyles: { fillColor: [73, 130, 96], textColor: [255, 255, 255], fontSize: 7.3 },
        styles: { fontSize: 6.8, cellPadding: 1.4, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 28 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 31 }, 5: { cellWidth: 25 }, 6: { cellWidth: 25 } },
      });
      countryY = autoTableEndY(doc, countryY + 34) + 7;
    }

    countryY = ensureSpace(doc, countryY, 28);
    countryY = sectionHeading(doc, text.rulesSection, countryY);
    const rules = action.reasons.length ? action.reasons : [text.noRules];
    countryY = textBlock(doc, rules.map((reason) => `• ${reason}`).join("\n"), 14, countryY, 182) + 5;
    if (country.flags.length) {
      countryY = textBlock(doc, `${text.strategicAlerts}:\n${country.flags.map((flag) => `• ${flag}`).join("\n")}`, 14, countryY, 182, [151, 73, 53]) + 5;
    }
    if (country.entryModes.length) textBlock(doc, `${text.suggestedModes}: ${country.entryModes.map((mode) => `${mode.mode} (${mode.commitment})`).join(" · ")}`, 14, countryY, 182);
  });

  doc.addPage();
  let finalY = 24;
  finalY = sectionHeading(doc, text.methodologySection, finalY);
  finalY = textBlock(doc, text.methodologyOne, 14, finalY, 182) + 7;
  finalY = textBlock(doc, text.methodologyTwo, 14, finalY, 182) + 7;
  finalY = sectionHeading(doc, text.sourcesSection, finalY);
  finalY = textBlock(doc, text.sourcesText, 14, finalY, 182) + 7;
  finalY = sectionHeading(doc, text.caveatsSection, finalY);
  textBlock(doc, input.portfolio.caveats.map((caveat) => `• ${caveat}`).join("\n"), 14, finalY, 182, [120, 90, 28]);

  addHeaderFooter(doc, title, text);
  return doc;
}

export function downloadStrategyPdf(input: PdfReportInput) {
  const text = PDF_STRINGS[input.lang];
  const doc = buildStrategyPdf(input);
  const title = input.scenarioName || text.defaultTitle;
  doc.save(`${safeFilename(title, text.filenameFallback)}-${text.filenameSuffix}.pdf`);
}
