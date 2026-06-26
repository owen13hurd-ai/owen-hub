# Rookie Model Blueprint

This note summarizes the structure of the Stein rookie model sheets so Owen's Hub can recreate the bones of the system in a cleaner, editable way.

## Source Sheets

- `Stein - 2025 Rookies`
  - Final rookie tiers by position.
  - Position model tabs: `QB`, `RB`, `WR`, `TE`.
  - Output tab: `steINdex`.
  - Supporting tabs: `proj.dc`, `RAS`, `formula`, `NFL$`, `Analysts`, `LZ`, `Definitions`.

- `Stein - 2026 Rookies`
  - Same general model shape as 2025.
  - Final rankings include sheet scores in names, such as `Jeremiyah Love (94)`.
  - Supporting tabs include `QB`, `RB`, `WR`, `TE`, `formula`, `LZ`, `Definitions`, `RAS`.

- `Stein - 2025 cfb stats`
  - Raw production/stat source workbook.
  - Position tabs pull from raw stat tabs.
  - Supporting tabs include PFF passing/rushing/receiving, CFBStats team tables, CollegeFootballData usage/EPA, ESPN QBR, alt IDs, conferences, and school images.

## Data Sources Used

The model appears to combine:

- PFF position data.
- CFBStats team offense/rushing/passing tables through `IMPORTHTML`.
- CollegeFootballData usage and EPA.
- ESPN QBR for quarterbacks.
- RAS athletic testing.
- NFL Mock Draft Database projected draft capital.
- 247/recruiting pedigree.
- Analyst grades and NFL scouting notes.
- Manual alt-name mappings for player matching.

## Model Shape

The key structure is:

1. Raw data tabs collect external data.
2. Position tabs normalize player data for QB/RB/WR/TE.
3. Each position tab has thresholds and weights near the top.
4. Formula columns convert traits/stats into point buckets.
5. `steINdex` pulls the final score from the position tab.
6. Ranking tabs turn those scores into tiers.

## Major Inputs

Common fields across positions:

- Age and age at draft.
- Early declare status.
- Years played.
- Projected draft capital.
- Recruiting profile.
- Height, weight, BMI.
- Athletic metrics and RAS.
- Production.
- Usage.
- Efficiency.
- Analyst/NFL scouting grades.

Position-specific examples:

- QB: QBR, EPA, passing efficiency, rushing contribution, draft capital.
- RB: rushing usage, receiving usage, speed score, weight, draft capital.
- WR: target/receiving usage, production, size, athleticism, breakout-type signals.
- TE: size, receiving production, athleticism, patience/role discount.

## Rebuild Plan For Owen's Hub

Best clean version:

1. Keep imported sheet tiers as the current visible rookie board.
2. Add a model settings panel with editable weights.
3. Store raw model inputs per player.
4. Compute separate buckets:
   - Draft capital
   - Production
   - Usage
   - Efficiency
   - Athleticism
   - Age
   - Size
   - Risk
   - Analyst/scout signal
5. Combine buckets into an Owen Score.
6. Let your manual rank override the model rank.

## First Practical Build

The first version should not try to perfectly copy every formula.

Instead:

- Recreate the scoring categories.
- Make the weights editable.
- Show how each player earned the score.
- Add raw stat imports one source at a time.
- Keep the final rookie board draggable so your opinion stays in charge.
