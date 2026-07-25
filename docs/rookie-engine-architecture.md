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
- CSV preview requires an approved source and propagates it to committed player and metric records.
- Close same-cohort names enter an explicit duplicate-resolution queue. Pending rows block the entire batch until Owen chooses an existing player or approves creation of a new internal identity.
- Player profiles accept sourced college-season, athletic-test, situation-context, and market snapshots with observation dates.
- Score execution selects the latest dated metric, context, and market observations. Situation is the mean of available 0–100 context dimensions; the MVP market score uses an explicitly stored 0–100 provider value. Neither changes Prospect Score.
- Sourced seasonal NFL outcomes are validation-only records. The historical report exposes top-12 and top-24 finish rates, PPG, games, peak dynasty value, missing outcomes, and Spearman rank correlation for Prospect Score, draft capital, and market score.
- Rolling-origin validation only admits scores dated on or before September 1 of the player's draft year. Later runs are counted as leakage exclusions, and small cohorts display an uncertainty warning.
- Validation uses an explicit Prospect Score >= 65 rule for top-24 precision and recall, Wilson 95% intervals for finish rates, and observed top-24 rates across fixed score buckets. Buckets are descriptive cohort results, not individual probabilities.
- Dated, sourced consensus ranks are stored in a separate benchmark table and compared to fantasy PPG without entering any model calculation.
- Player comparison aligns the latest immutable score components, raw values, normalized values, contributions, coverage, and missing states.
- Legacy Google Sheet tiers are not converted into production or athletic metrics.
- `types/database.ts` is generated from the live Supabase schema and includes authoritative contracts and relationship metadata for the entire Hub. Shared browser and server clients use it directly.
- `pnpm run check:rookie-migrations` verifies the migration chain and fails when a declared rookie table lacks a database contract.
- Historical cohort imports accept sourced raw RB/WR inputs for classes 2010-2024, require one scoring date per class no later than September 1 of the draft year, reuse explicit duplicate resolution, and calculate full score components rather than accepting opaque Prospect Scores.
- Historical scoring queries only metrics, market snapshots, and context snapshots observed on or before the requested scoring date.
- The legacy 2025/2026 ranking-sheet adapter imports RB/WR identity and manual tier only. Embedded sheet scores remain in immutable raw import provenance and never populate metric or calculated score fields. Repeated committed batches are skipped.

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

1. Run the signed-in Google Sheet identity/tier import, then import verified 2025-2026 RB/WR raw metrics.
2. Inspect the first persisted model run and player explanation against its source rows.
3. Load historical cohort CSVs with verified raw metrics, pre-draft dates, and approved outcome sources.
4. Add provider-specific benchmark coverage, bootstrap rank-correlation intervals, and rolling multi-class summaries once sample sizes support them.
