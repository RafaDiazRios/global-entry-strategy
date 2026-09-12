import { jsPDF } from "jspdf";
import type { DecisionMemo } from "@shared/domain/decisionMemo";

/**
 * El memo en PDF.
 *
 * Una página, y si no cabe en una, dos. No hay tablas ni gráficos a propósito: el memo se lee
 * de arriba abajo en diez minutos y todo lo que no sea una afirmación con dueño estorba.
 *
 * El documento no compone nada por su cuenta: recibe el memo ya construido y solo lo pinta.
 * La pantalla recibe el mismo objeto, así que las dos superficies no pueden divergir.
 */

const MARGIN = 16;
const WIDTH = 210 - MARGIN * 2;

function safeFilename(value: string, fallback: string) {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || fallback;
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed <= 297 - 20) return y;
  doc.addPage();
  return 22;
}

export function buildDecisionMemoPdf(memo: DecisionMemo) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(97, 120, 108);
  doc.text(memo.title.toUpperCase(), MARGIN, 16);

  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.setTextColor(24, 60, 46);
  const subtitle = doc.splitTextToSize(memo.subtitle || memo.title, WIDTH);
  doc.text(subtitle, MARGIN, 25);
  let y = 25 + subtitle.length * 7;

  // El estado va en su propia franja: es lo único que alguien puede leer de pie.
  doc.setFillColor(238, 244, 240);
  doc.roundedRect(MARGIN, y - 4, WIDTH, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 83, 58);
  doc.text(memo.statusLabel, MARGIN + 4, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 84, 71);
  const headline = doc.splitTextToSize(memo.headline, WIDTH - 8 - doc.getTextWidth(memo.statusLabel) - 6);
  doc.text(headline[0] ?? "", MARGIN + 8 + doc.getTextWidth(memo.statusLabel), y + 3.5);
  y += 16;

  for (const section of memo.sections) {
    y = ensureSpace(doc, y, 18);
    doc.setDrawColor(206, 224, 213);
    doc.line(MARGIN, y - 3.5, 210 - MARGIN, y - 3.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(28, 79, 56);
    doc.text(section.title.toUpperCase(), MARGIN, y);
    y += 5;

    if (!section.lines.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 136, 127);
      const note = doc.splitTextToSize(section.emptyNote ?? "", WIDTH);
      doc.text(note, MARGIN, y);
      y += note.length * 3.9 + 4;
      continue;
    }

    for (const line of section.lines) {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const tone: [number, number, number] = line.tone === "alert" ? [150, 60, 50] : [38, 58, 48];
      doc.setTextColor(tone[0], tone[1], tone[2]);
      const ownerSuffix = line.owner ? `  — ${line.owner}` : "";
      const body = doc.splitTextToSize(`${line.text}${ownerSuffix}`, WIDTH);
      doc.text(body, MARGIN, y);
      y += body.length * 4.2;

      if (line.detail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.6);
        doc.setTextColor(108, 126, 117);
        const detail = doc.splitTextToSize(line.detail, WIDTH - 4);
        doc.text(detail, MARGIN + 4, y);
        y += detail.length * 3.4;
      }
      y += 2;
    }
    y += 3;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(126, 143, 133);
    const footer = doc.splitTextToSize(memo.footer, WIDTH);
    doc.text(footer, MARGIN, 297 - 14);
  }

  return doc;
}

export function downloadDecisionMemoPdf(memo: DecisionMemo) {
  const doc = buildDecisionMemoPdf(memo);
  doc.save(`${safeFilename(memo.subtitle || memo.title, "memo")}-memo.pdf`);
}
