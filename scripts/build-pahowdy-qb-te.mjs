import { writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

const databaseId = "19suThny5WpYuBpv7tKrLe6_qtj_j9DQxHA8vftjkRd0";
const earlyEntryUrls = { 2025: "https://www.nfl.com/news/fifty-five-players-granted-special-eligibility-for-2025-nfl-draft", 2026: "https://www.nfl.com/news/forty-two-players-granted-special-eligibility-for-2026-nfl-draft" };
const rankingIds = { 2025: "1f5u4SGrlrop1H0hrFZMYoIoxAfP4zVeFDI9ZmYKs5IM", 2026: "1ZnhkpoJspVQ8RDowAiXnWKL4_bBpcyki-JHkZhe5xVQ" };
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
const aliases = new Map([[normalize("Cam Ward"), normalize("Cameron Ward")]]);
const number = (value) => value && !["-", "UNK"].includes(value) && Number.isFinite(Number(String(value).replace(/[%,$]/g, ""))) ? Number(String(value).replace(/[%,$]/g, "")) : null;
const percent = (value) => value?.includes("%") && number(value) !== null ? number(value) / 100 : number(value);
const csv = async (id, sheet) => parse(await (await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`)).text(), { relax_column_count: true, skip_empty_lines: false });

const prospects = [];
for (const [classYear, id] of Object.entries(rankingIds)) {
  const rows = await csv(id, "");
  for (const row of rows.slice(1)) for (const [position, index] of [["QB", 2], ["TE", 5]]) {
    const name = String(row[index] ?? "").replace(/\s*\([0-9.]+\)\s*$/, "").trim();
    if (name) prospects.push({ classYear: Number(classYear), name, position });
  }
}

const output = [];
const earlyEntries = new Map();
for (const [year, url] of Object.entries(earlyEntryUrls)) {
  const html = await (await fetch(url)).text();
  earlyEntries.set(Number(year), new Set(prospects.filter((player) => Number(year) === player.classYear && html.toLowerCase().includes(player.name.toLowerCase())).map((player) => normalize(player.name))));
}
for (const position of ["QB", "TE"]) {
  const rows = await csv(databaseId, position);
  const byName = new Map(rows.slice(2).filter((row) => row[4]).map((row) => [normalize(row[4]), row]));
  for (const prospect of prospects.filter((entry) => entry.position === position)) {
    const key = normalize(prospect.name);
    const row = byName.get(key) ?? byName.get(aliases.get(key));
    if (!row || Number(row[6]) !== prospect.classYear) continue;
    const weight = number(row[449]);
    const height = number(row[450]);
    const forty = number(row[452]);
    output.push({
      ...prospect,
      sourceName: row[4], birthdate: row[10] && row[10] !== "UNK" ? row[10] : null,
      ageAtDraft: number(row[11]), draftRound: number(row[7]), overallPick: number(row[8]),
      earlyDeclare: earlyEntries.get(prospect.classYear)?.has(normalize(prospect.name)) ?? null,
      nflTeam: row[12] && row[12] !== "UNK" ? row[12] : null, school: row[13] || null,
      conference: row[14] || null, weightPounds: weight, heightInches: height, fortySeconds: forty,
      bmi: number(row[461]) ?? (height && weight ? weight * 703 / (height * height) : null),
      speedScore: weight && forty ? weight * 200 / Math.pow(forty, 4) : null,
      careerYprr: position === "TE" ? number(row[34]) : null,
      bestYprr: position === "TE" ? number(row[71]) : null,
      targetShare: position === "TE" ? percent(row[43]) : null,
    });
  }
}

await writeFile("data/pahowdy-qb-te-2025-2026.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ matches: output.length, prospects: prospects.length }, null, 2));
