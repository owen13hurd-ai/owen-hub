import assert from "node:assert/strict";
import test from "node:test";

import { calculatePurchase } from "../lib/pokemon-intelligence/calculations.ts";
import { bestCatalogMarketPrice } from "../lib/pokemon-intelligence/catalog-pricing.ts";
import { findCollectionDuplicates, findOpportunityMatches } from "../lib/pokemon-intelligence/opportunities.ts";
import { summarizePokemonPortfolio } from "../lib/pokemon-intelligence/portfolio.ts";
import { buildReleaseRadar, findUnwatchedUpcoming } from "../lib/pokemon-intelligence/release-radar.ts";

test("calculates landed cost, fees, profit, ROI, and break-even price", () => {
  const result = calculatePurchase({
    estimatedResalePrice: 65,
    extraFees: 0,
    feesPercent: 13,
    itemPrice: 50,
    quantity: 2,
    shipping: 0,
    tax: 7,
  });

  assert.deepEqual(result, {
    breakEvenUnitPrice: 61.49,
    estimatedProfit: 6.1,
    landedCost: 107,
    marketplaceFees: 16.9,
    netProceeds: 113.1,
    resaleGross: 130,
    roiPercent: 5.7,
  });
});

test("protects against invalid quantity and negative fee percent", () => {
  const result = calculatePurchase({
    estimatedResalePrice: 40,
    extraFees: 2,
    feesPercent: -5,
    itemPrice: 35,
    quantity: 0,
    shipping: 5,
    tax: 3,
  });

  assert.equal(result.landedCost, 45);
  assert.equal(result.marketplaceFees, 0);
  assert.equal(result.breakEvenUnitPrice, 45);
});

test("finds watchlist price and restock matches", () => {
  const snapshot = {
    cards: [],
    collectionItems: [],
    priceObservations: [{
      confidence: "high",
      created_at: "2026-07-20T00:00:00Z",
      id: "price-1",
      notes: null,
      observed_at: "2026-07-20T00:00:00Z",
      price: 39.99,
      product_id: null,
      product_name: "Prismatic Evolutions ETB",
      shipping: 0,
      source: "Manual",
      source_url: null,
    }],
    products: [],
    purchases: [],
    restockObservations: [{
      confidence: "medium",
      created_at: "2026-07-20T00:00:00Z",
      current_price: 44.99,
      id: "restock-1",
      msrp: 49.99,
      notes: null,
      observed_at: "2026-07-20T00:00:00Z",
      product_id: null,
      product_name: "Prismatic Evolutions ETB",
      retailer: "Target",
      source_url: null,
      stock_status: "in-stock",
    }],
    sets: [],
    watchlist: [{
      created_at: "2026-07-20T00:00:00Z",
      enabled: true,
      id: "watch-1",
      max_price: 49.99,
      name: "Prismatic Evolutions",
      notes: null,
      priority: "critical",
      target_type: "set",
    }],
  };

  const matches = findOpportunityMatches(snapshot, new Date("2026-07-22T00:00:00Z"));
  assert.equal(matches.length, 2);
  assert.equal(matches[0].status, "buy-zone");
  assert.equal(matches[0].valueDelta, 10);
});

test("finds duplicate collection entries", () => {
  const snapshot = {
    cards: [],
    collectionItems: [
      { acquired_at: null, condition: "NM", created_at: "", estimated_value: 10, id: "1", item_kind: "card", item_name: "Pikachu", notes: null, product_id: null, quantity: 1, storage_location: "Binder" },
      { acquired_at: null, condition: "NM", created_at: "", estimated_value: 10, id: "2", item_kind: "card", item_name: "Pikachu", notes: null, product_id: null, quantity: 2, storage_location: "Binder" },
    ],
    priceObservations: [],
    products: [],
    purchases: [],
    restockObservations: [],
    sets: [],
    watchlist: [],
  };

  const duplicates = findCollectionDuplicates(snapshot);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].totalQuantity, 3);
  assert.deepEqual(duplicates[0].ids, ["1", "2"]);
});

test("summarizes collection portfolio value and exposure", () => {
  const snapshot = {
    cards: [],
    collectionItems: [
      { acquired_at: null, condition: "sealed", created_at: "", estimated_value: 80, id: "1", item_kind: "sealed", item_name: "ETB", notes: null, product_id: null, quantity: 2, storage_location: "Closet" },
      { acquired_at: null, condition: "NM", created_at: "", estimated_value: 25, id: "2", item_kind: "card", item_name: "Pikachu", notes: null, product_id: null, quantity: 1, storage_location: "Binder" },
    ],
    priceObservations: [],
    products: [],
    purchases: [
      { created_at: "", fees: 0, id: "p1", item_price: 50, jarvis_note_path: null, notes: null, product_id: null, product_name: "ETB", purchase_date: "", purpose: "collecting", quantity: 2, retailer: "Target", shipping: 0, source_url: null, tax: 10, total_cost: 110 },
    ],
    restockObservations: [],
    sets: [],
    watchlist: [],
  };

  const summary = summarizePokemonPortfolio(snapshot);
  assert.equal(summary.estimatedValue, 185);
  assert.equal(summary.purchaseSpend, 110);
  assert.equal(summary.profitLoss, 75);
  assert.equal(summary.valueByKind[0].label, "sealed");
  assert.equal(summary.valueByLocation[0].label, "Closet");
});

test("builds release radar from sets, products, and watchlist", () => {
  const snapshot = {
    cards: [],
    collectionItems: [],
    priceObservations: [],
    products: [
      { created_at: "", id: "p1", image_url: null, msrp: 49.99, name: "Mega Evolution ETB", notes: null, pack_count: 9, product_type: "sealed", release_date: "2026-08-01", set_name: "Mega Evolution", source_url: null },
      { created_at: "", id: "p2", image_url: null, msrp: 29.99, name: "Unwatched Bundle", notes: null, pack_count: 6, product_type: "sealed", release_date: "2026-08-05", set_name: "Unwatched", source_url: null },
    ],
    purchases: [],
    restockObservations: [],
    sets: [
      { created_at: "", era: "Scarlet & Violet", id: "s1", name: "Mega Evolution", notes: null, release_date: "2026-08-01" },
    ],
    watchlist: [
      { created_at: "", enabled: true, id: "w1", max_price: 50, name: "Mega Evolution", notes: null, priority: "critical", target_type: "set" },
    ],
  };

  const radar = buildReleaseRadar(snapshot, new Date("2026-07-22T00:00:00"));
  assert.equal(radar[0].daysUntil, 10);
  assert.equal(radar[0].isWatched, true);
  assert.equal(findUnwatchedUpcoming(snapshot, new Date("2026-07-22T00:00:00")).length, 1);
});

test("extracts the best market price from catalog pricing", () => {
  const summary = bestCatalogMarketPrice({
    normal: { market: 1.25 },
    reverseHolofoil: { market: 2.5 },
  });

  assert.deepEqual(summary, { label: "Reverse Holofoil", price: 2.5 });
  assert.equal(bestCatalogMarketPrice(null), null);
});
