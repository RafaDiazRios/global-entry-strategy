import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  portfolio: { leadingCountry?: string; recommendation: string; caveats: string[] };
  thresholds: Record<string, unknown>;
  countries: PdfCountry[];
};

function money(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
}

function number(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits }).format(value);
}

function safeFilename(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "analisis-entrada";
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

const thresholdLabels: Record<string, string> = {
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
};

function addHeaderFooter(doc: jsPDF, title: string) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(208, 224, 214);
    doc.line(14, 10, 196, 10);
    doc.setFontSize(7.5);
    doc.setTextColor(87, 111, 98);
    doc.text("GLOBAL ENTRY STRATEGY STUDIO", 14, 7);
    doc.text(title, 196, 7, { align: "right" });
    doc.text(`Página ${page} de ${pages}`, 196, 289, { align: "right" });
  }
}

export function buildStrategyPdf(input: PdfReportInput) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const title = input.scenarioName || "Análisis de entrada internacional";
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
  doc.text(`País base: ${input.homeCountry} · Horizonte: ${input.horizonYears} años`, 18, 103);
  doc.setFontSize(9);
  doc.setTextColor(179, 214, 194);
  doc.text(`Generado: ${new Date(input.generatedAt).toLocaleString("es-ES")}`, 18, 272);
  doc.text("Documento de apoyo a decisión. No constituye una aprobación de inversión.", 18, 281);

  doc.addPage();
  let y = 25;
  y = sectionHeading(doc, "Resumen ejecutivo", y);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 67, 49);
  doc.text(input.portfolio.leadingCountry || "Comparación completada", 14, y + 7);
  doc.setFont("helvetica", "normal");
  y = textBlock(doc, input.portfolio.recommendation, 14, y + 16, 182) + 8;

  autoTable(doc, {
    startY: y,
    head: [["Prioridad", "País", "Riesgo", "Atractivo", "Seguridad", "Acción", "Modo económico"]],
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
  y = sectionHeading(doc, "Mandato y criterio de decisión", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Empresa", input.companyName], ["Industria", input.industry], ["Modelo", input.businessModel], ["Objetivo", input.objectiveLabel], ["Horizonte", `${input.horizonYears} años`],
      ["Propuesta de valor", input.valueProposition || "No documentada"],
    ],
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [45, 72, 58] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 41, textColor: [30, 83, 58] }, 1: { cellWidth: 140 } },
  });
  y = autoTableEndY(doc, y + 30) + 9;

  y = ensureSpace(doc, y, 34);
  y = sectionHeading(doc, "Política de umbrales", y);
  const thresholdRows = Object.entries(input.thresholds).map(([key, value]) => [thresholdLabels[key] ?? key, value === null || value === undefined || value === "" ? "No restringe" : String(value)]);
  autoTable(doc, {
    startY: y,
    head: [["Parámetro", "Valor configurado"]],
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

    countryY = sectionHeading(doc, "Puntuación y lectura de entrada", countryY);
    autoTable(doc, {
      startY: countryY,
      head: [["Atractividad", "Seguridad", "Riesgo ajustado", "Confianza", "Timing"]],
      body: [[`${country.scores.attractiveness}/100`, `${country.scores.safety}/100`, `${country.scores.riskAdjusted}/100`, `${country.scores.confidence}%`, country.timing.label]],
      theme: "grid",
      headStyles: { fillColor: [46, 105, 77], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.7, halign: "center", overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 28 }, 2: { cellWidth: 34 }, 3: { cellWidth: 28 }, 4: { cellWidth: 58 } },
    });
    countryY = autoTableEndY(doc, countryY + 18) + 7;

    countryY = ensureSpace(doc, countryY, 46);
    countryY = sectionHeading(doc, "Supuestos financieros y tamaño de mercado", countryY);
    const f = country.financial;
    autoTable(doc, {
      startY: countryY,
      body: [
        ["Moneda local / reporte", `${f.localCurrency || "—"} / ${f.reportingCurrency || "—"}`],
        ["Tipo de cambio", number(f.fxRateToReportingCurrency, 4)],
        ["TAM año 1 / horizonte", `${money(f.market.tamYearOne, f.currency)} / ${money(f.market.tamAtHorizon, f.currency)}`],
        ["SAM horizonte / SOM horizonte", `${money(f.market.samAtHorizon, f.currency)} / ${money(f.market.somRevenueAtHorizon, f.currency)}`],
        ["Impuesto / capital de trabajo", `${number(f.assumptions.taxRatePct)}% / ${number(f.assumptions.workingCapitalPctRevenue)}% de ingresos`],
        ["Descuento / crecimiento terminal", `${number(f.assumptions.discountRatePct)}% / ${number(f.assumptions.terminalGrowthPct)}%`],
      ],
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 58, textColor: [30, 83, 58] }, 1: { cellWidth: 123 } },
    });
    countryY = autoTableEndY(doc, countryY + 42) + 7;

    countryY = ensureSpace(doc, countryY, 45);
    countryY = sectionHeading(doc, "Alternativas de entrada y resultado financiero", countryY);
    autoTable(doc, {
      startY: countryY,
      head: [["Alternativa", "Estado", "ROI", "NPV", "Recup.", "Inversión", "VP terminal"]],
      body: f.alternatives.map((alternative) => [
        alternative.mode, alternative.status, alternative.roiPct === null ? "—" : `${number(alternative.roiPct)}%`, money(alternative.npv, f.currency), alternative.paybackYear ? `Año ${alternative.paybackYear}` : "—", money(alternative.initialInvestment, f.currency), money(alternative.presentValueTerminal, f.currency),
      ]),
      theme: "grid",
      headStyles: { fillColor: [46, 105, 77], textColor: [255, 255, 255], fontSize: 7.2 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 }, 3: { cellWidth: 27 }, 4: { cellWidth: 18 }, 5: { cellWidth: 26 }, 6: { cellWidth: 26 } },
    });
    countryY = autoTableEndY(doc, countryY + 34) + 8;

    const selected = f.alternatives.find((alternative) => alternative.key === country.investmentRecommendation.selectedMode?.toLowerCase()) || f.alternatives.find((alternative) => alternative.mode === country.investmentRecommendation.selectedMode);
    const detailed = selected ?? f.alternatives.find((alternative) => alternative.status === "ok");
    if (detailed?.annualProjection.length) {
      countryY = ensureSpace(doc, countryY, 53);
      countryY = sectionHeading(doc, `Flujo de caja anual · ${detailed.mode}`, countryY);
      autoTable(doc, {
        startY: countryY,
        head: [["Año", "Ingresos", "EBIT", "Impuestos", "Cambio cap. trabajo", "FCF", "VP FCF"]],
        body: detailed.annualProjection.map((row) => [row.year, money(row.revenue, f.currency), money(row.operatingProfit, f.currency), money(row.taxes, f.currency), money(row.changeInWorkingCapital, f.currency), money(row.freeCashFlow, f.currency), money(row.presentValue, f.currency)]),
        theme: "grid",
        headStyles: { fillColor: [73, 130, 96], textColor: [255, 255, 255], fontSize: 7.3 },
        styles: { fontSize: 6.8, cellPadding: 1.4, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 28 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 31 }, 5: { cellWidth: 25 }, 6: { cellWidth: 25 } },
      });
      countryY = autoTableEndY(doc, countryY + 34) + 7;
    }

    countryY = ensureSpace(doc, countryY, 28);
    countryY = sectionHeading(doc, "Reglas y alertas", countryY);
    const rules = action.reasons.length ? action.reasons : ["No se han podido evaluar las reglas por falta de datos."];
    countryY = textBlock(doc, rules.map((reason) => `• ${reason}`).join("\n"), 14, countryY, 182) + 5;
    if (country.flags.length) {
      countryY = textBlock(doc, `Alertas estratégicas:\n${country.flags.map((flag) => `• ${flag}`).join("\n")}`, 14, countryY, 182, [151, 73, 53]) + 5;
    }
    if (country.entryModes.length) textBlock(doc, `Modos estratégicos sugeridos: ${country.entryModes.map((mode) => `${mode.mode} (${mode.commitment})`).join(" · ")}`, 14, countryY, 182);
  });

  doc.addPage();
  let finalY = 24;
  finalY = sectionHeading(doc, "Metodología, fuentes y límites", finalY);
  finalY = textBlock(doc, "El caso financiero usa flujos de caja libres después de impuestos y capital de trabajo, convierte importes a moneda de reporte cuando se informa un tipo de cambio y calcula el valor terminal con una perpetuidad de crecimiento. La fórmula exige que la tasa de descuento sea superior al crecimiento terminal; de lo contrario la alternativa se marca como no significativa.", 14, finalY, 182) + 7;
  finalY = textBlock(doc, "Los umbrales son reglas configurables de gobierno de inversión; no reemplazan la debida diligencia ni autorizan gasto, adquisición o entrada. ‘Avanzar’ exige superar todos los criterios de avance. ‘Probar’ admite una entrada reversible cuando supera la prueba mínima pero no el avance. ‘Descartar’ refleja que no se cumple el mínimo de prueba. ‘Completar evidencia’ se muestra cuando faltan datos o hay una incoherencia de moneda.", 14, finalY, 182) + 7;
  finalY = sectionHeading(doc, "Fuentes externas", finalY);
  finalY = textBlock(doc, "World Bank Open Data: PIB, población, crecimiento, conectividad e inversión. UNCTAD (distribuida vía World Bank Open Data): flujos netos de inversión extranjera directa. Worldwide Governance Indicators, revisión 2025: estabilidad política, efectividad gubernamental, calidad regulatoria, estado de derecho y control de corrupción.", 14, finalY, 182) + 7;
  finalY = sectionHeading(doc, "Caveats obligatorios", finalY);
  textBlock(doc, input.portfolio.caveats.map((caveat) => `• ${caveat}`).join("\n"), 14, finalY, 182, [120, 90, 28]);

  addHeaderFooter(doc, title);
  return doc;
}

export function downloadStrategyPdf(input: PdfReportInput) {
  const doc = buildStrategyPdf(input);
  const title = input.scenarioName || "Análisis de entrada internacional";
  doc.save(`${safeFilename(title)}-informe-entrada.pdf`);
}
