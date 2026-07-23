# Owen's Hub

Pokémon Restocks is available at `/dashboard/restocks`. Its technical documentation lives in [`docs/restocks`](./docs/restocks/README.md).

## Purpose

Owen's Hub is a personal web application that is growing into a central place for Owen's interests, tools, data, notes, and future AI assistants.

It currently supports Dynasty fantasy football workflows, Pokemon Champions tools, a Career Hub with job discovery, a Poker Hub, notes/travel placeholders, Supabase-backed persistence, and Vercel cloud deployment.

## Quick Start

Use these commands from the project folder:

```bash
pnpm install
pnpm dev
```

Then open:

```txt
http://localhost:3000
```

Live production site:

```txt
https://owen-hub.vercel.app
```

## Major Features

- Next.js app using TypeScript.
- Tailwind CSS with shadcn/ui and selective Magic UI polish.
- Dashboard layout with left sidebar navigation.
- Dynasty Hub with rankings, tiers, portfolio exposure, leaguemate insights, power rankings, rookie modeling notes, and trade inbox work.
- Pokemon Hub with tournament team browsing, sprites, filters, random team finder, team builder, speed chart, damage calculator, and Battle Journal planning.
- Career Hub with application tracking, Gmail/job alert ingestion, company/job feed scouting, Supabase storage, and Vercel cron automation.
- Poker Hub with training data import and trainer UI.
- Notes, Travel, and Daily Briefing sections for future growth.
- Supabase client/server setup.
- Vercel production deployment and scheduled Career morning run.
- Internal documentation system for human and AI continuity.

## Folder Structure

```txt
app/
  The actual pages and routes.

components/
  Reusable building blocks like the sidebar, buttons, and hub cards.

lib/
  Shared helper code such as navigation data and Supabase setup.

data/
  Imported starter data. The Dynasty rankings CSV lives here for now.

types/
  Shared TypeScript types. Supabase database types will live here later.

docs/
  Focused technical notes and deeper feature docs.

Applications/
  Career application-specific resumes, cover letters, and notes.
```

## Documentation System

The root-level wiki files are part of the project. Start here:

- `Context.md` for current state.
- `Roadmap.md` for priorities.
- `Changelog.md` for completed work.
- `Facts.md` for verified facts.
- `Decisions.md` for why important choices were made.
- `Playbook.md` for repeatable workflows.
- `Agent Instructions.md` and `AGENTS.md` for future AI operating rules.

Every significant task should update affected documentation before it is considered finished.

## Recommended Structure

Keep this README focused on:

- Project purpose
- Quick start
- Major features
- Folder structure
- Environment/deployment basics
- Links to deeper documentation

Detailed notes should live in the dedicated wiki files or `docs/` folder.

## Example Entries

- `Major Features - Career Hub with Gmail-powered job discovery.`
- `Folder Structure - Applications/ stores tailored career materials.`

## Environment Setup

Copy `.env.example` to `.env.local` and fill in local values:

```bash
cp .env.example .env.local
```

The real `.env.local` file should never be committed because it contains private project settings.

## Supabase

Supabase is used for persistent data such as Dynasty board saves and Career Hub discovered jobs. Relevant migrations live in `supabase/migrations/`.

## Vercel

The project is deployed at `https://owen-hub.vercel.app`. Vercel cron calls `/api/career/morning-run` daily for job discovery.

## Dynasty market sources

The Dynasty rankings page currently supports two market sources:

```txt
KTC
  Uses the live Google Sheet feed when available.
  Add KTC_GOOGLE_SHEET_ID and KTC_GOOGLE_SHEET_NAME to choose a different sheet.

FantasyCalc
  Uses the live FantasyCalc dynasty values API.
```

## Dynasty ranking saves

The Dynasty rankings page auto-saves board order to Supabase one second after
you drag and drop a player or tier. Run the SQL in this migration before using
auto-save:

```txt
supabase/migrations/0002_dynasty_board_snapshots.sql
```

## Sleeper portfolio

The Dynasty Portfolio page can pull public Sleeper league and roster data by
username:

```txt
http://localhost:3000/dashboard/dynasty/portfolio
```

Enter a Sleeper username and season, then use the league checkbox dropdown to
include or exclude leagues from the exposure totals.

## When To Update

Update this README only when the project changes significantly: major features, setup changes, folder structure changes, deployment changes, or documentation-system changes.

## Maintenance Notes

Do not turn this file into a full changelog or scratchpad. Keep it high-level and route detailed updates to the correct wiki file.

## Related Files

- `Context.md`
- `Roadmap.md`
- `Changelog.md`
- `Playbook.md`
- `docs/career-cloud-automation.md`
- `docs/frontend-development-setup.md`
