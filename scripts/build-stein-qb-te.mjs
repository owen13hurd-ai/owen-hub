import { writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

const statsId = "167k1l6dMPJOw1V0eQh-R1WHqtmEhqoeyS4DmePmhiYY";
const rankingsId = "1ZnhkpoJspVQ8RDowAiXnWKL4_bBpcyki-JHkZhe5xVQ";
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
const sourceAliases = new Map([[normalize("Joshua Cuevas"), normalize("Josh Cuevas")]]);
const number = (value) => value && !["-", "UNK", "#N/A"].includes(value) && Number.isFinite(Number(String(value).replace(/[,%$]/g, ""))) ? Number(String(value).replace(/[,%$]/g, "")) : null;
const percent = (value) => String(value ?? "").includes("%") && number(value) !== null ? number(value) / 100 : number(value);
const sheet = async (id, name = "") => parse(await (await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`)).text(), { relax_column_count: true, skip_empty_lines: false });

const rankings = await sheet(rankingsId);
const prospects = [];
for (const row of rankings.slice(1)) for (const [position, index] of [["QB", 2], ["TE", 5]]) {
  const name = String(row[index] ?? "").replace(/\s*\([0-9.]+\)\s*$/, "").trim();
  if (name) prospects.push({ classYear: 2026, name, position });
}

const output = [];
for (const position of ["QB", "TE"]) {
  const rows = await sheet(statsId, position);
  const byName = new Map(rows.slice(1).filter((row) => row[0]).map((row) => [normalize(row[0]), row]));
  for (const prospect of prospects.filter((player) => player.position === position)) {
    const prospectKey = normalize(prospect.name);
    const row = byName.get(sourceAliases.get(prospectKey) ?? prospectKey);
    if (!row) continue;
    output.push(position === "QB" ? {
      ...prospect, school: row[3] || null, games: number(row[7]), adjustedCompletionPercentage: percent(row[14]),
      adjustedYardsPerAttempt: number(row[20]), pffPassingGrade: number(row[27]), qbr: number(row[28]),
      rushingYardShare: percent(row[32]), epaPerDropback: number(row[34]), epaPerPlay: number(row[35]),
    } : {
      ...prospect, school: row[2] || null, games: number(row[6]), passPlayUsage: percent(row[8]),
      routes: number(row[19]), receivingYprr: number(row[21]), targetShare: percent(row[13]),
      receivingYardShare: percent(row[33]), pffReceivingGrade: number(row[28]),
      weightedDominator: percent(row[35]), receivingYardsPerTeamPassAttempt: number(row[36]), epaPerPlay: number(row[38]),
    });
  }
}

await writeFile("data/stein-2025-qb-te.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ matches: output.length, prospects: prospects.length }, null, 2));
