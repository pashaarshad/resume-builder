"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload, FiClipboard } from "react-icons/fi";

interface UploadResumeProps {
  onTextExtracted: (text: string) => void;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt", ".text"]
};

export function UploadResume({ onTextExtracted }: UploadResumeProps) {
  const [status, setStatus] = useState<string>("");

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setStatus(`Reading ${file.name}...`);
        const text = await extractTextFromFile(file);
        onTextExtracted(text);
        setStatus(`Loaded ${file.name}`);
      } catch (error) {
        console.error(error);
        setStatus("Sorry, unable to read that file.");
      }
    },
    [onTextExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    multiple: false
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps({
          className:
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition hover:border-sky-500"
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-sm">
          <FiUpload className="h-6 w-6 text-sky-500" />
          {isDragActive ? (
            <p>Drop the resume here...</p>
          ) : (
            <p>Drag and drop a PDF, DOCX, or TXT resume, or click to browse.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-500"
        onClick={async () => {
          const pasted = window.prompt("Paste resume text");
          if (pasted) {
            onTextExtracted(pasted);
            setStatus("Loaded pasted text.");
          }
        }}
      >
        <FiClipboard /> Paste resume text
      </button>

      {status && <p className="text-xs text-slate-500">{status}</p>}
    </div>
  );
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { default: mammoth } = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (file.type === "application/pdf") {
    const pdfBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist/build/pdf");
    const workerSrc = await import("pdfjs-dist/build/pdf.worker.min.js?url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc.default;

    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ");
      pages.push(text);
    }
    return pages.join("\n\n");
  }

  return file.text();
}
