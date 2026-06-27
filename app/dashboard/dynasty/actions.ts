"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { DynastyRowsByScope, Position } from "@/types/dynasty";

// Version 2 starts from the refreshed FantasyCalc player pool and market order.
const boardKey = "owen-main-v2";
const positions: Position[] = ["ALL", "QB", "RB", "WR", "TE"];

function isSavedRowsByScope(value: unknown): value is DynastyRowsByScope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const rowsByScope = value as Partial<DynastyRowsByScope>;

  return positions.every((position) => {
    const rows = rowsByScope[position];

    return (
      Array.isArray(rows) &&
      rows.every((row) => {
        if (!row || typeof row !== "object") {
          return false;
        }

        const candidate = row as Record<string, unknown>;

        if (typeof candidate.id !== "string") {
          return false;
        }

        if (candidate.type === "player") {
          return typeof candidate.playerId === "string";
        }

        if (candidate.type === "tier") {
          return typeof candidate.tierId === "string";
        }

        return false;
      })
    );
  });
}

export async function getSavedDynastyBoard() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dynasty_boards")
    .select("rows_by_scope")
    .eq("board_key", boardKey)
    .maybeSingle();

  if (error || !isSavedRowsByScope(data?.rows_by_scope)) {
    return null;
  }

  return data.rows_by_scope;
}

export async function saveDynastyBoard(rowsByScope: DynastyRowsByScope) {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: "Supabase is not configured.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dynasty_boards").upsert(
    {
      board_key: boardKey,
      label: "Owen's Dynasty Board",
      rows_by_scope: rowsByScope,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "board_key",
    },
  );

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: "Saved",
  };
}
