# Owen's Hub Frontend Standards

## Component System

- Use shadcn/ui as the primary component library.
- Prefer an existing component in `components/ui` over creating a custom control.
- Compose shadcn primitives for product-specific patterns instead of modifying every call site.
- Keep shared variants in the component's CVA definition and use `cn` from `lib/utils`.
- Use Lucide icons for interface actions and provide accessible labels for icon-only controls.

## Magic UI

- Magic UI is an enhancement layer, not a replacement for shadcn/ui.
- Use it only for subtle entrance motion, loading feedback, a single dashboard highlight, or premium hero polish.
- Respect reduced-motion preferences and avoid continuous decorative animation in operational views.
- Keep Magic UI usage out of dense tables, forms, navigation, and repeated controls.

## Visual Direction

- Follow the installed `design-taste-frontend` skill when frontend design work is requested.
- Owen's Hub is a quiet, modern personal SaaS workspace: prioritize hierarchy, scanability, and repeated use.
- Keep cards at 8px radius or less, avoid nested cards, and use full-width sections for page structure.
- Use the shared page header and workspace navigation patterns before inventing new layouts.
- Preserve the existing ink, mist, moss, ember, and skyglass palette through semantic theme tokens.
- Use compact typography inside tools and reserve large type for true page titles.
- Every page must work at mobile and desktop widths without clipped text or incoherent overlap.

## Implementation Quality

- Keep TypeScript strict and components accessible.
- Use shadcn Form with React Hook Form and Zod for validated forms.
- Add Sonner toasts for meaningful asynchronous feedback, not routine decoration.
- Run `pnpm exec tsc --noEmit`, `pnpm run lint`, and `pnpm run build` before shipping frontend changes.

## Second Brain Protocol

- The permanent knowledge vault is `/Users/hurd/Documents/Obsidian Vault`.
- Before substantial work, read the related project note under `01 Projects` and any linked decision notes.
- Meaningful work must update the related project status, relevant decisions or lessons, and the current append-only agent log.
- Shared agent work is coordinated through `16 Agent Memory/Shared/Shared Task Queue.md`.
- Follow `16 Agent Memory/Shared/Memory Protocol.md` for completion records and escalation.
- Prefer canonical linked notes over duplicated summaries.
- Never store credentials, authentication tokens, payment data, or private keys in the vault.
- Never overwrite historical agent-log entries; append corrections as new entries.

## Career Agent Protocol

- Treat `Career Profile.md` as Owen's permanent career source of truth.
- Before tailoring or modifying any resume, cover letter, or application material, read `Career Profile.md` and check the workspace for newer career evidence.
- Never fabricate, exaggerate, or infer accomplishments. If a role, metric, tool, or responsibility is uncertain, ask Owen a concise clarifying question.
- Update `Career Profile.md` before updating `Owens Resume` or creating tailored application materials.
- Keep master resume work separate from application-specific copies.
- Save tailored materials under `Applications/Company/` with filenames like `Resume - Company - Role.docx`, `Cover Letter - Company - Role.docx`, and `Resume Notes.md`.
- Resume notes must include company, role, ATS estimate, keywords added, changes made, remaining gaps, interview talking points, and questions still worth asking.
