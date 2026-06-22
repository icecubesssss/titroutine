# 🐰 Titroutine

A cozy habit tracker with a virtual rabbit companion who grows alongside your
habits. Complete daily habits and focus timers, keep your streak alive, earn
coins/EXP, and watch your companion evolve.

> Built as a Turborepo monorepo. The companion art/animation design lives in
> [`rabbit_design_plan/`](./rabbit_design_plan).

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Supabase** — Postgres + Auth (email/password) with Row Level Security
- **next-intl** — 🇻🇳 Vietnamese (default), 🇬🇧 English, 🇨🇳 Chinese
- **Tailwind CSS**, **Zustand**-free server-driven state, **Resend** for email reports

## Monorepo layout

```
apps/web              Next.js app
packages/database     Supabase schema.sql (source of truth for the DB)
rabbit_design_plan    Art bible & companion design docs
```

## Getting started

1. **Environment** — create `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   RESEND_API_KEY=<resend-key>   # optional, for email reports
   ```

2. **Database** — run [`packages/database/schema.sql`](./packages/database/schema.sql)
   in the Supabase SQL editor. It creates `profiles`, `habits`, `habit_logs`,
   `inventory`, `memories`, RLS policies, and a trigger that provisions a
   profile + inventory on signup.

3. **Install & run**

   ```bash
   npm install
   npm run dev          # turbo -> next dev
   ```

   Open http://localhost:3000 — you'll be redirected to `/<locale>/login`.

## How it works

- **Auth** is enforced in `middleware.ts`, which also refreshes the Supabase
  session and runs next-intl locale routing. Unauthenticated users are sent to
  the login page; authenticated users away from it.
- **Data is server-driven.** `src/lib/data.ts` loads the dashboard (profile +
  habits + today's logs, scoped to the user's timezone). Mutations live in
  `src/app/[locale]/actions.ts` as Server Actions.
- **Game logic** (`src/lib/game.ts`) is pure and unit-testable: coins/EXP per
  completion, pet stage from total EXP, and streak roll-over by local day.
- The browser's IANA timezone is captured on first load so streaks roll over on
  the user's local midnight, not UTC.

## Status / roadmap

Core loop (auth, habits, logs, streaks, coins, EXP, pet evolution, timers,
i18n, email reports) is wired to the live backend. Still on the design board
(see `rabbit_design_plan/`): richer pet stages & emotion/time/weather
animations, the memory album, room progression, and seasonal events.
