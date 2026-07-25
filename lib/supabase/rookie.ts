import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function createRookieClient() {
  return (await createClient()) as unknown as SupabaseClient<Database>;
}
