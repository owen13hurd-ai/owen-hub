import { normalizePlayerName } from "@/lib/dynasty/sources/nameMatch";

export type KtcMarketValue = {
  age: number | null;
  name: string;
  position: string;
  positionRank: string;
  rank: number;
  rookie: string;
  team: string;
  value: number | null;
};

const defaultKtcGoogleSheetId = "1n5aqip8iFCpltO8deiS7q9m3u_dFvKTZpwzfZXVTpgs";
const defaultKtcSheetName = "SF";

function parseNumber(value: string) {
  const number = Number(value.trim());
  return Number.isNaN(number) ? null : number;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      isInsideQuotes = !isInsideQuotes;
    } else if (character === "," && !isInsideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

export function getPublishedGoogleSheetCsvUrl(
  sheetId: string,
  sheetName = defaultKtcSheetName,
) {
  const encodedSheetName = encodeURIComponent(sheetName);

  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}&range=A1:G500`;
}

export async function getKtcGoogleSheetValues() {
  const sheetId = process.env.KTC_GOOGLE_SHEET_ID ?? defaultKtcGoogleSheetId;
  const sheetName = process.env.KTC_GOOGLE_SHEET_NAME ?? defaultKtcSheetName;

  try {
    const response = await fetch(getPublishedGoogleSheetCsvUrl(sheetId, sheetName), {
      next: { revalidate: 60 * 30 },
    });

    if (!response.ok) {
      throw new Error(`Google Sheet returned ${response.status}`);
    }

    const csv = await response.text();
    const rows = csv.split(/\r?\n/).filter(Boolean);
    const values = new Map<string, KtcMarketValue>();

    rows.slice(1).forEach((row, index) => {
      const columns = parseCsvLine(row);
      const name = columns[0] ?? "";

      if (!name) {
        return;
      }

      values.set(normalizePlayerName(name), {
        name,
        positionRank: columns[1] ?? "",
        position: columns[2] ?? "",
        team: columns[3] ?? "",
        value: parseNumber(columns[4] ?? ""),
        age: parseNumber(columns[5] ?? ""),
        rookie: columns[6] ?? "",
        rank: index + 1,
      });
    });

    return {
      label: "KTC",
      status: "live" as const,
      detail: `${values.size} live values loaded from Google Sheet ${sheetName}`,
      values,
    };
  } catch {
    return {
      label: "KTC",
      status: "error" as const,
      detail: "Google Sheet failed; using imported CSV fallback",
      values: new Map<string, KtcMarketValue>(),
    };
  }
}
