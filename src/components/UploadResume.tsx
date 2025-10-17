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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setSelectedFile(file);

      try {
        setIsLoading(true);
        setStatus(`📄 Processing ${file.name}...`);
        const text = await extractTextFromFile(file);
        onTextExtracted(text);
        setStatus(`✅ Resume loaded successfully! Ready to analyze.`);
      } catch (error) {
        console.error("File processing error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unable to read that file";
        setStatus(`❌ Error: ${errorMessage}`);
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
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
          className: `border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? "border-sky-500 bg-sky-50" 
              : isLoading 
              ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
              : "border-gray-300 hover:border-sky-500 hover:bg-sky-50"
          }`
        })}
      >
        <input {...getInputProps()} disabled={isLoading} />
        <div className="flex flex-col items-center gap-3 text-sm">
          <div className="flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            ) : selectedFile ? (
              <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
                <span className="text-green-600">✓</span>
                <span className="text-green-700 font-medium">File Ready</span>
              </div>
            ) : (
              <FiUpload className={`h-8 w-8 ${isDragActive ? "text-sky-600" : "text-sky-500"}`} />
            )}
          </div>
          
          {isDragActive ? (
            <div className="text-center">
              <p className="text-sky-700 font-semibold">🎯 Drop your resume here!</p>
              <p className="text-xs text-sky-600 mt-1">Release to upload</p>
            </div>
          ) : isLoading ? (
            <div className="text-center">
              <p className="text-gray-700 font-medium">Processing your resume...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
            </div>
          ) : selectedFile ? (
            <div className="text-center">
              <p className="text-green-800 font-semibold">� {selectedFile.name}</p>
              <p className="text-xs text-green-600 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[1].toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click here to select a different file
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-700 font-medium">📁 Upload Your Resume</p>
              <p className="text-sm text-gray-600 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2 px-4">
                <span className="inline-flex items-center gap-1">
                  <span>📄 PDF</span> • <span>📝 DOCX</span> • <span>📋 TXT</span>
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow transition-colors ${
          isLoading 
            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
            : "bg-sky-600 text-white hover:bg-sky-500"
        }`}
        onClick={async () => {
          if (isLoading) return;
          const pasted = window.prompt("Paste resume text");
          if (pasted && pasted.trim()) {
            setSelectedFile(null);
            onTextExtracted(pasted);
            setStatus("✅ Resume text loaded successfully! Ready to analyze.");
          }
        }}
      >
        <FiClipboard /> Paste resume text
      </button>

      {status && (
        <div className={`text-xs p-2 rounded ${
          status.includes("✅") 
            ? "text-green-700 bg-green-50 border border-green-200" 
            : status.includes("❌") 
            ? "text-red-700 bg-red-50 border border-red-200"
            : "text-slate-600 bg-slate-50 border border-slate-200"
        }`}>
          {status}
        </div>
      )}
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
    try {
      const pdfBuffer = await file.arrayBuffer();
      
      // Dynamic import for older stable version
      const pdfjsLib = await import("pdfjs-dist");
      
      // Configure worker source for version 2.16.105
      if (typeof window !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      }
      
      const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const pages: string[] = [];
      
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        pages.push(text);
      }
      
      return pages.join("\n\n");
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error("Failed to parse PDF. Please try converting it to text format or copy-paste the text.");
    }
  }

  return file.text();
}
