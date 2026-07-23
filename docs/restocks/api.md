# Restock API

## `GET /api/restocks`

Runs configured connectors and returns a normalized snapshot.

```json
{
  "checkedAt": "2026-07-02T18:00:00.000Z",
  "events": [],
  "releases": [],
  "connectors": []
}
```

This endpoint currently performs read-only checks. A scheduled ingestion endpoint will later validate, deduplicate, save events to Supabase, and dispatch notifications.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BEST_BUY_API_KEY` | Optional | Enables the official Best Buy Products API connector |
| `DISCORD_RESTOCK_WEBHOOK_URL` | Future | Sends one-way restock alerts |

All credentials must remain server-side and must never use the `NEXT_PUBLIC_` prefix.
