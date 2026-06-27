"use client";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { BattleJournalData } from "@/lib/pokemon/battle-journal-types";

const profileKey = "owen-main";

export async function loadBattleJournalCloud() {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await createClient().from("pokemon_battle_journals").select("payload").eq("profile_key", profileKey).maybeSingle();
  if (error || !data?.payload) return null;
  return data.payload as BattleJournalData;
}

export async function saveBattleJournalCloud(payload: BattleJournalData) {
  if (!hasSupabaseConfig()) return false;
  const { error } = await createClient().from("pokemon_battle_journals").upsert({ profile_key: profileKey, payload, updated_at: new Date().toISOString() });
  return !error;
}
