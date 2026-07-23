# Restock Hub Architecture

## Data Flow

```text
Retailer/community connector
  -> normalized RestockEvent
  -> validation and deduplication
  -> Supabase event history
  -> watchlist and MSRP matcher
  -> notification adapters
  -> Restock Hub dashboard
```

## Boundaries

- `lib/restocks/types.ts`: shared domain types.
- `lib/restocks/connectors`: one isolated connector per source.
- `lib/restocks/connectors/registry.ts`: runs connectors and reports health.
- `app/api/restocks/route.ts`: read-only refresh endpoint.
- `components/restocks`: dashboard interface.
- `supabase/migrations/0005_pokemon_restocks.sql`: persistent data model.

Connectors return the same `RestockEvent` shape. This keeps retailer-specific HTML, API fields, credentials, and failures away from the UI.

## Reliability Rules

- A source type and confidence level accompany every event.
- An empty result is not converted into an out-of-stock claim unless the source explicitly reports it.
- Alerts should trigger on state transitions, not on every successful poll.
- Repeated events use stable retailer/product identifiers for deduplication.
- Credentials remain server-only environment variables.
