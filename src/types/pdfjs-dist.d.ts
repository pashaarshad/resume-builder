declare module "pdfjs-dist" {
  interface TextItem {
    str: string;
  }

  interface TextContent {
    items: TextItem[];
  }

  interface Page {
    getTextContent(): Promise<TextContent>;
  }

  interface PdfDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<Page>;
  }

  interface GlobalWorkerOptionsType {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptionsType;
  export function getDocument(params: { data: ArrayBuffer }): { promise: Promise<PdfDocument> };
}
