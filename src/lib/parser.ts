export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
  bullets: string[];
}

export interface ResumeJson {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  extras: Record<string, string[]>;
}

const HEADING_KEYWORDS = [
  "summary",
  "objective",
  "profile",
  "skills",
  "technical skills",
  "experience",
  "professional experience",
  "work experience",
  "projects",
  "education",
  "certifications",
  "awards"
];

const BULLET_MARKERS = [/^[-•*\u2022]\s+/, /^\d+\.\s+/];

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/;
const urlRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi;

export function parseResumeText(rawText: string): ResumeJson {
  const text = normaliseText(rawText);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const contact = extractContact(lines);
  const sections = splitIntoSections(lines);

  const summary = sections.summary?.join(" ") ?? "";
  const skills = extractSkills(sections.skills ?? []);
  const experience = extractExperience(sections.experience);
  const education = extractEducation(sections.education);
  const extras = extractExtras(sections);

  return {
    contact,
    summary,
    skills,
    experience,
    education,
    extras
  };
}

function normaliseText(value: string): string {
  return value
    .replace(/\u2022/g, "•")
    .replace(/\t/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractContact(lines: string[]): ContactInfo {
  const firstLines = lines.slice(0, 8);
  const email = firstLines.find((line) => emailRegex.test(line)) ?? "";
  const phoneLine = firstLines.find((line) => phoneRegex.test(line)) ?? "";
  const phoneMatch = phoneLine.match(phoneRegex)?.[0] ?? "";
  const linkSet = new Set<string>();
  firstLines.forEach((line) => {
    const matches = line.match(urlRegex);
    matches?.forEach((match) => linkSet.add(match));
  });

  return {
    name: inferName(firstLines),
    email,
    phone: phoneMatch,
    location: inferLocation(firstLines),
    links: Array.from(linkSet)
  };
}

function inferName(lines: string[]): string {
  const firstLine = lines[0] ?? "";
  if (firstLine && !emailRegex.test(firstLine) && !phoneRegex.test(firstLine)) {
    return firstLine.replace(urlRegex, "").trim();
  }
  return "";
}

function inferLocation(lines: string[]): string {
  return (
    lines
      .find((line) =>
        /(\b[A-Za-z]+\s?)+(,\s?[A-Za-z]+)?\s?(\d{5})?$/.test(line) &&
        !emailRegex.test(line) &&
        !phoneRegex.test(line)
      ) ?? ""
  );
}

function splitIntoSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let currentKey = "header";
  sections[currentKey] = [];

  lines.forEach((line) => {
    const headingKey = detectHeading(line);
    if (headingKey) {
      currentKey = headingKey;
      if (!sections[currentKey]) sections[currentKey] = [];
      return;
    }
    sections[currentKey] ??= [];
    sections[currentKey].push(line);
  });

  return sections;
}

function detectHeading(line: string): string | null {
  const lower = line.toLowerCase().trim().replace(/[:.]/g, "");
  const match = HEADING_KEYWORDS.find((keyword) => lower === keyword);
  if (match) return match.replace(/\s+/g, "");
  return null;
}

function extractSkills(skillLines: string[]): string[] {
  if (!skillLines.length) return [];
  return skillLines
    .join(" ")
    .split(/[,;\n]/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 1)
    .map((token) => token.replace(/[^a-z0-9.+# ]/gi, ""))
    .filter(Boolean);
}

function extractExperience(experienceLines?: string[]): ExperienceEntry[] {
  if (!experienceLines?.length) return [];

  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;

  experienceLines.forEach((line) => {
    if (isNewExperienceHeading(line)) {
      if (current) entries.push(current);
      current = parseExperienceHeading(line);
      return;
    }

    const bullet = stripBullet(line);
    if (bullet) {
      current ??= {
        company: "",
        title: "",
        start: "",
        end: "",
        bullets: []
      };
      current.bullets.push(bullet);
    }
  });

  if (current) entries.push(current);
  return entries;
}

function isNewExperienceHeading(line: string): boolean {
  return /(\b[A-Za-z]+\b\s?){2,}[-–]\s?[A-Za-z]+/.test(line) || /(\b\d{4}\b)/.test(line) && !line.startsWith("•");
}

function parseExperienceHeading(line: string): ExperienceEntry {
  const dateMatch = line.match(/(\b\d{4}\b).*(\b\d{4}\b|present)/i);
  const [start = "", end = ""] = dateMatch ? dateMatch[0].split(/[-–]/).map((part) => part.trim()) : ["", ""];

  const noDates = line.replace(dateMatch?.[0] ?? "", "").trim();
  const parts = noDates.split(/[-–@•]/).map((part) => part.trim()).filter(Boolean);

  return {
    company: parts[0] ?? "",
    title: parts[1] ?? "",
    start,
    end,
    bullets: []
  };
}

function stripBullet(line: string): string {
  for (const marker of BULLET_MARKERS) {
    if (marker.test(line)) {
      return line.replace(marker, "").trim();
    }
  }
  return line.trim();
}

function extractEducation(educationLines?: string[]): EducationEntry[] {
  if (!educationLines?.length) return [];

  const entries: EducationEntry[] = [];
  let current: EducationEntry | null = null;

  educationLines.forEach((line) => {
    if (/(b\.?s\.?|m\.?s\.?|ph\.?d\.?|bachelor|master|diploma|degree)/i.test(line)) {
      if (current) entries.push(current);
      current = {
        institution: line,
        degree: line,
        year: extractYear(line),
        bullets: []
      };
      return;
    }

    const bullet = stripBullet(line);
    if (bullet) {
      current ??= {
        institution: "",
        degree: "",
        year: "",
        bullets: []
      };
      current.bullets.push(bullet);
    }
  });

  if (current) entries.push(current);
  return entries;
}

function extractYear(line: string): string {
  const match = line.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? "";
}

function extractExtras(sections: Record<string, string[]>): Record<string, string[]> {
  const extras: Record<string, string[]> = {};
  Object.entries(sections).forEach(([key, value]) => {
    if (key === "header" || key === "summary" || key === "skills" || key === "experience" || key === "education") {
      return;
    }
    if (value.length) extras[key] = value;
  });
  return extras;
}
