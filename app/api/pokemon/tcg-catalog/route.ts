import { NextRequest, NextResponse } from "next/server";

import { searchTcgCards, searchTcgSets } from "@/lib/pokemon-intelligence/tcg-api";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Pokemon TCG catalog lookup failed.";
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "sets";
  const query = request.nextUrl.searchParams.get("q") ?? "";

  try {
    if (type === "cards") return NextResponse.json(await searchTcgCards(query));
    if (type === "sets") return NextResponse.json(await searchTcgSets(query));
    return NextResponse.json({ error: "Catalog type must be sets or cards." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
