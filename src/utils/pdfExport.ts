export interface PdfExportOptions {
  filename?: string;
  margin?: number;
}

export async function exportElementToPdf(element: HTMLElement, options: PdfExportOptions = {}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser.");
  }

  const { default: html2pdf } = await import("html2pdf.js");
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
