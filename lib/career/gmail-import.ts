import type { ScoutJob } from "@/lib/career/types";

export type GmailJobEmail = {
  body?: string | null;
  displayUrl?: string | null;
  emailTs?: string | null;
  from?: string | null;
  id?: string | null;
  snippet?: string | null;
  subject?: string | null;
};

type ParsedEmailJob = Partial<ScoutJob> & {
  emailId?: string;
};

const georgiaLocationPattern = /\b(atlanta|georgia|ga)\b/i;
const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200f\uFEFF]/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSource(email: GmailJobEmail) {
  const value = `${email.from ?? ""} ${email.subject ?? ""}`.toLowerCase();
  if (value.includes("hiring.cafe") || value.includes("hiringcafe")) return "Gmail - HiringCafe";
  if (value.includes("linkedin")) return "Gmail - LinkedIn";
  if (value.includes("indeed")) return "Gmail - Indeed";
  if (value.includes("glassdoor")) return "Gmail - Glassdoor";
  if (value.includes("builtin")) return "Gmail - Built In";
  return "Gmail";
}

function cleanValue(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[-:|]+|[-:|]+$/g, "")
    .trim();
}

function parseSalary(block: string) {
  const salaryLine = block.match(/\$[\d,]+(?:\s*[\u2013\u2014-]\s*\$[\d,]+)?\s*\/\s*(?:year|hour)/i)?.[0];
  if (!salaryLine) return { salaryMaximum: null, salaryMinimum: null };
  const values = salaryLine.match(/\$[\d,]+/g)?.map((value) => Number(value.replace(/[$,]/g, ""))) ?? [];
  return {
    salaryMaximum: values.length > 1 ? Math.max(...values) : values[0] ?? null,
    salaryMinimum: values[0] ?? null,
  };
}

function parsePostedAt(block: string, fallback: string | null | undefined) {
  const posted = block.match(/Posted\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1];
  const parsed = posted ? new Date(posted) : fallback ? new Date(fallback) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : fallback ?? null;
}

function parseMarkdownLinks(value: string) {
  return Array.from(value.matchAll(markdownLinkPattern)).map((match) => ({
    label: normalizeText(match[1]),
    url: match[2],
  }));
}

function parseHiringCafeEmail(email: GmailJobEmail, text: string): ParsedEmailJob[] {
  const links = parseMarkdownLinks(text);
  const jobs: ParsedEmailJob[] = [];

  for (let index = 0; index < links.length - 1; index += 1) {
    const titleLink = links[index];
    const detailLink = links[index + 1];
    const detail = detailLink.label;
    const detailMatch = detail.match(
      /^(.+?)\s+[\u2013\u2014-]\s+(.+?)\n\nPosted\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\n\n([\s\S]+)$/i,
    );

    if (!detailMatch || !georgiaLocationPattern.test(detailMatch[2])) continue;
    if (/view all|apply|modify|hiringcafe|unsubscribe|cities/i.test(titleLink.label)) continue;

    const description = cleanValue(detailMatch[4].replace(/\$[\d,]+(?:\s*[\u2013\u2014-]\s*\$[\d,]+)?\s*\/\s*(?:year|hour)/i, ""));
    const salary = parseSalary(detail);

    jobs.push({
      company: cleanValue(detailMatch[1]),
      description,
      emailId: email.id ?? undefined,
      id: `gmail-hiringcafe-${email.id ?? "email"}-${index}`,
      location: cleanValue(detailMatch[2]),
      postedAt: parsePostedAt(detail, email.emailTs),
      salaryMaximum: salary.salaryMaximum,
      salaryMinimum: salary.salaryMinimum,
      source: "Gmail - HiringCafe",
      tags: ["Gmail alert", "HiringCafe"],
      title: titleLink.label,
      url: titleLink.url,
    });
  }

  return jobs;
}

function parseLinkedInSubjectEmail(email: GmailJobEmail, text: string): ParsedEmailJob[] {
  const subject = cleanValue(email.subject ?? "");
  if (!subject || /job alert .* created/i.test(subject)) return [];
  if (!georgiaLocationPattern.test(text)) return [];

  const match = subject.match(/^(.+?)\s+at\s+(.+)$/i);
  if (!match) return [];

  const title = cleanValue(match[1].replace(/\s+-\s+.+$/, ""));
  const company = cleanValue(match[2]);
  if (!title || !company) return [];

  return [{
    company,
    description: cleanValue(email.snippet ?? subject),
    emailId: email.id ?? undefined,
    id: `gmail-linkedin-${email.id ?? company}-${title}`,
    location: "Atlanta, GA",
    postedAt: email.emailTs ?? null,
    salaryMaximum: null,
    salaryMinimum: null,
    source: "Gmail - LinkedIn",
    tags: ["Gmail alert", "LinkedIn"],
    title,
    url: email.displayUrl ?? "https://www.linkedin.com/jobs/",
  }];
}

function parseLinkedInEmail(email: GmailJobEmail, text: string): ParsedEmailJob[] {
  const linkedInJobs = parseMarkdownLinks(text).flatMap((link, index) => {
    const lines = link.label
      .split("\n")
      .map(cleanValue)
      .filter(Boolean);

    let company = "";
    let title = "";
    let location = "";

    if (lines.length >= 3 && lines[2].includes("·")) {
      company = lines[0];
      title = lines[1];
      location = cleanValue(lines[2].match(/·\s*(.+)$/)?.[1] ?? "");
    } else if (lines.length >= 2 && lines[1].includes("·")) {
      title = lines[0];
      const companyLocation = lines[1].match(/^(.+?)\s+·\s+(.+)$/);
      company = cleanValue(companyLocation?.[1] ?? "");
      location = cleanValue(companyLocation?.[2] ?? "");
    }

    if (!georgiaLocationPattern.test(location)) return [];
    if (/remote/i.test(location)) return [];
    if (!company || !title) return [];
    if (/see all jobs|linkedin|manage recommendations|unsubscribe|update|easy apply/i.test(title)) return [];

    return [{
      company,
      description: cleanValue(`${title}. ${location}. Imported from LinkedIn job alert email.`),
      emailId: email.id ?? undefined,
      id: `gmail-linkedin-${email.id ?? "email"}-${index}`,
      location,
      postedAt: email.emailTs ?? null,
      salaryMaximum: null,
      salaryMinimum: null,
      source: "Gmail - LinkedIn",
      tags: ["Gmail alert", "LinkedIn"],
      title,
      url: link.url,
    }];
  });

  return linkedInJobs.length ? linkedInJobs : parseLinkedInSubjectEmail(email, text);
}

function parseIndeedSubjectEmail(email: GmailJobEmail, text: string): ParsedEmailJob[] {
  const subject = cleanValue(email.subject ?? "");
  const match = subject.match(/^(.+?)\s+@\s+(.+)$/i);
  if (!match || !georgiaLocationPattern.test(text)) return [];

  return [{
    company: cleanValue(match[2]),
    description: cleanValue(email.snippet ?? subject),
    emailId: email.id ?? undefined,
    id: `gmail-indeed-${email.id ?? match[2]}-${match[1]}`,
    location: "Atlanta, GA",
    postedAt: email.emailTs ?? null,
    salaryMaximum: null,
    salaryMinimum: null,
    source: "Gmail - Indeed",
    tags: ["Gmail alert", "Indeed"],
    title: cleanValue(match[1]),
    url: email.displayUrl ?? "https://www.indeed.com/",
  }];
}

export function parseGmailJobEmails(emails: GmailJobEmail[]) {
  return emails.flatMap((email) => {
    const text = normalizeText(`${email.subject ?? ""}\n${email.snippet ?? ""}\n${email.body ?? ""}`);
    const source = normalizeSource(email);

    if (source === "Gmail - HiringCafe") return parseHiringCafeEmail(email, text);
    if (source === "Gmail - LinkedIn") return parseLinkedInEmail(email, text);
    if (source === "Gmail - Indeed") return parseIndeedSubjectEmail(email, text);

    return [];
  });
}
