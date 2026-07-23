"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PokemonIntelligenceProduct, PokemonIntelligenceSnapshot } from "@/lib/pokemon-intelligence/types";

export const emptySnapshot: PokemonIntelligenceSnapshot = {
  cards: [],
  collectionItems: [],
  priceObservations: [],
  products: [],
  purchases: [],
  restockObservations: [],
  sets: [],
  watchlist: [],
};

export type CatalogSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
};

export type CatalogCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  supertype: string;
  subtypes?: string[];
  set: {
    name: string;
    series: string;
    releaseDate: string;
  };
  images?: {
    small?: string;
    large?: string;
  };
  tcgplayer?: {
    prices?: Record<string, { high?: number; low?: number; market?: number; mid?: number }>;
    url?: string;
    updatedAt?: string;
  };
};

export type EditKind = "card" | "collection" | "price" | "product" | "restock" | "watchlist";

export type EditState = {
  id: string;
  kind: EditKind;
  title: string;
  values: Record<string, boolean | number | string | string[] | null>;
};

export const editableFields: Record<EditKind, Array<{ key: string; label: string; type?: "checkbox" | "number" | "textarea" }>> = {
  card: [
    { key: "name", label: "Card name" },
    { key: "set_name", label: "Set" },
    { key: "number", label: "Number" },
    { key: "rarity", label: "Rarity" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  collection: [
    { key: "item_name", label: "Item name" },
    { key: "item_kind", label: "Kind" },
    { key: "quantity", label: "Quantity", type: "number" },
    { key: "condition", label: "Condition" },
    { key: "estimated_value", label: "Value each", type: "number" },
    { key: "storage_location", label: "Storage location" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  price: [
    { key: "product_name", label: "Product name" },
    { key: "source", label: "Source" },
    { key: "price", label: "Price", type: "number" },
    { key: "shipping", label: "Shipping", type: "number" },
    { key: "confidence", label: "Confidence" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  product: [
    { key: "name", label: "Product name" },
    { key: "product_type", label: "Type" },
    { key: "set_name", label: "Set" },
    { key: "msrp", label: "MSRP", type: "number" },
    { key: "pack_count", label: "Packs", type: "number" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  restock: [
    { key: "product_name", label: "Product name" },
    { key: "retailer", label: "Retailer" },
    { key: "stock_status", label: "Stock status" },
    { key: "current_price", label: "Current price", type: "number" },
    { key: "msrp", label: "MSRP", type: "number" },
    { key: "confidence", label: "Confidence" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  watchlist: [
    { key: "name", label: "Name" },
    { key: "target_type", label: "Target type" },
    { key: "max_price", label: "Max price", type: "number" },
    { key: "priority", label: "Priority" },
    { key: "enabled", label: "Enabled", type: "checkbox" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    toast.info("There is nothing to export yet.");
    return;
  }
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductSelect({ products, onChange }: { products: PokemonIntelligenceProduct[]; onChange?: (product: PokemonIntelligenceProduct | null) => void }) {
  return (
    <Select
      name="product_id"
      defaultValue="manual"
      onValueChange={(value) => onChange?.(products.find((product) => product.id === value) ?? null)}
    >
      <SelectTrigger className="h-10 w-full">
        <SelectValue placeholder="Manual entry" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="manual">Manual entry</SelectItem>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function cleanEditValues(kind: EditKind, values: EditState["values"]) {
  const cleaned = { ...values };
  if (kind === "collection") cleaned.quantity = Number(cleaned.quantity) || 1;
  for (const key of ["current_price", "estimated_value", "max_price", "msrp", "pack_count", "price", "shipping"]) {
    if (key in cleaned) cleaned[key] = cleaned[key] === "" || cleaned[key] === null ? null : Number(cleaned[key]);
  }
  return cleaned;
}
