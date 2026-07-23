import { formatMoney, formatPercent } from "./calculations";
import { findCollectionDuplicates, findOpportunityMatches } from "./opportunities";
import { summarizePokemonPortfolio } from "./portfolio";
import { buildReleaseRadar, findUnwatchedUpcoming } from "./release-radar";
import type { PokemonIntelligenceSnapshot } from "./types";

function today(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function lines(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None yet.";
}

export function buildPokemonRecapNote(snapshot: PokemonIntelligenceSnapshot, date = new Date()) {
  const dateLabel = today(date);
  const portfolio = summarizePokemonPortfolio(snapshot);
  const matches = findOpportunityMatches(snapshot, date);
  const buyZone = matches.filter((match) => match.status === "buy-zone").slice(0, 8);
  const watch = matches.filter((match) => match.status === "watch").slice(0, 8);
  const stale = matches.filter((match) => match.status === "stale").slice(0, 8);
  const duplicates = findCollectionDuplicates(snapshot).slice(0, 8);
  const releases = buildReleaseRadar(snapshot, date).filter((item) => item.status === "upcoming").slice(0, 8);
  const unwatched = findUnwatchedUpcoming(snapshot, date).slice(0, 8);

  const path = `03 Knowledge/Pokemon/Summaries/Pokemon Intelligence Recap - ${dateLabel}.md`;
  const content = `---
type: summary
status: draft
source: api
confidence: medium
created: ${dateLabel}
updated: ${dateLabel}
related_records:
  - pokemon_intelligence
tags:
  - pokemon
  - collection
  - recap
---

# Pokemon Intelligence Recap - ${dateLabel}

## Portfolio Snapshot

- Estimated collection value: ${formatMoney(portfolio.estimatedValue)}
- Purchase spend tracked: ${formatMoney(portfolio.purchaseSpend)}
- Estimated P/L: ${formatMoney(portfolio.profitLoss)} (${formatPercent(portfolio.profitLossPercent)})
- Collection quantity: ${portfolio.quantity}
- Collection rows: ${portfolio.itemCount}

## Top Holdings

${lines(portfolio.topItems.slice(0, 8).map((item) => `${item.name} · ${item.quantity}x · ${formatMoney(item.value)} · ${item.location ?? "No location"}`))}

## Buy Zone Signals

${lines(buyZone.map((match) => `${match.title} at ${match.source} · ${formatMoney(match.currentPrice)} vs target ${match.targetPrice === null ? "not set" : formatMoney(match.targetPrice)} · ${match.ageDays}d old`))}

## Watch Signals

${lines(watch.map((match) => `${match.title} at ${match.source} · ${formatMoney(match.currentPrice)} · ${match.ageDays}d old`))}

## Upcoming Releases

${lines(releases.map((item) => `${item.name} · ${item.releaseDate ?? "No date"} · ${item.daysUntil ?? "?"}d · ${item.isWatched ? "watched" : "missing watch"}`))}

## Needs Watchlist Coverage

${lines(unwatched.map((item) => `${item.name} · ${item.releaseDate ?? "No date"} · ${item.subtitle}`))}

## Cleanup Queue

${lines([
  ...stale.map((match) => `Stale signal: ${match.title} from ${match.source} · ${match.ageDays}d old`),
  ...duplicates.map((duplicate) => `Possible duplicate: ${duplicate.name} · ${duplicate.count} rows · ${duplicate.totalQuantity} total qty`),
])}

## Notes

- This recap is generated from Owen's Hub structured records.
- Values are estimates based on manual/imported data and dated price observations.
- Review sources before buying or treating any value as current.
`;

  return { content, path };
}
