import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFile } from "node:fs/promises";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const file = process.argv[2];
  if (!url || !key || !file) throw new Error("Supabase credentials and the Pahowdy WR CSV path are required.");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const users = (await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })).data.users;
  const user = [...users].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  if (!user) throw new Error("No Supabase user found.");
  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const number = (value?: string) => value && !["-", "UNK"].includes(value) && Number.isFinite(Number(value)) ? Number(value) : null;
  const text = await readFile(file, "utf8");
  const rows = parse(text, { relax_column_count: true, skip_empty_lines: false }) as string[][];
  const headers = rows[1];
  const column = (label: string) => {
    const index = headers.indexOf(label);
    if (index < 0) throw new Error(`Missing Pahowdy column: ${label}`);
    return index;
  };
  const indexes = { age: column("Age In Dy"), bmi: column("BMI"), college: column("College"), conference: column("Conference"), dob: column("DOB"), forty: column("40 Time"), height: column("height(lns)"), name: column("Name"), weight: column("weight(lb)") };
  const playersResult = await supabase.from("rookie_players").select("id,name,class_year,position").eq("user_id", user.id).in("class_year", [2025, 2026]).eq("position", "WR");
  if (playersResult.error) throw playersResult.error;
  const players = new Map(playersResult.data.map((player) => [`${player.class_year}:${normalize(player.name)}`, player]));
  const sourceLookup = await supabase.from("rookie_sources").select("id").eq("user_id", user.id).eq("label", "Pahowdy College Database — biographical/combine fields").maybeSingle();
  if (sourceLookup.error) throw sourceLookup.error;
  let sourceId = sourceLookup.data?.id;
  if (!sourceId) {
    const made = await supabase.from("rookie_sources").insert({
      accessed_at: new Date().toISOString(), author: "Pahowdy", label: "Pahowdy College Database — biographical/combine fields",
      license: "User-provided database permits download/copy; underlying PFF and Sports Reference statistical columns excluded",
      methodology_class: "partial", publication: "Pahowdy's College Database", reliability: "medium",
      summary: "Only identity, age, school, conference, and factual combine measurements imported. No PFF, Sports Reference, proprietary grades, or Pahowdy model scores used.",
      url: "https://linktr.ee/pahowdy", user_id: user.id,
    }).select("id").single();
    if (made.error) throw made.error;
    sourceId = made.data.id;
  }
  let matched = 0;
  let athletic = 0;
  let metrics = 0;
  for (const row of rows.slice(2)) {
    const classYear = number(row[6]);
    if (classYear !== 2025 && classYear !== 2026) continue;
    const player = players.get(`${classYear}:${normalize(row[indexes.name] ?? "")}`);
    if (!player) continue;
    matched += 1;
    const age = number(row[indexes.age]);
    const height = number(row[indexes.height]);
    const weight = number(row[indexes.weight]);
    const forty = number(row[indexes.forty]);
    const suppliedBmi = number(row[indexes.bmi]);
    const bmi = suppliedBmi ?? (height && weight ? weight * 703 / (height * height) : null);
    const speedScore = weight && forty ? weight * 200 / Math.pow(forty, 4) : null;
    const dob = row[indexes.dob]?.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) ? new Date(`${row[indexes.dob]} 12:00:00 UTC`).toISOString().slice(0, 10) : null;
    const update = await supabase.from("rookie_players").update({ age_at_draft: age, birthdate: dob, bmi, conference: row[indexes.conference] || null, height_inches: height, school: row[indexes.college] || null, updated_at: new Date().toISOString(), weight_pounds: weight }).eq("id", player.id);
    if (update.error) throw update.error;
    if ([forty, height, weight, bmi, speedScore].some((value) => value !== null)) {
      const existing = await supabase.from("rookie_athletic_tests").select("id").eq("player_id", player.id).eq("source_id", sourceId).limit(1).maybeSingle();
      if (existing.error) throw existing.error;
      const payload = { event_type: "combine" as const, forty_seconds: forty, player_id: player.id, source_id: sourceId, speed_score: speedScore, user_id: user.id };
      const saved = existing.data ? await supabase.from("rookie_athletic_tests").update(payload).eq("id", existing.data.id) : await supabase.from("rookie_athletic_tests").insert(payload);
      if (saved.error) throw saved.error;
      athletic += 1;
    }
    const values = [{ key: "age_at_draft", value: age }, { key: "bmi", value: bmi }, { key: "speed_score", value: speedScore }].filter((entry): entry is { key: string; value: number } => entry.value !== null);
    if (values.length) {
      const saved = await supabase.from("rookie_player_metrics").upsert(values.map((entry) => ({ as_of_date: `${classYear}-04-30`, confidence: "medium", metric_key: entry.key, player_id: player.id, source_id: sourceId, user_id: user.id, value: entry.value })), { onConflict: "player_id,metric_key,as_of_date,source_id" });
      if (saved.error) throw saved.error;
      metrics += values.length;
    }
  }
  console.log(JSON.stringify({ athleticRows: athletic, matched, metricRows: metrics }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
