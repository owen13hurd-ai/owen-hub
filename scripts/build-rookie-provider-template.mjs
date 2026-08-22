import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const inputPath = resolve(process.argv[2] ?? "data/rookies-2020-2026.csv");
const outputPath = resolve(process.argv[3] ?? "public/data/rookie-provider-enrichment-template-2020-2026.csv");
const identityFields = ["name", "position", "class_year", "school", "external_id", "scoring_date"];
const providerFields = [
  "career_yprr",
  "best_yprr",
  "receiving_yprr",
  "yards_after_contact_per_attempt",
  "missed_tackles_per_attempt",
  "ras",
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const rows = parse(await readFile(inputPath, "utf8"), { bom: true, columns: true, skip_empty_lines: true, trim: true });
const fields = [...identityFields, ...providerFields];
const output = [
  fields.join(","),
  ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")),
].join("\n") + "\n";

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output);
console.log(JSON.stringify({ outputPath, players: rows.length, providerFields }, null, 2));
