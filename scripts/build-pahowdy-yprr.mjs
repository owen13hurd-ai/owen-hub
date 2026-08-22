import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parse } from "csv-parse/sync";

const args = process.argv.slice(2).filter((value) => value !== "--");
const sourcePath = args[0];
if (!sourcePath) throw new Error("Pass the downloaded Pahowdy WR CSV path.");

const cohortPath = resolve(args[1] ?? "data/rookies-2020-2026.csv");
const outputPath = resolve(args[2] ?? "data/pahowdy-yprr-2020-2025.json");
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
const number = (value) => value && !["-", "UNK"].includes(value) && Number.isFinite(Number(value)) ? Number(value) : null;

const cohort = parse(await readFile(cohortPath, "utf8"), { bom: true, columns: true, skip_empty_lines: true, trim: true });
const rows = parse(await readFile(resolve(sourcePath), "utf8"), { relax_column_count: true, skip_empty_lines: false });
const headers = rows[1];
const column = (label) => {
  const index = headers.indexOf(label);
  if (index < 0) throw new Error(`Missing Pahowdy column: ${label}`);
  return index;
};
const indexes = { classYear: column("DY"), name: column("Name"), position: column("POS"), yprr: column("YRR") };
const byIdentity = new Map(rows.slice(2).map((row) => [`${row[indexes.classYear]}:${normalize(row[indexes.name])}`, row]));

const matched = cohort.flatMap((player) => {
  if (player.position !== "WR" || Number(player.class_year) > 2025) return [];
  const source = byIdentity.get(`${player.class_year}:${normalize(player.name)}`);
  const careerYprr = source ? number(source[indexes.yprr]) : null;
  return careerYprr === null ? [] : [{
    careerYprr,
    classYear: Number(player.class_year),
    externalId: player.external_id,
    name: player.name,
    position: player.position,
  }];
});

await writeFile(outputPath, JSON.stringify(matched, null, 2) + "\n");
console.log(JSON.stringify({ matched: matched.length, outputPath }, null, 2));
