import { NextRequest, NextResponse } from "next/server";

import {
  getObsidianStatus,
  getObsidianTags,
  hasObsidianConfig,
  listObsidianFiles,
  readObsidianNote,
  searchObsidian,
  writeObsidianNote,
} from "@/lib/obsidian/client";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Obsidian could not be reached.";
  return NextResponse.json({ error: message }, { status: message === "Obsidian is not configured." ? 503 : 502 });
}

export async function GET(request: NextRequest) {
  if (!hasObsidianConfig()) return NextResponse.json({ configured: false }, { status: 503 });
  const action = request.nextUrl.searchParams.get("action") ?? "status";
  try {
    if (action === "status") return NextResponse.json({ configured: true, status: await getObsidianStatus() });
    if (action === "list") return NextResponse.json(await listObsidianFiles(request.nextUrl.searchParams.get("directory") ?? ""));
    if (action === "read") return NextResponse.json(await readObsidianNote(request.nextUrl.searchParams.get("path") ?? ""));
    if (action === "search") return NextResponse.json({ results: await searchObsidian(request.nextUrl.searchParams.get("query") ?? "") });
    if (action === "tags") return NextResponse.json(await getObsidianTags());
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!hasObsidianConfig()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const body = await request.json() as { content?: string; path?: string };
    if (!body.path?.trim() || typeof body.content !== "string") {
      return NextResponse.json({ error: "A note path and content are required." }, { status: 400 });
    }
    const path = body.path.endsWith(".md") ? body.path : `${body.path}.md`;
    await writeObsidianNote(path, body.content);
    return NextResponse.json({ ok: true, path });
  } catch (error) {
    return errorResponse(error);
  }
}
