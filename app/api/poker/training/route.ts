import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import type { PokerBenchLibrary } from "@/lib/poker/pokerbench";
import type { PokerPosition, TrainingSpot } from "@/lib/poker/types";

let libraryPromise: Promise<PokerBenchLibrary> | null = null;

function loadLibrary() {
  libraryPromise ??= readFile(path.join(process.cwd(), "public/data/pokerbench-test.json"), "utf8")
    .then((contents) => JSON.parse(contents) as PokerBenchLibrary);
  return libraryPromise;
}

function streetOf(spot: TrainingSpot) {
  if (spot.board.length === 0) return "Preflop";
  if (spot.board.length === 3) return "Flop";
  if (spot.board.length === 4) return "Turn";
  return "River";
}

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const library = await loadLibrary();
  const street = request.nextUrl.searchParams.get("street") ?? "All";
  const position = request.nextUrl.searchParams.get("position") ?? "All";
  const limit = Math.min(100, Math.max(1, numberParam(request.nextUrl.searchParams.get("limit"), 80)));
  const dailySeed = request.nextUrl.searchParams.get("dailySeed");
  const filtered = library.spots.filter((spot) =>
    (street === "All" || streetOf(spot) === street) &&
    (position === "All" || spot.position === position as PokerPosition),
  );

  let offset = Math.max(0, numberParam(request.nextUrl.searchParams.get("offset"), 0));
  if (dailySeed !== null && filtered.length > 0) {
    offset = Math.abs(numberParam(dailySeed, 0)) % filtered.length;
  } else if (request.nextUrl.searchParams.get("shuffle") === "true" && filtered.length > limit) {
    offset = Math.floor(Math.random() * (filtered.length - limit));
  }

  const spots = filtered.slice(offset, offset + limit);
  return NextResponse.json({
    importedAt: library.importedAt,
    license: library.license,
    source: library.source,
    spots,
    total: filtered.length,
  }, {
    headers: { "Cache-Control": dailySeed === null ? "private, no-store" : "public, max-age=3600" },
  });
}
