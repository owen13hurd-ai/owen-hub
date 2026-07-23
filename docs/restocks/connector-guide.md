# Store Connector Guide

## Connector Contract

Each connector implements `RestockConnector` with:

- `id` and `name`
- `getStatus()` for setup and health reporting
- `check()` returning normalized `RestockEvent[]`

Add the connector to `lib/restocks/connectors/registry.ts`. Never expose API keys to client components.

## Source Ranking

| Source | Support | Speed | Reliability | Main limitation |
| --- | --- | --- | --- | --- |
| Best Buy Products API | Official API | Fast | High | Requires developer key |
| Pokémon support/preorder pages | Official page | Medium | High for dates | Not an inventory feed |
| Pokémon Center product pages | Official page | Potentially fast | Medium | No supported public stock API |
| Reddit | Public/community API | Fast | Medium | False positives and API approval/rate limits |
| Bluesky | Public social API | Fast | Medium | Search limits and unverified posts |
| Discord announcements | Server-specific | Very fast | High when source is trusted | Requires server/bot access or an allowed feed |
| X | Commercial social API | Fast | Variable | Paid/restricted API access |
| TCGplayer | Official API for existing keys | Medium | High for market price | New API keys are not currently granted |
| PriceCharting | Commercial API | Medium | High for market history | Paid subscription |

## Retailer Policy

Target, Walmart, GameStop, Costco, Sam's Club, and similar stores must not be treated as if they have open consumer inventory APIs. Prefer official partner access where available, user-provided product URLs, low-frequency checks permitted by terms, and manual local verification.

## Adding Best Buy

1. Create a developer account at the Best Buy Developer Portal.
2. Add `BEST_BUY_API_KEY` to local and Vercel environment variables.
3. Refresh `/dashboard/restocks` and confirm Best Buy reports `Connected` under Sources.
