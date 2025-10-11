import html2pdf from "html2pdf.js";

export interface PdfExportOptions {
  filename?: string;
  margin?: number;
}

export async function exportElementToPdf(element: HTMLElement, options: PdfExportOptions = {}): Promise<void> {
  const { filename = "resume.pdf", margin = 0.5 } = options;

  await html2pdf()
    .set({
      margin,
      filename,
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    })
    .from(element)
    .save();
}
