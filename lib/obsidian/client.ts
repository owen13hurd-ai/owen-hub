const defaultObsidianUrl = "http://127.0.0.1:27123";

export type ObsidianSearchResult = {
  filename: string;
  matches: Array<{ context: string; match: { end: number; start: number } }>;
  score: number;
};

export function hasObsidianConfig() {
  return Boolean(process.env.OBSIDIAN_API_KEY?.trim());
}

function baseUrl() {
  return (process.env.OBSIDIAN_API_URL?.trim() || defaultObsidianUrl).replace(/\/$/, "");
}

function safePath(path: string) {
  const normalized = path.trim().replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === ".." || part === ".")) {
    throw new Error("Invalid vault path.");
  }
  return normalized.split("/").map(encodeURIComponent).join("/");
}

async function request(path: string, init: RequestInit = {}) {
  const apiKey = process.env.OBSIDIAN_API_KEY?.trim();
  if (!apiKey) throw new Error("Obsidian is not configured.");
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Obsidian returned ${response.status}.`);
  }
  return response;
}

export async function getObsidianStatus() {
  const response = await request("/");
  return response.json() as Promise<{ authenticated: boolean; ok: string; service: string; versions?: Record<string, string> }>;
}

export async function listObsidianFiles(directory = "") {
  const path = directory ? `/vault/${safePath(directory)}/` : "/vault/";
  const response = await request(path, { headers: { Accept: "application/json" } });
  return response.json() as Promise<{ files: string[] }>;
}

export async function readObsidianNote(path: string) {
  const response = await request(`/vault/${safePath(path)}`, { headers: { Accept: "application/vnd.olrapi.note+json" } });
  return response.json() as Promise<{ backlinks: string[]; content: string; frontmatter: Record<string, unknown>; links: string[]; path: string; tags: string[] }>;
}

export async function writeObsidianNote(path: string, content: string) {
  await request(`/vault/${safePath(path)}`, {
    body: content,
    headers: { "Content-Type": "text/markdown" },
    method: "PUT",
  });
}

export async function searchObsidian(query: string) {
  const response = await request(`/search/simple/?query=${encodeURIComponent(query)}&contextLength=140`, { method: "POST" });
  return response.json() as Promise<ObsidianSearchResult[]>;
}

export async function getObsidianTags() {
  const response = await request("/tags/", { headers: { Accept: "application/json" } });
  return response.json() as Promise<{ tags: Array<{ count: number; name: string }> }>;
}
