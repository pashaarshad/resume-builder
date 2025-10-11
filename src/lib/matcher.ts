import type { ResumeJson, ExperienceEntry } from "./parser";

export interface MatchResult {
  rankedBullets: RankedBullet[];
  skillMatches: string[];
  matchScore: number;
}

export interface RankedBullet {
  text: string;
  score: number;
  source: {
    section: string;
    company?: string;
    title?: string;
  };
}

interface TokensPayload {
  tokens: string[];
  source: RankedBullet["source"];
  original: string;
}

export function matchJobDescription(jobDescription: string, resume: ResumeJson): MatchResult {
  const jdTokens = tokenize(jobDescription);
  const bulletPayload = collectBullets(resume.experience);
  const skillMatches = matchSkills(resume.skills, jdTokens);

  const rankedBullets = bulletPayload
    .map((payload) => ({
      source: payload.source,
      text: payload.original,
      score: computeOverlap(payload.tokens, jdTokens)
    }))
    .filter((bullet) => bullet.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const matchScore = computeMatchScore(rankedBullets, skillMatches, resume.skills.length);

  return {
    rankedBullets,
    skillMatches,
    matchScore
  };
}

function collectBullets(experience: ExperienceEntry[]): TokensPayload[] {
  const payload: TokensPayload[] = [];
  experience.forEach((entry) => {
    entry.bullets.forEach((bullet) => {
      payload.push({
        original: bullet,
        tokens: tokenize(bullet),
        source: {
          section: "experience",
          company: entry.company,
          title: entry.title
        }
      });
    });
  });
  return payload;
}

function matchSkills(resumeSkills: string[], jdTokens: string[]): string[] {
  const jdSet = new Set(jdTokens);
  return resumeSkills.filter((skill) => jdSet.has(skill.toLowerCase()));
}

function computeMatchScore(bullets: RankedBullet[], skillMatches: string[], totalSkillCount: number): number {
  if (!bullets.length && !skillMatches.length) return 0;
  const bulletScore = bullets.reduce((sum, bullet) => sum + bullet.score, 0) / Math.max(bullets.length, 1);
  const skillScore = skillMatches.length / Math.max(totalSkillCount, 1);
  const combined = (bulletScore * 0.7 + skillScore * 0.3) * 100;
  return Math.min(100, Math.round(combined));
}

function computeOverlap(tokensA: string[], tokensB: string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  let overlap = 0;
  tokensB.forEach((token) => {
    if (setA.has(token)) overlap += 1;
  });
  return overlap / Math.max(tokensA.length, tokensB.length);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

// Example usage:
// const preview = matchJobDescription(sampleJobDescription, sampleResumeJson);
// console.log(preview.matchScore);
