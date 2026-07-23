import { NextResponse } from "next/server";

import { getRestockSnapshot } from "@/lib/restocks/connectors/registry";

export async function GET() {
  try {
    return NextResponse.json(await getRestockSnapshot());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restock check failed." },
      { status: 500 },
    );
  }
}
