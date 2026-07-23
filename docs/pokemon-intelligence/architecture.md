# Pokemon Intelligence Architecture

Pokemon Intelligence is the collecting, buying, pricing, and decision layer for Pokemon inside Owen's Hub.

It is separate from the competitive Pokemon tools, but both live under the same Hub.

## MVP Goal

Track products, purchases, collection items, prices, and watchlist/restock observations manually first. Manual-first keeps the data trustworthy before adding APIs and alerts.

## Core Modules

- Product catalog: sealed products, sets, cards, MSRP, release dates, and source links.
- Collection tracker: owned items, quantity, condition, storage location, and notes.
- Purchase calculator: landed cost, fees, resale estimate, profit, and ROI.
- Price observations: source, observed price, date, confidence, and notes.
- Watchlist: products or sets Owen wants near MSRP.
- Restock log: manual or connector-based stock observations.
- Jarvis decision notes: purchase reasoning saved to Obsidian.

## Data Flow

```text
Pokemon Intelligence UI
  |
  |-- Product / Collection / Purchase forms
  |-- Calculator and export buttons
  |-- Watchlist and manual restock log
  |
Next.js API routes
  |
Supabase tables
  |
Obsidian draft decision notes
```

## Source Policy

Use reliable sources first:

1. Manual purchase records and receipts
2. Official retailer/API data where permitted
3. Official Pokemon product/release pages
4. Marketplace APIs with clear terms
5. Community signals only when labeled with lower confidence

Do not build checkout automation, CAPTCHA bypassing, queue bypassing, or prohibited scraping.

## Future Integrations

Only add integrations after manual workflows work:

- Pokemon TCG API for cards/sets
- eBay Browse API for active listings
- Best Buy API for allowed availability checks
- Discord webhook notifications
- Reddit/Bluesky monitoring with rate limits
- Paid pricing APIs only after Owen approves cost
