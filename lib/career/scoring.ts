import type { JobMatchBreakdown, JobPreferences } from "@/lib/career/types";

type ScorableJob = {
  company: string;
  description: string;
  location: string;
  tags: string[];
  title: string;
};

const weights: JobMatchBreakdown = {
  role: 30,
  location: 20,
  industry: 15,
  keywords: 15,
  experience: 10,
  company: 10,
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return normalize(value).split(" ").filter((token) => token.length > 2);
}

function bestPhraseMatch(haystack: string, phrases: string[]) {
  if (phrases.length === 0) return 0.5;
  return Math.max(
    0,
    ...phrases.map((phrase) => {
      const normalizedPhrase = normalize(phrase);
      if (haystack.includes(normalizedPhrase)) return 1;
      const phraseTokens = tokens(phrase);
      if (phraseTokens.length === 0) return 0;
      return phraseTokens.filter((token) => haystack.includes(token)).length / phraseTokens.length;
    }),
  );
}

export function scoreJob(job: ScorableJob, preferences: JobPreferences) {
  const title = normalize(job.title);
  const location = normalize(job.location);
  const content = normalize(
    `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.description}`,
  );
  const reasons: string[] = [];

  const roleRatio = bestPhraseMatch(title, preferences.targetRoles);
  const role = Math.round(weights.role * roleRatio);
  if (roleRatio >= 0.75) reasons.push("Strong target-role match");
  else if (roleRatio >= 0.4) reasons.push("Related role title");

  const isRemote = /remote|anywhere|worldwide/.test(location);
  const locationTerms = [...preferences.preferredCities, ...preferences.preferredStates];
  const preferredPlace = locationTerms.some((place) => location.includes(normalize(place)));
  const acceptsMode =
    (isRemote && preferences.workModes.includes("Remote")) ||
    preferredPlace ||
    (preferences.workModes.includes("On-site") && locationTerms.length === 0);
  const locationScore = acceptsMode ? 1 : preferences.willingToRelocate ? 0.55 : 0.15;
  const locationPoints = Math.round(weights.location * locationScore);
  if (isRemote && preferences.workModes.includes("Remote")) reasons.push("Remote-friendly");
  else if (preferredPlace) reasons.push("Preferred location");

  const industryRatio = bestPhraseMatch(content, preferences.industries);
  const industry = Math.round(weights.industry * industryRatio);
  if (industryRatio >= 0.75) reasons.push("Preferred industry");

  const positiveMatches = preferences.positiveKeywords.filter((keyword) =>
    content.includes(normalize(keyword)),
  );
  const negativeMatches = preferences.negativeKeywords.filter((keyword) =>
    content.includes(normalize(keyword)),
  );
  const keywordRatio = preferences.positiveKeywords.length
    ? Math.min(1, positiveMatches.length / Math.min(3, preferences.positiveKeywords.length))
    : 0.5;
  const keywords = Math.max(0, Math.round(weights.keywords * keywordRatio) - negativeMatches.length * 5);
  if (positiveMatches.length) reasons.push(`Matches ${positiveMatches.slice(0, 3).join(", ")}`);
  if (negativeMatches.length) reasons.push(`Caution: ${negativeMatches.slice(0, 2).join(", ")}`);
  else reasons.push("No excluded keywords found");

  const seniorityRatio = bestPhraseMatch(content, preferences.seniority);
  const explicitlySenior = /\bsenior\b|\bsr\b|director|principal|manager/.test(title);
  const experience = explicitlySenior
    ? 1
    : Math.round(weights.experience * Math.max(0.5, seniorityRatio));
  if (!explicitlySenior) reasons.push("Early-career compatible");
  else reasons.push("May require more experience");

  // Public feeds rarely provide reliable company size, so this remains neutral until enriched.
  const company = Math.round(weights.company * 0.5);
  const breakdown: JobMatchBreakdown = {
    role,
    location: locationPoints,
    industry,
    keywords,
    experience,
    company,
  };
  const score = Math.max(0, Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)));

  return { breakdown, reasons: reasons.slice(0, 5), score };
}

