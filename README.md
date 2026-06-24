# Owen's Hub

Owen's Hub is a personal web application that will grow into a central place for tools, interests, notes, and future AI assistants.

## What exists now

- Next.js app using TypeScript
- Tailwind CSS styling
- Homepage
- Dashboard layout
- Left sidebar navigation
- Placeholder pages for Dynasty, Pokémon, Career, Travel, and Notes
- First Dynasty rankings page using the Dynasty Hub 2.0 rankings export
- Supabase client/server setup files

## How the app is organized

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
```

## Run the app

Use these commands from the project folder:

```bash
pnpm install
pnpm dev
```

Then open:

```txt
http://localhost:3000
```

## Supabase setup

Copy `.env.example` to `.env.local` and fill in your Supabase values:

```bash
cp .env.example .env.local
```

The real `.env.local` file should never be committed because it contains private project settings.

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

## Next milestone

The next practical step is to run the Dynasty board migration in Supabase, test
auto-save, and then decide whether to keep building rankings tools or return to
authentication.
