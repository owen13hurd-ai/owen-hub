import { NextRequest, NextResponse } from "next/server";

import {
  createCollectionItem,
  createPokemonCard,
  createPokemonProduct,
  createPokemonSet,
  createPriceObservation,
  createPurchase,
  createRestockObservation,
  createWatchlistItem,
  deletePokemonIntelligenceRecord,
  getPokemonIntelligenceSnapshot,
  importCollectrRows,
  mergeCollectionDuplicateRows,
  updatePokemonIntelligenceRecord,
} from "@/lib/pokemon-intelligence/server";
import { parseCollectrCsv } from "@/lib/pokemon-intelligence/collectr";
import { buildPokemonRecapNote } from "@/lib/pokemon-intelligence/recap";
import { writeObsidianNote, hasObsidianConfig } from "@/lib/obsidian/client";

function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Pokemon Intelligence request failed.";
  return NextResponse.json({ error: message }, { status });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    return NextResponse.json(await getPokemonIntelligenceSnapshot());
  } catch (error) {
    return jsonError(error, 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json() as { action?: string; csv?: string; ids?: unknown; rows?: unknown };
      if (body.action === "preview-collectr-csv") {
        return NextResponse.json(parseCollectrCsv(body.csv ?? ""));
      }
      if (body.action === "import-collectr-rows" && Array.isArray(body.rows)) {
        return NextResponse.json(await importCollectrRows(body.rows as Parameters<typeof importCollectrRows>[0]));
      }
      if (body.action === "merge-collection-duplicates" && Array.isArray(body.ids)) {
        return NextResponse.json(await mergeCollectionDuplicateRows(body.ids.filter((id): id is string => typeof id === "string")));
      }
      return jsonError(new Error("Unknown Pokemon Intelligence JSON action."), 400);
    }

    const formData = await request.formData();
    const action = String(formData.get("action") ?? "");

    if (action === "create-card") await createPokemonCard(formData);
    else if (action === "create-set") await createPokemonSet(formData);
    else if (action === "create-product") await createPokemonProduct(formData);
    else if (action === "create-collection-item") await createCollectionItem(formData);
    else if (action === "create-purchase") await createPurchase(formData);
    else if (action === "create-price-observation") await createPriceObservation(formData);
    else if (action === "create-watchlist-item") await createWatchlistItem(formData);
    else if (action === "create-restock-observation") await createRestockObservation(formData);
    else if (action === "create-recap-note") {
      if (!hasObsidianConfig()) {
        return jsonError(new Error("Obsidian is not configured, so the recap note could not be created."), 503);
      }
      const snapshot = await getPokemonIntelligenceSnapshot();
      const note = buildPokemonRecapNote(snapshot);
      await writeObsidianNote(note.path, note.content);
      return NextResponse.json({ ok: true, path: note.path });
    }
    else if (action === "create-decision-note") {
      if (!hasObsidianConfig()) {
        return jsonError(new Error("Obsidian is not configured, so the decision note could not be created."), 503);
      }
      const productName = String(formData.get("product_name") ?? "Pokemon Purchase").trim();
      const retailer = String(formData.get("retailer") ?? "Unknown source").trim();
      const price = String(formData.get("price") ?? "").trim();
      const reason = String(formData.get("reason") ?? "").trim();
      const risks = String(formData.get("risks") ?? "").trim();
      const date = today();
      const path = `13 Decisions/Pokemon Purchases/Decision - Buy ${productName} - ${date}.md`;
      const content = `---
type: decision
status: draft
source: conversation
confidence: medium
created: ${date}
updated: ${date}
related_records: []
tags:
  - pokemon
  - purchase-decision
---

# Decision - Buy ${productName} - ${date}

## Decision

Draft purchase decision for ${productName}.

## Purchase Snapshot

- Product: ${productName}
- Retailer or source: ${retailer || "Not entered"}
- Listed price: ${price || "Not entered"}
- Checked: ${date}

## Why

${reason || "Add the reason this purchase is attractive before confirming."}

## Risks

${risks || "Add risks such as reprint risk, above-MSRP price, weak recent sales data, condition uncertainty, or cash tied up."}

## Manual Approval

- [ ] Owen reviewed the source.
- [ ] Owen confirmed the price is acceptable.
- [ ] Owen decided whether this is for collecting, opening, or resale.
`;
      await writeObsidianNote(path, content);
      return NextResponse.json({ ok: true, path });
    }
    else return jsonError(new Error("Unknown Pokemon Intelligence action."), 400);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get("kind");
    const id = request.nextUrl.searchParams.get("id");
    if (!kind || !id) return jsonError(new Error("Record kind and id are required."), 400);
    if (!["card", "collection", "price", "product", "purchase", "restock", "set", "watchlist"].includes(kind)) {
      return jsonError(new Error("That record type cannot be deleted from this endpoint."), 400);
    }
    await deletePokemonIntelligenceRecord(kind as "card" | "collection" | "price" | "product" | "purchase" | "restock" | "set" | "watchlist", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { id?: string; kind?: string; values?: Record<string, boolean | number | string | string[] | null> };
    const { id, kind, values } = body;
    if (!kind || !id || !values) return jsonError(new Error("Record kind, id, and values are required."), 400);
    if (!["card", "collection", "price", "product", "purchase", "restock", "set", "watchlist"].includes(kind)) {
      return jsonError(new Error("That record type cannot be edited from this endpoint."), 400);
    }
    await updatePokemonIntelligenceRecord(kind as "card" | "collection" | "price" | "product" | "purchase" | "restock" | "set" | "watchlist", id, values);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
