# Pokémon Restock Hub

## Purpose

The Restock Hub is a personal buying assistant inside Owen's Hub. It normalizes product availability from approved sources, compares the price with MSRP, matches products against a personal watchlist, and prepares high-confidence notifications.

## Current Scope

- Restock dashboard at `/dashboard/restocks`
- Connector health and confidence labels
- Official Best Buy connector, enabled with `BEST_BUY_API_KEY`
- Device-saved watchlist
- Supabase schema for events, watchlist items, and preferred locations
- Empty states for releases, local stores, and notifications

The dashboard does not automate checkout, bypass queues, defeat anti-bot systems, or claim unverified inventory is live.

## Source Priority

1. Official retailer APIs and official Pokémon pages
2. Official retailer product pages checked at a respectful cadence
3. Public community APIs, with confirmation requirements
4. Manual sightings and local notes

See [Architecture](./architecture.md), [Connector Guide](./connector-guide.md), [Notification Guide](./notifications.md), [API](./api.md), and [Roadmap](./roadmap.md).
