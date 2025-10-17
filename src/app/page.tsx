"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { UploadResume } from "@/components/UploadResume";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ResumePreview } from "@/components/ResumePreview";
import { BulletEditor } from "@/components/BulletEditor";
import VersionHistory from "@/components/VersionHistory";
import { parseResumeText, type ResumeJson } from "@/lib/parser";
import { matchJobDescription, type MatchResult } from "@/lib/matcher";
import { sessionManager } from "@/lib/session";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Auto-save resume changes to backend
  useEffect(() => {
    if (resume.contact.name || resume.summary || resume.experience.length > 0) {
      const saveResume = async () => {
        try {
          await sessionManager.saveResume(resume, jobDescription);
          setLastSaved(new Date());
          
          // Also keep localStorage backup
          if (typeof window !== 'undefined') {
            const saveData = {
              resume,
              timestamp: new Date().toISOString(),
            };
            localStorage.setItem('ai-resume-builder-save', JSON.stringify(saveData));
          }
        } catch (error) {
          console.error('Failed to save resume to backend:', error);
          // Fallback to localStorage only
          if (typeof window !== 'undefined') {
            const saveData = {
              resume,
              timestamp: new Date().toISOString(),
            };
            localStorage.setItem('ai-resume-builder-save', JSON.stringify(saveData));
            setLastSaved(new Date());
          }
        }
      };
      
      // Debounce the save operation
      const timeoutId = setTimeout(saveResume, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [resume, jobDescription]);

  // Load saved resume on component mount
  useEffect(() => {
    const loadResume = async () => {
      try {
        // Try to load from backend first
        const currentResume = await sessionManager.getCurrentResume();
        if (currentResume && currentResume.content) {
          setResume(currentResume.content);
          setLastSaved(new Date(currentResume.updated_at));
          if (currentResume.job_description) {
            setJobDescription(currentResume.job_description);
          }
          return;
        }
      } catch (error) {
        console.log('Could not load from backend:', error);
      }
      
      // Fallback to localStorage (client-side only)
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('ai-resume-builder-save');
          if (saved) {
            const saveData = JSON.parse(saved);
            if (saveData.resume && saveData.resume.contact) {
              setResume(saveData.resume);
              setLastSaved(new Date(saveData.timestamp));
            }
          }
        } catch (error) {
          console.log('No saved resume found or error loading save:', error);
        }
      }
    };

    loadResume();
  }, []);

  const highlightedBullets = useMemo(() => {
    if (!matchResult) return new Set<string>();
    return new Set(matchResult.rankedBullets.map((item) => item.text));
  }, [matchResult]);

  const suggestedSkills = useMemo(() => {
    const jdSet = new Set(keywords.map((word) => word.toLowerCase()));
    return skillsSeed.filter((skill) => jdSet.has(skill.toLowerCase()) && !resume.skills.includes(skill));
  }, [keywords, resume.skills]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText) {
      setStatus("❌ Please upload or paste a resume first.");
      return;
    }

    setIsAnalyzing(true);
    setStatus("🔍 Analyzing resume...");

    try {
      // Call backend to generate optimized resume
      if (jobDescription.trim()) {
        setStatus("🤖 AI is optimizing your resume for this job...");
        
        const response = await fetch("http://127.0.0.1:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription
          })
        });

        if (response.ok) {
          const data = await response.json();
          const optimizedText = data.optimized_resume || resumeText;
          
          // Parse the AI-generated resume
          const parsed = parseResumeText(optimizedText);
          
          // Limit summary to 4 lines max (as requested)
          if (parsed.summary && parsed.summary.split('\n').length > 4) {
            const lines = parsed.summary.split('\n');
            parsed.summary = lines.slice(0, 4).join('\n');
          }

          setResume(parsed);
          setMatchResult(matchJobDescription(jobDescription, parsed));
          setStatus("✅ Resume optimized with AI! Review the improved version below.");
        } else {
          throw new Error(`Backend responded with status ${response.status}`);
        }
      } else {
        // Fallback: local parsing only
        const parsed = parseResumeText(resumeText);
        setResume(parsed);
        setStatus("📋 Resume parsed locally. Add job description for AI optimization.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      // Fallback to local parsing
      const parsed = parseResumeText(resumeText);
      setResume(parsed);
      setMatchResult(jobDescription.trim() ? matchJobDescription(jobDescription, parsed) : null);
      setStatus("⚠️ AI optimization failed - using local analysis. Check if backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
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
            <h1 className="text-2xl font-semibold text-slate-900">🤖 AI Resume Builder</h1>
            <p className="text-sm text-slate-600">
              Upload your resume, paste a job description, and get an AI-optimized resume with better ATS compatibility. 
              Uses local AI (Llama 3.2) - your data stays private!
            </p>
          </header>

          <UploadResume
            onTextExtracted={(text) => {
              setResumeText(text);
              setStatus("📄 Resume uploaded successfully! Add job description and click Analyze.");
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
              disabled={isAnalyzing}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow transition-colors ${
                isAnalyzing
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-sky-600 text-white hover:bg-sky-500"
              }`}
              onClick={handleAnalyze}
            >
              {isAnalyzing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze & Match"}
            </button>
            <button
              type="button"
              onClick={() => setShowVersionHistory(true)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              📋 Version History
            </button>
            <button
              type="button"
              disabled={!resume.contact.name}
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                resume.contact.name
                  ? "border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              onClick={handleExport}
            >
              📄 Download PDF
            </button>
          </div>

          {status && (
            <div className={`text-xs p-3 rounded-md ${
              status.includes("✅")
                ? "text-green-700 bg-green-50 border border-green-200"
                : status.includes("❌")
                ? "text-red-700 bg-red-50 border border-red-200"
                : status.includes("⚠️")
                ? "text-orange-700 bg-orange-50 border border-orange-200"
                : "text-slate-600 bg-slate-50 border border-slate-200"
            }`}>
              {status}
            </div>
          )}

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
              className="w-full rounded-md border border-slate-200 p-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none"
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
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-gray-900 focus:border-sky-500 focus:outline-none"
                      placeholder="Role title"
                    />
                    <input
                      value={entry.company}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, company: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-gray-900 focus:border-sky-500 focus:outline-none"
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
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm text-gray-900 focus:border-sky-500 focus:outline-none"
                      placeholder="Start"
                    />
                    <input
                      value={entry.end}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...entry, end: event.target.value };
                        setResume((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm text-gray-900 focus:border-sky-500 focus:outline-none"
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
            <h2 className="text-lg font-semibold text-slate-900">📄 Resume Preview ({template})</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <p>Highlighted bullets indicate strong matches for this role.</p>
              {lastSaved && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                  <span>✅</span>
                  <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          <ResumePreview 
            ref={previewRef} 
            resume={resume} 
            highlightedBullets={highlightedBullets}
            onResumeUpdate={setResume}
          />
        </section>
      </div>
      
      {/* Version History Modal */}
      <VersionHistory 
        isVisible={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onLoadVersion={(versionContent) => {
          setResume(versionContent);
          setLastSaved(new Date());
        }}
      />
    </div>
  );
}
