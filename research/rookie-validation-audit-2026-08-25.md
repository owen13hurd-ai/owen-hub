# Rookie validation audit — 2026-08-25

## Corrections

- The former nflverse `player_stats/player_stats.csv` source ended at 2024, despite the local filename saying 2020–2025. The current official loader uses `stats_player/stats_player_week_{season}.csv`. Re-downloaded 2020–2025 and verified every completed regular-season game against nflverse schedules: 256, 272, 271, 272, 272, 272 games. The 2022 count excludes the canceled game.
- Rebuilt 841 prospect-season rows (previously 608). These are refreshed data, not evidence of an earlier successful production import.
- Three-year outcomes are available no earlier than April 1 following their last season. Training the 2021/2022 classes on a 2020 prospect's eventual three-year result was future-label leakage. Earlier rolling reports and feature-selection conclusions are superseded.
- All model comparisons now share exactly the same finite input/outcome records. Scaling is fitted only on training data. Both baseline and challenger have a fixed L2 penalty of 1; no penalty search used this test class.
- Missing player seasons are unknown, not zero production. Completely absent players are now retained in the audit, rather than disappearing before exclusions are counted. Partial-window targets also remain unknown pending verification. Duplicate player-season rows fail aggregation.
- Production labels describe retrospective scoring and exploratory testing, not an untouched prospective holdout. Archived model versions and source revisions may still contain hindsight.

## Reproduction

Run `node scripts/build-rookie-outcomes.mjs`, then `node scripts/evaluate-wr-yprr-challenger.mjs` from the project root. The generated source audit is `data/rookie-outcomes-2020-2025-audit.json`.

The target is peak statistical-appearance PPR PPG and best positional finish in the first three seasons. This is not games-on-roster PPG, nor a guaranteed calibration of individual prospects.

## Local WR results

| Item | Result |
|---|---:|
| Matured WRs (2020–2023) | 136 |
| No outcomes in three-year window | 7 |
| Some missing outcome seasons | 40 |
| Complete outcome windows | 89 |
| Matured players missing source YPRR | 14 |
| Temporal test class | 2023 only |
| Paired evaluated WRs | 23 |
| Draft-only MAE | 3.665980 |
| Draft + career YPRR MAE | 3.506748 |
| Draft-only Brier | 0.161964 |
| Draft + career YPRR Brier | 0.147156 |

The apparent improvement is exploratory and conditional on complete-case coverage. Excluding 47 unresolved outcome windows can create substantial survivorship bias. Do not publish new weights or calibrated probabilities from this result. Career YPRR and final-season YPRR remain different features; the 2026 Stein season measure cannot silently substitute for career YPRR.

## Next requirements

Production verification: deployment `dpl_damCpDAyWsXS826KebpSR7XQbVZa` succeeded. The signed-in targeted import verified 792 records including 162 for 2025; 49 source records had no matching Hub identity and were not forced into a name-only join. The live WR audit matches the local 136 matured / 47 unresolved / 89 complete target counts. The live career-YPRR row matches the local 23-player test (3.67 to 3.51 MAE; 0.162 to 0.147 Brier before UI rounding). Published model weights and scouting scores were not changed. TypeScript, lint, local and deployed builds, and 15 model tests passed; these are execution checks, not independent model-validation approval.

1. Verify missing seasons against player participation/rosters or another documented absence source. Distinguish no recorded production from a failed identity join. Never infer zero simply from a missing row.
2. Add pre-2020 training cohorts for multiple genuinely chronological test folds; the 2024 class's three-year target will not be mature until after the 2026 NFL season.
3. Record source-version availability and freeze the candidate before evaluating a new class. The 2023 class has already influenced exploratory analysis.
4. Keep published scouting scores and experimental regression outputs separate.

## Primary references

- [nflreadr official loader](https://github.com/nflverse/nflreadr/blob/main/R/load_stats.R)
- [nflreadr player stats documentation](https://nflreadr.nflverse.com/reference/load_player_stats.html)
- [nflreadr source migration changelog](https://nflreadr.nflverse.com/news/index.html)
- [nflverse schedules](https://github.com/nflverse/nfldata/blob/master/data/games.csv)
