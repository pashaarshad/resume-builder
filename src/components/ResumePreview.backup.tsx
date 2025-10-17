"use client";

import { forwardRef, useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { RichTextEditor } from "./RichTextEditor";
import type { ResumeJson, ExperienceEntry, EducationEntry } from "@/lib/parser";

interface ResumePreviewProps {
  resume: ResumeJson;
  highlightedBullets: Set<string>;
  onResumeUpdate?: (resume: ResumeJson) => void;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(function ResumePreview(
  { resume, highlightedBullets, onResumeUpdate },
  ref
) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [currentEditField, setCurrentEditField] = useState<string>("");

  const handleOpenEditor = (field: string, content: string, title: string) => {
    setCurrentEditField(field);
    setEditorContent(content);
    setEditorTitle(title);
    setEditorOpen(true);
  };

  const handleSaveEditor = (content: string) => {
    if (!onResumeUpdate) return;
    
    const updatedResume = { ...resume };
    
    if (currentEditField === "summary") {
      updatedResume.summary = content;
    } else if (currentEditField === "name") {
      updatedResume.contact.name = content;
    } else if (currentEditField.startsWith("experience-")) {
      const index = parseInt(currentEditField.split("-")[1]);
      if (updatedResume.experience[index]) {
        updatedResume.experience[index].title = content;
      }
    }
    
    onResumeUpdate(updatedResume);
  };

  const EditButton = ({ onClick, className = "" }: { onClick: () => void, className?: string }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-600 rounded border border-sky-200 transition-colors ${className}`}
    >
      <FiEdit2 className="w-3 h-3" />
      Edit
    </button>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Edit Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">📄 Resume Preview</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiEdit2 className="w-3 h-3" />
            Click "Edit" buttons to modify sections
          </div>
        </div>
      
      <div ref={ref} className="space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">{resume.contact.name || "Your Name"}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          {resume.contact.email && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">✉</span>
              {resume.contact.email}
            </span>
          )}
          {resume.contact.phone && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">☎</span>
              {resume.contact.phone}
            </span>
          )}
          {resume.contact.location && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400">📍</span>
              {resume.contact.location}
            </span>
          )}
        </div>
        {resume.contact.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-sky-600">
            {resume.contact.links.map((link) => (
              <a key={link} href={link} className="hover:underline" target="_blank" rel="noopener noreferrer">
                🔗 {link}
              </a>
            ))}
          </div>
        )}
      </header>

      {resume.summary && (
        <section>
          <SectionHeading title="Professional Summary" />
          <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <SectionHeading title="Skills" />
          <div className="mt-2 flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="space-y-5">
          <SectionHeading title="Professional Experience" />
          {resume.experience.map((entry) => (
            <ExperienceCard key={`${entry.company}-${entry.title}`} entry={entry} highlightedBullets={highlightedBullets} />
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Education" />
          {resume.education.map((item) => (
            <EducationCard key={`${item.institution}-${item.degree}`} entry={item} />
          ))}
        </section>
      )}

      {Object.entries(resume.extras).map(([key, value]) => (
        <section key={key} className="space-y-2">
          <SectionHeading title={toTitleCase(key)} />
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {value.map((item, index) => (
              <li key={`${key}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
    </div>
  );
});

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="border-b-2 border-slate-300 pb-1 text-sm font-bold uppercase tracking-wider text-slate-700">
      {title}
    </h2>
  );
}

function ExperienceCard({ entry, highlightedBullets }: { entry: ExperienceEntry; highlightedBullets: Set<string> }) {
  return (
    <article className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between">
        <h3 className="text-base font-semibold text-slate-900">{entry.title || "Role"}</h3>
        <span className="text-xs font-medium text-slate-500">
          {[entry.start, entry.end].filter(Boolean).join(" – ")}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-600">{entry.company}</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
        {entry.bullets.map((bullet, index) => (
          <li
            key={`${entry.company}-${index}`}
            className={highlightedBullets.has(bullet) ? "font-medium text-sky-700 bg-sky-50 -ml-1 pl-1 rounded" : ""}
          >
            {bullet || ""}
          </li>
        ))}
      </ul>
    </article>
  );
}

function EducationCard({ entry }: { entry: EducationEntry }) {
  return (
    <article className="text-sm text-slate-700">
      <p className="font-medium">{entry.degree}</p>
      <p className="text-xs text-slate-500">{entry.institution}</p>
      {entry.year && <p className="text-xs text-slate-400">{entry.year}</p>}
      {entry.bullets.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {entry.bullets.map((bullet, index) => (
            <li key={`${entry.institution}-${index}`}>{bullet}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
