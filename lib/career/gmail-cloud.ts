import type { GmailJobEmail } from "@/lib/career/gmail-import";

type GmailListResponse = {
  messages?: Array<{ id: string; threadId: string }>;
};

type GmailMessagePart = {
  body?: { data?: string };
  mimeType?: string;
  parts?: GmailMessagePart[];
};

type GmailMessageResponse = {
  id: string;
  internalDate?: string;
  payload?: GmailMessagePart & {
    headers?: Array<{ name: string; value: string }>;
  };
  snippet?: string;
};

const defaultJobQuery = [
  "newer_than:2d",
  "-in:spam",
  "-in:trash",
  "(from:linkedin.com OR from:indeed.com OR from:hiring.cafe OR from:hiringcafe.email)",
  "(job OR jobs OR alert OR hiring)",
].join(" ");

function decodeBase64Url(value = "") {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function headerValue(message: GmailMessageResponse, name: string) {
  return message.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function htmlToReadableText(html: string) {
  return html
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url: string, label: string) =>
      `[${label.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}](${url})`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectBodyParts(part: GmailMessagePart | undefined): { html: string[]; text: string[] } {
  if (!part) return { html: [], text: [] };
  const children = part.parts?.map(collectBodyParts) ?? [];
  const collected = children.reduce(
    (result, child) => ({
      html: [...result.html, ...child.html],
      text: [...result.text, ...child.text],
    }),
    { html: [] as string[], text: [] as string[] },
  );

  if (part.body?.data && part.mimeType === "text/html") collected.html.push(decodeBase64Url(part.body.data));
  if (part.body?.data && part.mimeType === "text/plain") collected.text.push(decodeBase64Url(part.body.data));
  return collected;
}

async function getGmailAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail cloud access is missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Gmail token refresh failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("Gmail token refresh did not return an access token.");
  return payload.access_token;
}

async function gmailFetch<T>(path: string, accessToken: string) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Gmail request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

export async function fetchCloudGmailJobEmails(): Promise<GmailJobEmail[]> {
  const accessToken = await getGmailAccessToken();
  const query = process.env.GMAIL_JOB_QUERY || defaultJobQuery;
  const maxResults = Number(process.env.GMAIL_JOB_MAX_RESULTS ?? 25);
  const list = await gmailFetch<GmailListResponse>(
    `messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
    accessToken,
  );

  const messages = await Promise.all(
    (list.messages ?? []).map((message) =>
      gmailFetch<GmailMessageResponse>(`messages/${message.id}?format=full`, accessToken)),
  );

  return messages.map((message) => {
    const parts = collectBodyParts(message.payload);
    const body = parts.text.join("\n\n") || parts.html.map(htmlToReadableText).join("\n\n");
    const emailDate = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;

    return {
      body,
      displayUrl: `https://mail.google.com/mail/u/0/#all/${message.id}`,
      emailTs: emailDate,
      from: headerValue(message, "From"),
      id: message.id,
      snippet: message.snippet,
      subject: headerValue(message, "Subject"),
    };
  });
}
