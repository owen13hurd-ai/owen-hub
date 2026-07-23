# Restock Notification Guide

## Recommended Order

1. Discord webhook for immediate critical alerts
2. Browser push for phone and desktop
3. Email for digests and lower-priority matches
4. Telegram as an optional redundant instant channel
5. SMS only for rare critical alerts because it adds cost

## Priority Rules

- Critical: Pokémon Center, Target, Best Buy, or GameStop at MSRP
- High: Costco, Sam's Club, or Walmart near MSRP
- Medium: verified local card shop stock
- Low: marketplace listings

## Alert Safety

- Notify once when a product changes to available.
- Add a cooldown before sending another alert for the same listing.
- Include retailer, product, price, MSRP, detection time, confidence, and direct product link.
- Do not perform checkout or queue actions.

Discord incoming webhooks are appropriate for sending one-way alerts. Reading private Discord announcement channels requires explicit server access and a permitted bot or integration.
