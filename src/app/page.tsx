"use client";

import { useMemo, useRef, useState } from "react";
import { UploadResume } from "@/components/UploadResume";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ResumePreview } from "@/components/ResumePreview";
import { BulletEditor } from "@/components/BulletEditor";
import { parseResumeText, type ResumeJson } from "@/lib/parser";
import { matchJobDescription, type MatchResult } from "@/lib/matcher";
import skillsSeed from "@/lib/skills.json";
import { exportElementToPdf } from "@/utils/pdfExport";

const EMPTY_RESUME: ResumeJson = {
  contact: { name: "", email: "", phone: "", location: "", links: [] },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  extras: {}
};

export default function Page() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [template, setTemplate] = useState("classic");
  const [resume, setResume] = useState<ResumeJson>(EMPTY_RESUME);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [status, setStatus] = useState<string>("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  const highlightedBullets = useMemo(() => {
    if (!matchResult) return new Set<string>();
    return new Set(matchResult.rankedBullets.map((item) => item.text));
  }, [matchResult]);

  const suggestedSkills = useMemo(() => {
    const jdSet = new Set(keywords.map((word) => word.toLowerCase()));
    return skillsSeed.filter((skill) => jdSet.has(skill.toLowerCase()) && !resume.skills.includes(skill));
  }, [keywords, resume.skills]);

  const handleAnalyze = () => {
    if (!resumeText) {
      setStatus("Upload or paste a resume first.");
      return;
    }

    const parsed = parseResumeText(resumeText);

    const merged: ResumeJson = {
      ...parsed,
      summary: resume.summary || parsed.summary,
      skills: resume.skills.length ? resume.skills : parsed.skills,
      experience: parsed.experience.length ? parsed.experience : resume.experience,
      education: parsed.education.length ? parsed.education : resume.education
    };

    setResume(merged);
    if (jobDescription.trim().length) {
      setMatchResult(matchJobDescription(jobDescription, merged));
    } else {
      setMatchResult(null);
    }
    setStatus("Analysis complete. Review highlights on the right.");
  };

  const handleSkillToggle = (skill: string) => {
    setResume((prev) => {
      const exists = prev.skills.includes(skill);
      const nextSkills = exists ? prev.skills.filter((item) => item !== skill) : [...prev.skills, skill];
      return { ...prev, skills: nextSkills };
    });
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    await exportElementToPdf(previewRef.current, { filename: "resume.pdf" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_2fr]">
        <section className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">ATS Resume Builder</h1>
            <p className="text-sm text-slate-600">
              Upload your resume, paste the job description, and review the most relevant highlights locally. No data leaves your
              browser.
            </p>
          </header>

          <UploadResume
            onTextExtracted={(text) => {
              setResumeText(text);
              setStatus("Resume text captured. Click Analyze when ready.");
            }}
          />

          <JobDescriptionInput
            value={jobDescription}
            onChange={setJobDescription}
            onKeywordsExtracted={(tokens) => {
              setKeywords(tokens);
            }}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
              onClick={handleAnalyze}
            >
              Analyze & Match
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              onClick={handleExport}
            >
              Download PDF
            </button>
          </div>

          {status && <p className="text-xs text-slate-500">{status}</p>}

          <TemplateSelector template={template} onChange={setTemplate} />

          {matchResult && (
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              <p className="font-semibold">Match score: {matchResult.matchScore}/100</p>
              <p className="mt-1 text-xs text-emerald-600">
                {matchResult.skillMatches.length} matching skills and {matchResult.rankedBullets.length} highlighted bullets.
              </p>
            </div>
          )}

          {suggestedSkills.length > 0 && (
            <div className="rounded-md border border-sky-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Suggested keywords</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {suggestedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 font-medium text-sky-700 hover:bg-sky-100"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Resume summary</h2>
            <textarea
              value={resume.summary}
              onChange={(event) => setResume((prev) => ({ ...prev, summary: event.target.value }))}
              className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-sky-500 focus:outline-none"
              rows={4}
              placeholder="Write a concise professional summary..."
            />

            <div>
              <h3 className="text-sm font-semibold text-slate-700">Skills</h3>
              <p className="text-xs text-slate-500">Click a keyword to add or remove it from the skills list.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {resume.experience.map((entry, index) => (
              <div key={`${entry.company}-${index}`} className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex-1 space-y-2">
                    <input
                      value={entry.title}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, title: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="Role title"
                    />
                    <input
                      value={entry.company}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, company: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="Company"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={entry.start}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, start: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="Start"
                    />
                    <input
                      value={entry.end}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, end: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="End"
                    />
                  </div>
                </div>

                <BulletEditor
                  bullets={entry.bullets}
                  highlighted={highlightedBullets}
                  onUpdate={(bullets) => {
                    const next = [...resume.experience];
                    next[index] = { ...entry, bullets };
                    setResume((prev) => ({ ...prev, experience: next }));
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Preview ({template})</h2>
            <p className="text-xs text-slate-500">Highlighted bullets indicate strong matches for this role.</p>
          </div>
          <ResumePreview ref={previewRef} resume={resume} highlightedBullets={highlightedBullets} />
        </section>
      </div>
    </div>
  );
}
