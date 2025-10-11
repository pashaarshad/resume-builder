"use client";

import { forwardRef } from "react";
import type { ResumeJson, ExperienceEntry, EducationEntry } from "@/lib/parser";

interface ResumePreviewProps {
  resume: ResumeJson;
  highlightedBullets: Set<string>;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(function ResumePreview(
  { resume, highlightedBullets },
  ref
) {
  return (
    <div ref={ref} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{resume.contact.name || "Your Name"}</h1>
        <p className="text-sm text-slate-600">
          {resume.contact.email && <span className="mr-2">{resume.contact.email}</span>}
          {resume.contact.phone && <span className="mr-2">{resume.contact.phone}</span>}
          {resume.contact.location && <span>{resume.contact.location}</span>}
        </p>
        {resume.contact.links.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            {resume.contact.links.map((link) => (
              <span key={link}>{link}</span>
            ))}
          </div>
        )}
      </header>

      {resume.summary && (
        <section>
          <SectionHeading title="Summary" />
          <p className="text-sm text-slate-700">{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <SectionHeading title="Skills" />
          <div className="flex flex-wrap gap-2 text-xs text-slate-700">
            {resume.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2 py-1">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title="Experience" />
          {resume.experience.map((entry) => (
            <ExperienceCard key={`${entry.company}-${entry.title}`} entry={entry} highlightedBullets={highlightedBullets} />
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="space-y-2">
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
  );
});

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-semibold uppercase tracking-wide text-slate-500">{title}</h2>;
}

function ExperienceCard({ entry, highlightedBullets }: { entry: ExperienceEntry; highlightedBullets: Set<string> }) {
  return (
    <article className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between text-sm font-medium text-slate-800">
        <span>{entry.title || "Role"}</span>
        <span className="text-xs text-slate-500">
          {[entry.start, entry.end].filter(Boolean).join(" – ")}
        </span>
      </div>
      <p className="text-xs text-slate-500">{entry.company}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {entry.bullets.map((bullet, index) => (
          <li key={`${entry.company}-${index}`} className={highlightedBullets.has(bullet) ? "font-semibold text-sky-700" : ""}>
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
