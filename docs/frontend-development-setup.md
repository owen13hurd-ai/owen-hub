# Frontend Development Setup

## Installed systems

- Taste Skill v2: `design-taste-frontend`, registered for Codex in `.agents/skills`.
- shadcn/ui: `radix-nova` preset with CSS variables and Owen's Hub semantic theme tokens.
- Magic UI: blur fade, number ticker, animated list, and border beam.
- Global providers: next-themes, shadcn TooltipProvider, and Sonner Toaster.

Restart Codex after the setup commit is pulled so the new Taste skill is discovered in future sessions.

## Dependencies added

- `@hookform/resolvers@^5.4.0`
- `class-variance-authority@^0.7.1`
- `cmdk@^1.1.1`
- `motion@^12.42.0`
- `next-themes@^0.4.6`
- `radix-ui@^1.6.0`
- `react-hook-form@^7.80.0`
- `shadcn@^4.12.0`
- `sonner@^2.0.7`
- `tailwind-merge@^3.6.0`
- `tw-animate-css@^1.4.0`
- `vaul@^1.1.2`
- `zod@^4.4.3`

## Files created

- `.agents/skills/design-taste-frontend/SKILL.md`
- `AGENTS.md`
- `components.json`
- `skills-lock.json`
- `components/providers/AppProviders.tsx`
- `hooks/use-mobile.ts`
- `lib/utils.ts`
- `docs/frontend-development-setup.md`
- `components/ui/accordion.tsx`
- `components/ui/alert.tsx`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/breadcrumb.tsx`
- `components/ui/button.tsx` (replaces the legacy `Button.tsx`)
- `components/ui/card.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/command.tsx`
- `components/ui/dialog.tsx`
- `components/ui/drawer.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/form.tsx`
- `components/ui/input-group.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/pagination.tsx`
- `components/ui/popover.tsx`
- `components/ui/progress.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/select.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/sonner.tsx`
- `components/ui/switch.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/textarea.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/toggle.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/animated-list.tsx` (Magic UI)
- `components/ui/blur-fade.tsx` (Magic UI)
- `components/ui/border-beam.tsx` (Magic UI)
- `components/ui/number-ticker.tsx` (Magic UI)

## Files modified

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/auth/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/pokemon/page.tsx`
- `app/dashboard/dynasty/page.tsx`
- `app/dashboard/dynasty/portfolio/page.tsx`
- `app/dashboard/dynasty/trade-inbox/page.tsx`
- `app/dashboard/dynasty/leaguemates/page.tsx`
- `app/dashboard/dynasty/leagues/page.tsx`
- `app/dashboard/dynasty/my-teams/page.tsx`
- `components/dynasty/TradeInboxClient.tsx`
- `components/hubs/HubCard.tsx`
- `components/layout/DashboardHeader.tsx`
- `components/pokemon/PokemonBringFourAdvisor.tsx`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tailwind.config.ts`

## Verification

- `npx skills list -a codex`: Taste Skill registered for Codex.
- `pnpm dlx shadcn@latest info`: all requested shadcn components recognized.
- `pnpm install --frozen-lockfile`: clean.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run lint`: passed.
- `pnpm run build`: passed for all 26 routes.
- Production browser check: dashboard rendered without console errors or horizontal overflow.
