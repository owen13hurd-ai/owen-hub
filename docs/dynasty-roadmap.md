# Dynasty Hub Roadmap

## Saved Idea: Player Profiles And Tags

Build player profiles after the core Dynasty workflows are stronger.

Recommended direction:

- Use one primary calculated/manual `Core Profile` per player.
- Add optional secondary tags later for roster context.
- Keep profiles meaningful enough that separate ceiling tags are not needed.

Potential core profiles:

- Franchise Cornerstone
- Elite Difference Maker
- High-End Core Starter
- Stable Core Starter
- Ascending Core Starter
- Volatile Core Starter
- Win-Now Hammer
- Productive Veteran
- Fragile Elite
- Short-Window Producer
- Breakout Bet
- Upside Swing
- Role Bet
- Premium Handcuff
- Standalone Handcuff
- Rookie Foundation Bet
- Rookie Upside Bet
- Developmental Stash
- Depth Producer
- Roster Clogger
- Declining Asset

Example uses:

- Christian McCaffrey: Fragile Elite, Win-Now Hammer
- Rookie RB with uncertain role: Rookie Upside Bet, Role Bet
- Young rising WR: Ascending Core Starter
- Older scorer: Productive Veteran, Short-Window Producer

Likely implementation:

1. Add calculated profile suggestions from age, rank, position, market value, and tier.
2. Let Owen manually override the profile.
3. Save profile overrides to Supabase.
4. Add profile filters to the rankings table.

