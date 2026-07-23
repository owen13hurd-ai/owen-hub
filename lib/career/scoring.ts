import type { JobMatchBreakdown, JobPreferences } from "@/lib/career/types";

type ScorableJob = {
  company: string;
  description: string;
  location: string;
  tags: string[];
  title: string;
};

const weights: JobMatchBreakdown = {
  role: 35,
  location: 20,
  industry: 10,
  keywords: 15,
  experience: 15,
  company: 5,
};

const bdrSalesPattern =
  /\b(sdr|bdr|sales development|business development|inside sales|sales representative|account development)\b/;
const supplyChainPattern =
  /\b(supply chain|logistics|transportation|freight|dispatch|procurement|inventory|purchasing|warehouse|distribution|carrier|sourcing)\b/;
const entryProgramPattern =
  /\b(entry level|entry-level|junior|associate|coordinator|specialist|analyst|trainee|development program|rotational program|leadership development|management trainee|manager trainee)\b/;
const developmentProgramPattern =
  /\b(trainee|development program|rotational program|leadership development|management trainee|manager trainee|operations management program|supply chain development)\b/;
const badSeniorityPattern =
  /\b(senior|sr|director|principal|vice president|vp|head of|controller|chief|executive)\b/;
const managerPattern = /\bmanager\b/;
const financePattern =
  /\b(finance|financial|investment|wealth|banking|accounting|audit|tax|portfolio|asset management|capital management|capital markets|treasury|private equity|revenue analyst|deal desk|commercial banking)\b/;

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
  const targetRole =
    bdrSalesPattern.test(title) ||
    supplyChainPattern.test(title) ||
    developmentProgramPattern.test(content) ||
    (entryProgramPattern.test(title) && supplyChainPattern.test(content));
  const entryFriendly = entryProgramPattern.test(content);
  const protectedTrainingRole = /\b(manager trainee|management trainee|development program|rotational program|leadership development|operations management program)\b/.test(content);
  const seniorOrManager =
    badSeniorityPattern.test(title) ||
    (managerPattern.test(title) && !protectedTrainingRole);
  const financeRole = financePattern.test(content) && !supplyChainPattern.test(title) && !bdrSalesPattern.test(title);

  const roleRatio = bestPhraseMatch(title, preferences.targetRoles);
  const roleMultiplier = targetRole ? Math.max(roleRatio, 0.75) : Math.min(roleRatio, 0.35);
  const role = Math.round(weights.role * roleMultiplier);
  if (targetRole && roleRatio >= 0.75) reasons.push("Strong target-role match");
  else if (targetRole) reasons.push("Relevant BDR, sales, logistics, or supply-chain role");
  else reasons.push("Not a core target role");

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

  const industryRatio = targetRole ? bestPhraseMatch(content, preferences.industries) : Math.min(0.35, bestPhraseMatch(content, preferences.industries));
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
  const keywords = Math.max(0, Math.round(weights.keywords * keywordRatio) - negativeMatches.length * 4);
  if (positiveMatches.length) reasons.push(`Matches ${positiveMatches.slice(0, 3).join(", ")}`);
  if (negativeMatches.length) reasons.push(`Caution: ${negativeMatches.slice(0, 2).join(", ")}`);
  else reasons.push("No excluded keywords found");

  const seniorityRatio = bestPhraseMatch(content, preferences.seniority);
  const experience = seniorOrManager || financeRole
    ? 1
    : Math.round(weights.experience * Math.max(entryFriendly ? 0.85 : 0.45, seniorityRatio));
  if (financeRole) reasons.push("Finance-focused role is lower priority");
  else if (!seniorOrManager) reasons.push("Early-career compatible");
  else reasons.push("Likely too senior or management-heavy");

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
  const baseScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const penalty =
    (targetRole ? 0 : 22) +
    (seniorOrManager ? 28 : 0) +
    (financeRole ? 32 : 0);
  const cap = targetRole ? 100 : 52;
  const score = Math.max(0, Math.min(cap, baseScore - penalty));

  return { breakdown, reasons: reasons.slice(0, 5), score };
}
