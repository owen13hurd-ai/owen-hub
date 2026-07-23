# Jarvis Architecture

Jarvis is the memory layer for Owen's Hub. It connects three things:

- Human-readable notes in the Obsidian vault
- Structured records in Supabase
- Future AI answers that must cite their sources

## Current Recommendation

Use a hybrid model:

- Obsidian remains the source of truth for notes, research, decisions, and confirmed personal memory.
- Supabase stores structured records that need filtering, calculations, and dashboards.
- Owen's Hub provides the friendly web interface over both systems.

## MVP Scope

The first version should do four jobs well:

1. Search Obsidian notes.
2. Create draft notes for research, decisions, projects, sources, and tasks.
3. Let other modules create draft notes with frontmatter and citations.
4. Keep confirmed facts separate from AI summaries or estimates.

AI can be added after citation and source tracking feel reliable.

## Source Rules

- Raw source material is preserved as-is.
- AI summaries are labeled as drafts or summaries.
- Confirmed memories require direct evidence or Owen approval.
- Purchase decisions and major project choices should be saved as decision notes.
- Secrets, tokens, payment data, and private keys never go into Obsidian.

## Data Boundaries

Markdown belongs in Obsidian when it is useful to read later:

- Research notes
- Project notes
- Decision records
- Source summaries
- Lessons learned
- Weekly reviews

Owen's Hub can create draft Markdown notes directly from `/dashboard/jarvis`. These notes always start as `status: draft` so they can be reviewed before they become confirmed memory.

Supabase stores records that need math or filtering:

- Product records
- Purchases
- Prices
- Alerts
- Tasks and statuses
- Links between notes and database records

## Future AI Contract

Jarvis answers must follow this rule:

> If there is no source, say that there is no source.

Every generated answer should include citations from note paths, source records, or database rows. Estimates must show the assumption behind them.
