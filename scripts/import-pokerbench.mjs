import { mkdir, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

const sourceBase = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main";
const sourcePage = "https://huggingface.co/datasets/RZ412/PokerBench";
const outputPath = new URL("../public/data/pokerbench-test.json", import.meta.url);

const files = {
  postflop: "postflop_10k_test_set_game_scenario_information.csv",
  preflop: "preflop_1k_test_set_game_scenario_information.csv",
};

const suitSymbols = { c: "♣", d: "♦", h: "♥", s: "♠" };
const positions = new Set(["UTG", "HJ", "CO", "BTN", "SB", "BB"]);

function cards(value = "") {
  return value.match(/.{2}/g)?.map((card) => `${card[0]}${suitSymbols[card[1]] ?? card[1]}`) ?? [];
}

function moves(value = "") {
  return Array.from(value.matchAll(/'([^']+)'/g), (match) => match[1]);
}

function cleanAction(value = "") {
  return value.replaceAll("_", " ").replace(/\b(IP|OOP)\b/g, "$1:").replace(/\s+/g, " ").trim();
}

function preflopHistory(value = "") {
  const parts = value.split("/").filter(Boolean);
  const history = [];
  for (let index = 0; index < parts.length; index += 2) {
    history.push(`${parts[index]} ${parts[index + 1] ?? ""}`.trim());
  }
  return history;
}

function postflopHistory(value = "") {
  const parts = value.split("/").filter(Boolean);
  const history = [];
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index] === "dealcards" && parts[index + 1]) {
      history.push(`Board deals ${cards(parts[index + 1]).join(" ")}`);
      index += 1;
    } else {
      history.push(cleanAction(parts[index]));
    }
  }
  return history;
}

function position(value, fallback) {
  return positions.has(value) ? value : fallback;
}

function normalizeDecision(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function baseSpot(id, correctDecision, options) {
  const optimalAction = normalizeDecision(correctDecision);
  return {
    id: `pokerbench-${id}`,
    difficulty: "Advanced",
    frequencies: {},
    gameType: "Cash",
    options: options.map(normalizeDecision),
    optimalAction,
    source: "PokerBench",
    sourceNotes: "Correct action supplied by PokerBench. The dataset does not include mixed frequencies or a written explanation.",
    sourceUrl: sourcePage,
  };
}

function normalizePostflop(row, index) {
  const street = row.evaluation_at;
  const board = [row.board_flop, street === "Flop" ? "" : row.board_turn, street === "River" ? row.board_river : ""]
    .filter(Boolean)
    .flatMap(cards);
  const heroCards = cards(row.holding);
  const history = [...preflopHistory(row.preflop_action), ...postflopHistory(row.postflop_action)];
  const isInPosition = row.hero_position === "IP";

  return {
    ...baseSpot(`postflop-${index}`, row.correct_decision, moves(row.available_moves)),
    actionHistory: history,
    board,
    explanation: "This answer is the PokerBench benchmark label for the exact game state shown.",
    heroCards,
    playerToAct: `Hero ${row.hero_position}`,
    position: isInPosition ? "BTN" : "BB",
    potSize: `${row.pot_size}bb`,
    previousAction: history.at(-1) ?? "Action checked to Hero",
    stackSize: "PokerBench benchmark spot",
    title: `${street}: ${row.hero_position} with ${heroCards.join(" ")}`,
  };
}

function normalizePreflop(row, index) {
  const heroCards = cards(row.hero_holding);
  const history = preflopHistory(row.prev_line);
  return {
    ...baseSpot(`preflop-${index}`, row.correct_decision, moves(row.available_moves)),
    actionHistory: history,
    board: [],
    explanation: "This answer is the PokerBench benchmark label for the exact preflop action sequence shown.",
    heroCards,
    playerToAct: `Hero in ${row.hero_pos}`,
    position: position(row.hero_pos, "BTN"),
    potSize: `${row.pot_size}bb`,
    previousAction: history.at(-1) ?? "Hero is first to act",
    stackSize: `${row.num_players}-handed benchmark spot`,
    title: `Preflop: ${row.hero_pos} with ${heroCards.join(" ")}`,
  };
}

async function download(file) {
  const response = await fetch(`${sourceBase}/${file}?download=true`);
  if (!response.ok) throw new Error(`PokerBench download failed: ${response.status} ${file}`);
  return response.text();
}

const [postflopCsv, preflopCsv] = await Promise.all([download(files.postflop), download(files.preflop)]);
const postflopRows = parse(postflopCsv, { columns: true, skip_empty_lines: true });
const preflopRows = parse(preflopCsv, { columns: true, skip_empty_lines: true });
const spots = [
  ...postflopRows.map(normalizePostflop),
  ...preflopRows.map(normalizePreflop),
];

if (spots.length !== 11000) throw new Error(`Expected 11,000 PokerBench spots, received ${spots.length}`);

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(outputPath, JSON.stringify({
  importedAt: new Date().toISOString(),
  license: "Apache-2.0",
  source: sourcePage,
  spots,
}));

console.log(`Imported ${spots.length.toLocaleString()} PokerBench spots.`);
