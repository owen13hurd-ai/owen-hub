# Rookie Prospect Engine Architecture

## Current Vertical Slice

The rookie engine extends the existing Dynasty Hub at `/dashboard/dynasty/rookies`.

- Supabase migration `0008_rookie_prospect_engine.sql` defines normalized players, seasons, metrics, athletic tests, context, market history, model versions, score runs, score components, imports, notes, manual rankings, sources, and outcomes.
- Published model versions are immutable. Score runs are append-only.
- RB and WR configurations are validated with Zod and calculated by pure TypeScript functions.
- CSV imports use preview and commit as separate operations. Raw rows and validation results remain attached to an immutable batch.
- Manual rank and tier edits persist independently from calculated scores.
- Model configuration supports position-specific drafts, weight-total validation, publication, and version history. New score runs use the latest published version for each position.
- Player profiles expose append-only score history, and rankings include a 2025-versus-2026 class summary.
- Player profiles support corrected biographical/draft context, independent manual notes, and structured metric entry with confidence, as-of date, and explicit manual-entry provenance.
- Rankings expose the latest import batches, row counts, validation counts, and commit status.
- The source library stores evidence classification, reliability, licensing, publication, access date, URL, and summary metadata.
- Player aliases participate in deterministic import matching after external IDs and before exact class/position/name matching; the engine never performs an automatic fuzzy merge.
- Player comparison aligns the latest immutable score components, raw values, normalized values, contributions, coverage, and missing states.
- Legacy Google Sheet tiers are not converted into production or athletic metrics.

## Score Boundaries

Prospect Score measures the pre-situation prospect profile. Draft Capital, Market, and Situation remain separate scores. Overall Rookie Score combines only the available components and reports coverage.

Missing metrics receive no neutral value. Available weights are renormalized within a family, and families below their minimum coverage are suppressed. MVP normalization is class-relative across 2025-2026 RBs or WRs and is not a historical hit probability.

## Initial Weights

- WR Prospect Score: production and target earning 55%, age and declaration 20%, athleticism and size 15%, recruiting and context 10%.
- RB Prospect Score: normalized production 45%, receiving 20%, athleticism and size 25%, age, declaration, and recruiting 10%.
- Overall Rookie Score: Prospect 50%, Draft Capital 30%, Market 15%, Situation 5%.

## Data Rules

- Every imported field retains its import batch, source when supplied, confidence, and retrieval context.
- Player identity uses an internal UUID. External IDs and aliases support matching without relying only on normalized names.
- Proprietary sources are not automated without documented permission.
- Sports Reference is excluded from scraping and model inputs under its published data-use policy.
- AI may explain stored components and cited evidence. AI has no write path to numerical scores or model publication.

## Next Work

1. Apply migration `0008` to the connected Supabase project.
2. Import verified 2025-2026 RB/WR source data.
3. Add source selection to CSV mapping, explicit duplicate-resolution queues, and structured season/athletic/context editors.
4. Add historical reference cohorts and rolling-origin backtests before presenting calibrated hit probabilities.
