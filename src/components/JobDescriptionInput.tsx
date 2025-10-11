"use client";

import { useMemo } from "react";
import nlp from "compromise";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeywordsExtracted: (keywords: string[]) => void;
}

export function JobDescriptionInput({ value, onChange, onKeywordsExtracted }: JobDescriptionInputProps) {
  const keywordList = useMemo(() => extractKeywords(value), [value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Job description</label>
      <textarea
        value={value}
        onChange={(event) => {
          const text = event.target.value;
          onChange(text);
          onKeywordsExtracted(extractKeywords(text));
        }}
        className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
        rows={10}
        placeholder="Paste the job description here..."
      />

      {keywordList.length > 0 && (
        <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700">Top keywords</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {keywordList.slice(0, 15).map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-2 py-1 capitalize text-sky-700 shadow">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const doc = nlp(text);
  const terms = new Set<string>();
  doc
    .nouns()
    .toLowerCase()
    .out("array")
    .forEach((word: string) => {
      if (word.length > 2) terms.add(word);
    });
  doc
    .verbs()
    .toLowerCase()
    .out("array")
    .forEach((word: string) => {
      if (word.length > 2) terms.add(word);
    });
  return Array.from(terms).sort();
}
