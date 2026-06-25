export type VgcPasteTeam = {
  creator: string;
  dateShared: string;
  description: string;
  event: string;
  fullName: string;
  id: string;
  pokepasteUrl: string;
  pokemon: string[];
  rank: string;
  replicaCode: string;
  replicaStatus: string;
  sourceUrl: string;
};

export type PokemonUsage = {
  count: number;
  name: string;
};

export type VgcPastesData = {
  lastCheckedAt: string;
  sheetName: string;
  sourceUrl: string;
  teams: VgcPasteTeam[];
  topPokemon: PokemonUsage[];
};

const championsMbSheetId = "1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw";
const championsMbGid = "1458357160";
const championsMbSourceUrl =
  "https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/htmlview?gid=1458357160";

function parseCsv(input: string) {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let isInQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (isInQuotes) {
      if (character === "\"" && nextCharacter === "\"") {
        currentField += "\"";
        index += 1;
      } else if (character === "\"") {
        isInQuotes = false;
      } else {
        currentField += character;
      }

      continue;
    }

    if (character === "\"") {
      isInQuotes = true;
    } else if (character === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (character === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
    } else if (character !== "\r") {
      currentField += character;
    }
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  return rows;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getHeaderIndex(headers: string[], label: string) {
  const normalizedLabel = normalizeHeader(label);

  return headers.findIndex((header) => normalizeHeader(header) === normalizedLabel);
}

function getCell(row: string[], index: number) {
  if (index < 0) {
    return "";
  }

  return row[index]?.trim() ?? "";
}

function buildUsage(teams: VgcPasteTeam[]) {
  const usageCounts = new Map<string, number>();

  teams.forEach((team) => {
    team.pokemon.forEach((pokemon) => {
      usageCounts.set(pokemon, (usageCounts.get(pokemon) ?? 0) + 1);
    });
  });

  return Array.from(usageCounts.entries())
    .map(([name, count]) => ({ count, name }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 12);
}

export async function getChampionsMbTeams(): Promise<VgcPastesData> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${championsMbSheetId}/export?format=csv&gid=${championsMbGid}`;
  const response = await fetch(csvUrl, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`VGCPastes returned ${response.status}.`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  const headerIndex = rows.findIndex((row) => getCell(row, 0) === "Team ID");

  if (headerIndex === -1) {
    throw new Error("Could not find the Champions M-B team header row.");
  }

  const headers = rows[headerIndex];
  const idIndex = getHeaderIndex(headers, "Team ID");
  const descriptionIndex = getHeaderIndex(headers, "Team Description");
  const fullNameIndex = getHeaderIndex(headers, "Full Name");
  const pokepasteIndex = getHeaderIndex(headers, "Pokepaste");
  const replicaStatusIndex = getHeaderIndex(headers, "Replica Status");
  const replicaCodeIndex = headers.findIndex((header) =>
    normalizeHeader(header).startsWith("replica code"),
  );
  const dateSharedIndex = getHeaderIndex(headers, "Date Shared");
  const eventIndex = getHeaderIndex(headers, "Tournament / Event");
  const rankIndex = getHeaderIndex(headers, "Rank");
  const sourceIndex = getHeaderIndex(headers, "Link to Source");
  const ownerIndex = getHeaderIndex(headers, "Owner");
  const pokemonStartIndex = getHeaderIndex(headers, "Pokemon Text for Copypasta");

  const teams = rows
    .slice(headerIndex + 1)
    .map((row) => {
      const id = getCell(row, idIndex);

      if (!id.startsWith("MB")) {
        return null;
      }

      const pokemon = row
        .slice(pokemonStartIndex, pokemonStartIndex + 6)
        .map((value) => value.trim())
        .filter(Boolean);

      return {
        creator: getCell(row, ownerIndex),
        dateShared: getCell(row, dateSharedIndex),
        description: getCell(row, descriptionIndex),
        event: getCell(row, eventIndex) || "-",
        fullName: getCell(row, fullNameIndex),
        id,
        pokepasteUrl: getCell(row, pokepasteIndex),
        pokemon,
        rank: getCell(row, rankIndex) || "-",
        replicaCode: getCell(row, replicaCodeIndex) || "None",
        replicaStatus: getCell(row, replicaStatusIndex),
        sourceUrl: getCell(row, sourceIndex),
      } satisfies VgcPasteTeam;
    })
    .filter((team): team is VgcPasteTeam => team !== null);

  return {
    lastCheckedAt: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
    sheetName: "Champions M-B",
    sourceUrl: championsMbSourceUrl,
    teams,
    topPokemon: buildUsage(teams),
  };
}
