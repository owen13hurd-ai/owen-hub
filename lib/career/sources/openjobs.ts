import type { ScoutJob } from "@/lib/career/types";

type RawJob = Omit<ScoutJob, "matchBreakdown" | "reasons" | "score">;

type OpenJobsListing = {
  category?: string;
  company?: string;
  title?: string;
  url?: string;
};

type OpenJobsStats = {
  updated_at?: string;
};

const openJobsPageUrl =
  "https://raw.githubusercontent.com/digidai/openjobs/main/public/index.html";
const openJobsStatsUrl =
  "https://raw.githubusercontent.com/digidai/openjobs/main/public/stats.json";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function locationFromUrl(url: string, title: string) {
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? "";
    const withoutId = path.replace(/-\d+$/, "").replace(/^-+/, "");
    const titleSlug = slugify(title);
    const locationSlug = withoutId.startsWith(`${titleSlug}-`)
      ? withoutId.slice(titleSlug.length + 1)
      : withoutId;
    const georgiaMatch = locationSlug.match(/(?:^|-)([a-z0-9-]+)-ga$/);

    if (georgiaMatch?.[1]) return `${titleCase(georgiaMatch[1])}, GA`;
    if (/(?:^|-)georgia$/.test(locationSlug)) return "Georgia";
  } catch {
    // Invalid third-party URLs are discarded below as non-Georgia jobs.
  }

  return "Unknown";
}

function parseListings(page: string): OpenJobsListing[] {
  const match = page.match(/const allJobs = (\[[\s\S]*?\]);/);
  if (!match?.[1]) throw new Error("OpenJobs did not include its job data.");
  return JSON.parse(match[1]) as OpenJobsListing[];
}

export async function fetchOpenJobs(): Promise<RawJob[]> {
  const [pageResponse, statsResponse] = await Promise.all([
    fetch(openJobsPageUrl, { next: { revalidate: 60 * 30 } }),
    fetch(openJobsStatsUrl, { next: { revalidate: 60 * 30 } }),
  ]);

  if (!pageResponse.ok) throw new Error(`OpenJobs returned ${pageResponse.status}`);

  const [page, stats] = await Promise.all([
    pageResponse.text(),
    statsResponse.ok
      ? (statsResponse.json() as Promise<OpenJobsStats>)
      : Promise.resolve({} as OpenJobsStats),
  ]);

  return parseListings(page).flatMap((job) => {
    const title = job.title?.trim();
    const company = job.company?.trim();
    const url = job.url?.trim();
    if (!title || !company || !url) return [];

    const location = locationFromUrl(url, title);
    if (location === "Unknown") return [];

    return [{
      company,
      description: `${title} at ${company}.`,
      id: `openjobs-${slugify(url)}`,
      location,
      postedAt: stats.updated_at ?? null,
      salaryMaximum: null,
      salaryMinimum: null,
      source: "OpenJobs",
      tags: [job.category, "Open-source feed"].filter(
        (tag): tag is string => Boolean(tag && tag !== "Other"),
      ),
      title,
      url,
    }];
  });
}
