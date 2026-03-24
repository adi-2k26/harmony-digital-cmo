/**
 * Competitive benchmark chart export (PNG downloads + jsPDF appendix).
 * Kept separate from UI components for easier testing and reuse.
 */
import type { jsPDF } from "jspdf";
import type { BenchmarkChartImages } from "./benchmarkTypes";

const PNG_STAGGER_MS = [0, 250, 500] as const;

/** Triggers three browser downloads (same timing as before — avoids popup blockers). */
export function downloadBenchmarkChartsAsPngs(imgs: BenchmarkChartImages, stampPrefix: string): void {
  const trigger = (filename: string, dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.png`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const files: [string, keyof BenchmarkChartImages][] = [
    [`${stampPrefix}-01-radar-all-brands`, "radar"],
    [`${stampPrefix}-02-bar-by-criterion`, "bar"],
    [`${stampPrefix}-03-heatmap-brand-criterion`, "heatmap"],
  ];

  files.forEach(([name, key], i) => {
    const dataUrl = imgs[key];
    const delay = PNG_STAGGER_MS[i] ?? 0;
    if (delay === 0) {
      trigger(name, dataUrl);
    } else {
      window.setTimeout(() => trigger(name, dataUrl), delay);
    }
  });
}

type PdfPalette = {
  rose: readonly [number, number, number];
  muted: readonly [number, number, number];
  textColor: readonly [number, number, number];
};

type PdfLayout = {
  margin: number;
  contentWidth: number;
  pageHeight: number;
};

/** Appends a new page with radar / bar / heatmap images (matches previous inline behavior). */
export function appendBenchmarkChartsPdfAppendix(
  doc: jsPDF,
  imgs: BenchmarkChartImages,
  layout: PdfLayout,
  colors: PdfPalette
): void {
  const { margin, contentWidth, pageHeight } = layout;
  const { rose, muted, textColor } = colors;

  doc.addPage();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(rose[0], rose[1], rose[2]);
  doc.text("Competitive benchmark charts", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Radar, grouped bar, and heatmap (same as on screen).", margin, y);
  y += 28;

  const imgW = contentWidth;
  const imgH = 200;
  const sections: [string, string][] = [
    ["1. Radar — all brands", imgs.radar],
    ["2. Grouped bar — criteria by brand", imgs.bar],
    ["3. Heatmap — brand × criterion", imgs.heatmap],
  ];

  for (const [label, dataUrl] of sections) {
    if (y + imgH + 40 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(label, margin, y);
    y += 16;
    doc.addImage(dataUrl, "PNG", margin, y, imgW, imgH);
    y += imgH + 20;
  }
}
