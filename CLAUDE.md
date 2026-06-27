# CLAUDE.md — Titroutine

Cozy habit tracker + virtual rabbit companion. Turborepo monorepo. The app code
is all in `apps/web` (Next.js 16 App Router, React 19, Supabase, Tailwind).

## Commands

```bash
npm run dev                       # turbo -> next dev (all workspaces)
cd apps/web && npm run build      # build + typecheck (the real verification)
```

- `npm run lint` is **broken** (`next lint` was removed in Next 16). Rely on
  `next build`, which runs the TypeScript check.

## Architecture (read this before changing data flow)

- **Server-driven, no client data store.** There is no Zustand/localStorage for
  app data. The home page is a server component that calls `getDashboard()`;
  mutations are Server Actions. Client components hold only UI state + optimistic
  mirrors of server data.
- **Auth + locale live in `middleware.ts`**: refreshes the Supabase session,
  runs next-intl routing, and gates routes (no session → `/<locale>/login`).
- **Today/streaks are timezone-aware**: computed in the user's IANA timezone
  (captured client-side on first load), never UTC.
- **Single source of truth for pet stage = `ratchetStage(stored, streak)`** in
  `lib/game.ts` (= `max(stored pet_stage, stageFromStreak(streak))`). The streak
  sets a floor via `STAGE_STREAK_THRESHOLDS`, but evolution **never reverses** — a
  broken streak keeps the stage already reached. Both the server (`pet_stage`
  column) and the UI go through `ratchetStage`. Do NOT reintroduce an EXP-based
  stage. `total_exp`/`coins` are economy only.

## File map (open these directly, don't go hunting)

| Concern | File |
|---|---|
| DB schema (source of truth) | `packages/database/schema.sql` |
| Server data fetch | `apps/web/src/lib/data.ts` |
| Mutations (add/edit/archive/toggle habit, timezone) | `apps/web/src/app/[locale]/actions.ts` |
| Pure game rules (streak, stage, coins) | `apps/web/src/lib/game.ts` |
| Auth actions | `apps/web/src/app/[locale]/login/actions.ts` |
| Home UI + pet stages metadata | `apps/web/src/components/home/HomeView.tsx` |
| Modals | `apps/web/src/components/home/{HabitModal,TimerModal,SettingsModal,MemoryAlbumModal}.tsx` |
| Email report (auth-gated, server-derived) | `apps/web/src/app/api/send-report/route.ts` |
| i18n strings (vi default, en, zh) | `apps/web/messages/*.json` |

## Conventions

- **All user-facing strings go through next-intl** (`useTranslations`). Add the
  key to **all three** `messages/*.json` files. Exception: the Settings →
  Developer Tools panel is intentionally hardcoded Vietnamese.
- Server Actions return `{ error?: string }` and call `revalidatePath('/', 'layout')`.
- Habit types: `boolean` (daily) and `timer` (`config.target_time` in seconds).

## Don't waste tokens reading these

Generated/binary, never relevant: `node_modules/`, `apps/web/.next/`,
`package-lock.json` (252K), `apps/web/public/assets/*.png` sprites, `*.woff`.

## Known gotchas

- **Signup needs email confirmation** (`mailer_autoconfirm: false` on the live
  Supabase). New users must confirm via email before login; the UI shows
  "check your inbox". For frictionless onboarding, configure SMTP or disable
  email confirmation in Supabase Auth settings.
- `apps/web/public/assets/sounds/*.mp3` are broken placeholders (S3 error pages);
  `useSound` loads them lazily and tolerates the failure.
- `middleware.ts` triggers a Next 16 "use proxy instead" deprecation warning —
  not breaking.
