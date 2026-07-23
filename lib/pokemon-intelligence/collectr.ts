export type CollectrImportRow = {
  cardName: string;
  condition: string | null;
  estimatedValue: number | null;
  itemKind: string;
  notes: string | null;
  quantity: number;
  rarity: string | null;
  setName: string | null;
  sourceNumber: string | null;
  storageLocation: string | null;
};

export type CollectrImportPreview = {
  headers: string[];
  ignoredRows: number;
  rows: CollectrImportRow[];
  warnings: string[];
};

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseMoneyLike(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/[$,%\s,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseQuantity(value: string | null | undefined) {
  const parsed = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function valueFor(record: Record<string, string>, candidates: string[]) {
  for (const candidate of candidates) {
    const value = record[normalizeHeader(candidate)];
    if (value) return value.trim();
  }
  return "";
}

export function parseCollectrCsv(csv: string): CollectrImportPreview {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], ignoredRows: 0, rows: [], warnings: ["The CSV did not include any data rows."] };
  }

  const headers = splitCsvLine(lines[0]);
  const normalizedHeaders = headers.map(normalizeHeader);
  const warnings: string[] = [];
  const rows: CollectrImportRow[] = [];
  let ignoredRows = 0;

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const record = Object.fromEntries(normalizedHeaders.map((header, index) => [header, cells[index] ?? ""]));
    const cardName = valueFor(record, ["Card", "Card Name", "Name", "Product", "Item", "Title"]);

    if (!cardName) {
      ignoredRows += 1;
      continue;
    }

    const setName = valueFor(record, ["Set", "Set Name", "Expansion"]) || null;
    const number = valueFor(record, ["Number", "Card Number", "No", "#"]) || null;
    const rarity = valueFor(record, ["Rarity"]) || null;
    const condition = valueFor(record, ["Condition", "Grade"]) || null;
    const quantity = parseQuantity(valueFor(record, ["Quantity", "Qty", "Count"]));
    const estimatedValue = parseMoneyLike(valueFor(record, ["Market Price", "Market Value", "Value", "Total Value", "Price"]));
    const storageLocation = valueFor(record, ["Location", "Storage", "Folder"]) || "Collectr import";
    const notes = [
      "Imported from Collectr CSV.",
      number ? `Number: ${number}.` : "",
      rarity ? `Rarity: ${rarity}.` : "",
    ].filter(Boolean).join(" ");

    rows.push({
      cardName,
      condition,
      estimatedValue,
      itemKind: "card",
      notes,
      quantity,
      rarity,
      setName,
      sourceNumber: number,
      storageLocation,
    });
  }

  if (!normalizedHeaders.some((header) => ["card", "cardname", "name", "product", "item", "title"].includes(header))) {
    warnings.push("No obvious card/name column was found. Import may miss rows unless Collectr uses a different export format.");
  }

  return { headers, ignoredRows, rows, warnings };
}
