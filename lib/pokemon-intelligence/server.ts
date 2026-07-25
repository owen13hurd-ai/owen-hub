import { createClient } from "@/lib/supabase/server";

import type { CollectrImportRow } from "./collectr";
import type {
  PokemonCollectionItem,
  PokemonIntelligenceCard,
  PokemonIntelligenceProduct,
  PokemonIntelligenceSet,
  PokemonIntelligenceSnapshot,
  PokemonPriceObservation,
  PokemonPurchase,
  PokemonRestockObservation,
  PokemonWatchlistItem,
} from "./types";

const profileKey = "owen-main";

function asNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asInteger(value: FormDataEntryValue | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function asString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredString(value: FormDataEntryValue | null, label: string) {
  const text = asString(value);
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

export async function getPokemonIntelligenceSnapshot(): Promise<PokemonIntelligenceSnapshot> {
  const supabase = await createClient();
  const [
    sets,
    cards,
    products,
    collectionItems,
    purchases,
    priceObservations,
    watchlist,
    restockObservations,
  ] = await Promise.all([
    supabase.from("pokemon_intelligence_sets").select("*").eq("profile_key", profileKey).order("release_date", { ascending: false, nullsFirst: false }),
    supabase.from("pokemon_intelligence_cards").select("*").eq("profile_key", profileKey).order("created_at", { ascending: false }),
    supabase.from("pokemon_intelligence_products").select("*").eq("profile_key", profileKey).order("created_at", { ascending: false }),
    supabase.from("pokemon_intelligence_collection_items").select("*").eq("profile_key", profileKey).order("created_at", { ascending: false }),
    supabase.from("pokemon_intelligence_purchases").select("*").eq("profile_key", profileKey).order("purchase_date", { ascending: false }),
    supabase.from("pokemon_intelligence_price_observations").select("*").eq("profile_key", profileKey).order("observed_at", { ascending: false }),
    supabase.from("pokemon_intelligence_watchlist").select("*").eq("profile_key", profileKey).order("created_at", { ascending: false }),
    supabase.from("pokemon_intelligence_restock_observations").select("*").eq("profile_key", profileKey).order("observed_at", { ascending: false }),
  ]);

  for (const result of [sets, cards, products, collectionItems, purchases, priceObservations, watchlist, restockObservations]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    cards: (cards.data ?? []) as PokemonIntelligenceCard[],
    collectionItems: (collectionItems.data ?? []) as PokemonCollectionItem[],
    priceObservations: (priceObservations.data ?? []) as PokemonPriceObservation[],
    products: (products.data ?? []) as PokemonIntelligenceProduct[],
    purchases: (purchases.data ?? []) as PokemonPurchase[],
    restockObservations: (restockObservations.data ?? []) as PokemonRestockObservation[],
    sets: (sets.data ?? []) as PokemonIntelligenceSet[],
    watchlist: (watchlist.data ?? []) as PokemonWatchlistItem[],
  };
}

export async function createPokemonCard(formData: FormData) {
  const supabase = await createClient();
  const subtypes = String(formData.get("subtypes") ?? "")
    .split(",")
    .map((subtype) => subtype.trim())
    .filter(Boolean);
  const payload = {
    external_id: asString(formData.get("external_id")),
    image_url: asString(formData.get("image_url")),
    name: requiredString(formData.get("name"), "Card name"),
    notes: asString(formData.get("notes")),
    number: asString(formData.get("number")),
    profile_key: profileKey,
    rarity: asString(formData.get("rarity")),
    set_name: asString(formData.get("set_name")),
    source_url: asString(formData.get("source_url")),
    subtypes,
    supertype: asString(formData.get("supertype")),
  };
  const { error } = await supabase.from("pokemon_intelligence_cards").upsert(payload, { onConflict: "profile_key,external_id" });
  if (error) throw new Error(error.message);
}

export async function createPokemonSet(formData: FormData) {
  const supabase = await createClient();
  const payload = {
    era: asString(formData.get("era")),
    name: requiredString(formData.get("name"), "Set name"),
    notes: asString(formData.get("notes")),
    profile_key: profileKey,
    release_date: asString(formData.get("release_date")),
  };
  const { error } = await supabase.from("pokemon_intelligence_sets").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createPokemonProduct(formData: FormData) {
  const supabase = await createClient();
  const payload = {
    image_url: asString(formData.get("image_url")),
    msrp: asNumber(formData.get("msrp")),
    name: requiredString(formData.get("name"), "Product name"),
    notes: asString(formData.get("notes")),
    pack_count: asInteger(formData.get("pack_count"), 0) || null,
    product_type: asString(formData.get("product_type")) ?? "sealed",
    profile_key: profileKey,
    release_date: asString(formData.get("release_date")),
    set_name: asString(formData.get("set_name")),
    source_url: asString(formData.get("source_url")),
  };
  const { error } = await supabase.from("pokemon_intelligence_products").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createCollectionItem(formData: FormData) {
  const supabase = await createClient();
  const productId = asString(formData.get("product_id"));
  const payload = {
    acquired_at: asString(formData.get("acquired_at")),
    condition: asString(formData.get("condition")) ?? "sealed",
    estimated_value: asNumber(formData.get("estimated_value")),
    item_kind: asString(formData.get("item_kind")) ?? "sealed",
    item_name: requiredString(formData.get("item_name"), "Item name"),
    notes: asString(formData.get("notes")),
    product_id: productId === "manual" ? null : productId,
    profile_key: profileKey,
    quantity: asInteger(formData.get("quantity")),
    storage_location: asString(formData.get("storage_location")),
  };
  const { error } = await supabase.from("pokemon_intelligence_collection_items").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createPurchase(formData: FormData) {
  const supabase = await createClient();
  const productId = asString(formData.get("product_id"));
  const payload = {
    fees: asNumber(formData.get("fees")) ?? 0,
    item_price: asNumber(formData.get("item_price")) ?? 0,
    product_id: productId === "manual" ? null : productId,
    product_name: requiredString(formData.get("product_name"), "Product name"),
    profile_key: profileKey,
    purchase_date: asString(formData.get("purchase_date")) ?? new Date().toISOString().slice(0, 10),
    purpose: asString(formData.get("purpose")) ?? "collecting",
    quantity: asInteger(formData.get("quantity")),
    retailer: asString(formData.get("retailer")),
    shipping: asNumber(formData.get("shipping")) ?? 0,
    source_url: asString(formData.get("source_url")),
    notes: asString(formData.get("notes")),
    tax: asNumber(formData.get("tax")) ?? 0,
  };
  const { error } = await supabase.from("pokemon_intelligence_purchases").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createPriceObservation(formData: FormData) {
  const supabase = await createClient();
  const productId = asString(formData.get("product_id"));
  const payload = {
    confidence: asString(formData.get("confidence")) ?? "medium",
    price: asNumber(formData.get("price")) ?? 0,
    product_id: productId === "manual" ? null : productId,
    product_name: requiredString(formData.get("product_name"), "Product name"),
    profile_key: profileKey,
    shipping: asNumber(formData.get("shipping")) ?? 0,
    source: requiredString(formData.get("source"), "Source"),
    source_url: asString(formData.get("source_url")),
    notes: asString(formData.get("notes")),
  };
  const { error } = await supabase.from("pokemon_intelligence_price_observations").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createWatchlistItem(formData: FormData) {
  const supabase = await createClient();
  const payload = {
    enabled: true,
    max_price: asNumber(formData.get("max_price")),
    name: requiredString(formData.get("name"), "Watchlist name"),
    notes: asString(formData.get("notes")),
    priority: asString(formData.get("priority")) ?? "medium",
    profile_key: profileKey,
    target_type: asString(formData.get("target_type")) ?? "sealed-product",
  };
  const { error } = await supabase.from("pokemon_intelligence_watchlist").insert(payload);
  if (error) throw new Error(error.message);
}

export async function createRestockObservation(formData: FormData) {
  const supabase = await createClient();
  const productId = asString(formData.get("product_id"));
  const payload = {
    confidence: asString(formData.get("confidence")) ?? "medium",
    current_price: asNumber(formData.get("current_price")),
    msrp: asNumber(formData.get("msrp")),
    product_id: productId === "manual" ? null : productId,
    product_name: requiredString(formData.get("product_name"), "Product name"),
    profile_key: profileKey,
    retailer: requiredString(formData.get("retailer"), "Retailer"),
    source_url: asString(formData.get("source_url")),
    stock_status: asString(formData.get("stock_status")) ?? "unknown",
    notes: asString(formData.get("notes")),
  };
  const { error } = await supabase.from("pokemon_intelligence_restock_observations").insert(payload);
  if (error) throw new Error(error.message);
}

export async function importCollectrRows(rows: CollectrImportRow[]) {
  const supabase = await createClient();
  const cleanRows = rows
    .filter((row) => row.cardName.trim())
    .slice(0, 1000);

  if (!cleanRows.length) return { imported: 0 };

  const cards = cleanRows.map((row) => ({
    external_id: null,
    name: row.cardName,
    notes: row.notes,
    number: row.sourceNumber,
    profile_key: profileKey,
    rarity: row.rarity,
    set_name: row.setName,
    source_url: null,
    subtypes: [],
    supertype: "Pokemon",
  }));

  const collectionItems = cleanRows.map((row) => ({
    condition: row.condition ?? "unknown",
    estimated_value: row.estimatedValue,
    item_kind: row.itemKind,
    item_name: row.cardName,
    notes: row.notes,
    profile_key: profileKey,
    quantity: row.quantity,
    storage_location: row.storageLocation ?? "Collectr import",
  }));

  const cardResult = await supabase.from("pokemon_intelligence_cards").insert(cards);
  if (cardResult.error) throw new Error(cardResult.error.message);

  const collectionResult = await supabase.from("pokemon_intelligence_collection_items").insert(collectionItems);
  if (collectionResult.error) throw new Error(collectionResult.error.message);

  return { imported: cleanRows.length };
}

export async function mergeCollectionDuplicateRows(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length < 2) throw new Error("Choose at least two duplicate rows to merge.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pokemon_intelligence_collection_items")
    .select("*")
    .eq("profile_key", profileKey)
    .in("id", uniqueIds);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PokemonCollectionItem[];
  if (rows.length < 2) throw new Error("Duplicate rows could not be found.");

  const [keeper, ...rest] = rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const estimatedValues = rows.map((row) => row.estimated_value).filter((value): value is number => typeof value === "number");
  const mergedNotes = [
    keeper.notes,
    `Merged ${rows.length} duplicate rows on ${new Date().toISOString().slice(0, 10)}.`,
    ...rest.map((row) => row.notes).filter(Boolean),
  ].filter(Boolean).join("\n");

  const updateResult = await supabase
    .from("pokemon_intelligence_collection_items")
    .update({
      estimated_value: estimatedValues.length ? Math.max(...estimatedValues) : null,
      notes: mergedNotes,
      quantity: totalQuantity,
    })
    .eq("profile_key", profileKey)
    .eq("id", keeper.id);

  if (updateResult.error) throw new Error(updateResult.error.message);

  const deleteResult = await supabase
    .from("pokemon_intelligence_collection_items")
    .delete()
    .eq("profile_key", profileKey)
    .in("id", rest.map((row) => row.id));

  if (deleteResult.error) throw new Error(deleteResult.error.message);

  return { merged: rows.length, keptId: keeper.id };
}

const deletableTables = {
  collection: "pokemon_intelligence_collection_items",
  card: "pokemon_intelligence_cards",
  price: "pokemon_intelligence_price_observations",
  product: "pokemon_intelligence_products",
  purchase: "pokemon_intelligence_purchases",
  restock: "pokemon_intelligence_restock_observations",
  set: "pokemon_intelligence_sets",
  watchlist: "pokemon_intelligence_watchlist",
} as const;

const editableTables = deletableTables;

type EditableKind = keyof typeof editableTables;

type EditablePayload = Record<string, boolean | number | string | string[] | null>;

const allowedUpdateFields: Record<EditableKind, Set<string>> = {
  card: new Set(["image_url", "name", "notes", "number", "rarity", "set_name", "source_url", "subtypes", "supertype"]),
  collection: new Set(["acquired_at", "condition", "estimated_value", "item_kind", "item_name", "notes", "quantity", "storage_location"]),
  price: new Set(["confidence", "notes", "price", "product_name", "shipping", "source", "source_url"]),
  product: new Set(["image_url", "msrp", "name", "notes", "pack_count", "product_type", "release_date", "set_name", "source_url"]),
  purchase: new Set(["fees", "item_price", "notes", "product_name", "purchase_date", "purpose", "quantity", "retailer", "shipping", "source_url", "tax"]),
  restock: new Set(["confidence", "current_price", "msrp", "notes", "product_name", "retailer", "source_url", "stock_status"]),
  set: new Set(["era", "name", "notes", "release_date"]),
  watchlist: new Set(["enabled", "max_price", "name", "notes", "priority", "target_type"]),
};

export async function deletePokemonIntelligenceRecord(kind: keyof typeof deletableTables, id: string) {
  const supabase = await createClient();
  const table = deletableTables[kind];
  const { error } = await supabase.from(table).delete().eq("profile_key", profileKey).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updatePokemonIntelligenceRecord(kind: EditableKind, id: string, values: EditablePayload) {
  const supabase = await createClient();
  const table = editableTables[kind];
  const allowed = allowedUpdateFields[kind];
  const payload = Object.fromEntries(Object.entries(values).filter(([key]) => allowed.has(key)));

  if (!Object.keys(payload).length) {
    throw new Error("No editable fields were provided.");
  }

  const { error } = await supabase.from(table).update(payload as never).eq("profile_key", profileKey).eq("id", id);
  if (error) throw new Error(error.message);
}
