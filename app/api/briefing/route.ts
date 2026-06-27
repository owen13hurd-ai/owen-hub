import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

import { briefingCategories, briefingSources } from "@/lib/briefing/sources";

type FeedItem = { description?: unknown; guid?: unknown; link?: unknown; pubDate?: unknown; title?: unknown };

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"] ?? "");
  return "";
}

function clean(value: unknown) {
  return text(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();
}

function cleanLink(value: unknown) {
  return text(value).replaceAll("&#038;", "&").replaceAll("&amp;", "&").trim();
}

export async function GET() {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const sourceResults = await Promise.all(briefingSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 60 * 30 }, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`${response.status}`);
      const parsed = parser.parse(await response.text()) as { rss?: { channel?: { item?: FeedItem | FeedItem[] } }; feed?: { entry?: FeedItem | FeedItem[] } };
      const rawItems = parsed.rss?.channel?.item ?? parsed.feed?.entry ?? [];
      const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 12).map((item, index) => {
        const link = cleanLink(item.link) || cleanLink(item.guid);
        const title = clean(item.title) || "Untitled update";
        const publishedAt = text(item.pubDate) || null;
        return {
          category: source.category,
          id: `${source.label}-${link || title}-${index}`,
          link,
          publishedAt,
          source: source.label,
          summary: clean(item.description).slice(0, 320),
          title,
          whyItMatters: source.whyItMatters,
        };
      }).filter((item) => item.link);
      return { items, label: source.label, ok: true };
    } catch {
      return { items: [], label: source.label, ok: false };
    }
  }));

  const seen = new Set<string>();
  const sections = briefingCategories.map((category) => ({
    category,
    items: sourceResults.flatMap((result) => result.items)
      .filter((item) => item.category === category)
      .filter((item) => {
        const key = item.link.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) - (a.publishedAt ? new Date(a.publishedAt).getTime() : 0))
      .slice(0, 12),
  }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sections,
    sources: sourceResults.map(({ items, label, ok }) => ({ count: items.length, label, ok })),
  });
}
