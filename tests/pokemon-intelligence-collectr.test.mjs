import assert from "node:assert/strict";
import test from "node:test";

import { parseCollectrCsv, parseMoneyLike } from "../lib/pokemon-intelligence/collectr.ts";

test("parses Collectr-style CSV rows into collection import rows", () => {
  const preview = parseCollectrCsv(`Card Name,Set,Card Number,Rarity,Condition,Quantity,Market Value
"Pikachu, Full Art",Surging Sparks,238,Ultra Rare,Near Mint,2,"$24.50"
Charmander,Obsidian Flames,026,Common,Lightly Played,1,$0.25`);

  assert.equal(preview.rows.length, 2);
  assert.equal(preview.ignoredRows, 0);
  assert.equal(preview.rows[0].cardName, "Pikachu, Full Art");
  assert.equal(preview.rows[0].setName, "Surging Sparks");
  assert.equal(preview.rows[0].quantity, 2);
  assert.equal(preview.rows[0].estimatedValue, 24.5);
});

test("parses currency-like values", () => {
  assert.equal(parseMoneyLike("$1,234.56"), 1234.56);
  assert.equal(parseMoneyLike(""), null);
});
