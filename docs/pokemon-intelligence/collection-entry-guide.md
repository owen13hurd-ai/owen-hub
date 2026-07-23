# Pokemon Collection Entry Guide

Use this guide when adding items to the Pokemon Intelligence dashboard.

## Products

Create one product record for each unique sealed product, set, or card you want to track.

Good examples:

- Prismatic Evolutions ETB
- Surging Sparks Booster Bundle
- Mega Evolution Booster Box
- Black Bolt Booster Bundle

Include MSRP when known. If MSRP is uncertain, leave it blank or add a note.

## Purchases

Every purchase should include:

- Product
- Quantity
- Item price
- Tax
- Shipping
- Fees
- Purchase purpose
- Source or retailer

The landed cost is the true total you paid after tax, shipping, and fees.

## Collection Items

Collection items describe what you currently own.

Use storage location notes like:

- Closet shelf
- Binder
- Toploader box
- Grading pile

## Price Observations

Price observations are snapshots, not permanent truth.

## Collectr Import

Use the Import tab to preview a Collectr CSV export before saving it.

The importer looks for common column names such as:

- Card Name
- Set
- Card Number
- Rarity
- Condition
- Quantity
- Market Value

Imported rows create card records and collection item records. Review the preview first so bad columns do not create messy data.

Always capture:

- Source
- Price
- Date observed
- Confidence
- URL if available

## Purchase Decisions

Use the Jarvis decision note button for meaningful buying choices. It creates a draft note so you can keep the reasoning, risk, and source dates.

## Signals

The Signals tab compares watchlist items against manual price observations and restock observations.

Status labels mean:

- Buy zone: current price is at or below the target.
- Watch: current price is within 10% above target, or no target is set.
- Avoid: price is too far above target or the item is not in stock.
- Stale: the source observation is older than 14 days.

Signals are guidance, not automatic purchase decisions. Owen should still review the source and approve any purchase manually.

## Portfolio

The Portfolio tab summarizes your own data:

- Estimated collection value
- Purchase spend tracked in Owen's Hub
- Simple profit/loss estimate
- Value by item type
- Value by storage location
- Top holdings by estimated value

This is only as accurate as the values you enter or import. Treat it as a personal tracking estimate, not a tax or insurance report.

## Editing Records

Use the Edit buttons on cards, products, collection items, watchlist items, restock observations, and price observations to fix imported or manually entered data.

Good cleanup examples:

- Correct a Collectr-imported condition.
- Move an item from `Collectr import` to its real storage location.
- Update a watchlist max price.
- Mark a restock observation as stale by replacing it with a newer one.
- Fix an MSRP or pack count on a sealed product.

## Merging Duplicates

The Signals tab shows possible duplicate collection rows.

Use `Merge` when rows are truly the same item, condition, and storage location.

The merge action:

- keeps the oldest row
- sums the quantity
- keeps the highest estimated value
- appends a merge note
- deletes the duplicate rows

Do not merge rows that represent different variants, conditions, grading status, or storage locations.

## Release Radar

The Release Radar tab uses release dates from your sets and products.

It shows:

- Upcoming releases
- Recently released items
- Unscheduled records with no date
- Upcoming records that are not covered by an enabled watchlist item

Use the Watch button to quickly add an upcoming set or product to the watchlist. Release Radar depends on clean release dates, so add dates when importing or editing records.

## Catalog Price Snapshots

When searching cards in the Catalog tab, some Pokemon TCG API results include TCGplayer market prices.

Use:

- Card: saves only the card record.
- Card + price: saves the card and a price observation.

These are snapshots. Always check the source date and do not treat them as live pricing.

## Jarvis Recap Notes

Use `Create recap note` in the Jarvis tab to write a dated draft note into Obsidian.

The recap includes:

- Portfolio snapshot
- Top holdings
- Buy-zone signals
- Watch signals
- Upcoming releases
- Watchlist gaps
- Cleanup queue

These notes are draft summaries. Review them before treating them as confirmed memory.
