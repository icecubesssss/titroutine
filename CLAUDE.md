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

---

## Complete File Map

### Core Data Layer
| Concern | File | Lines |
|---|---|---|
| DB schema (source of truth) | `packages/database/schema.sql` | ~183 |
| DB migrations | `packages/database/migrations/*.sql` | varies |
| Server data fetch (`getDashboard`) | `apps/web/src/lib/data.ts` | ~250 |
| All server mutations | `apps/web/src/app/[locale]/actions.ts` | ~1445 |
| Auth actions (signIn/signUp/signOut) | `apps/web/src/app/[locale]/login/actions.ts` | ~70 |
| TypeScript types (`DashboardData`, `Task`, `ProfileSummary`, etc.) | `apps/web/src/lib/types.ts` | ~116 |
| Pure game rules (streak, stage, coins, feeding, levels) | `apps/web/src/lib/game.ts` | ~206 |
| Supabase client (browser) | `apps/web/src/utils/supabase/client.ts` | ~10 |
| Supabase client (server) | `apps/web/src/utils/supabase/server.ts` | ~30 |

### Pages & Routing
| Route | File |
|---|---|
| Home (server component → HomeView) | `apps/web/src/app/[locale]/page.tsx` |
| Login | `apps/web/src/app/[locale]/login/page.tsx` |
| Analytics | `apps/web/src/app/[locale]/analytics/page.tsx` |
| Pet Dev Tester (dev only) | `apps/web/src/app/[locale]/pet-test/page.tsx` |
| Email report API | `apps/web/src/app/api/send-report/route.ts` |
| Layout (locale wrapper) | `apps/web/src/app/[locale]/layout.tsx` |
| Middleware (auth + locale) | `apps/web/src/middleware.ts` |

### Main UI Component — HomeView (~1657 lines)
`apps/web/src/components/home/HomeView.tsx` is the **mega client component**.
It renders the entire home screen: pet, habits, tasks, sidebar, bottom nav.
**Key internal state**: `activeTab` (`"habits"` | `"tasks"`), dev overrides,
companion action, ambient action, weather, room navigation, modals.

### Component Map (by feature)

#### Pet System
| Component | File | Purpose |
|---|---|---|
| RabbitCompanion | `components/pet/RabbitCompanion.tsx` | Sprite renderer with STAGES_CONFIG (stage→actions→frames) |
| EggCompanion | `components/pet/EggCompanion.tsx` | Stage 0 egg animation |
| VirtualPet | `components/pet/VirtualPet.tsx` | Wrapper choosing Egg vs Rabbit |
| PetSpeechBubble | `components/pet/PetSpeechBubble.tsx` | Dialogue bubble |
| PetHud | `components/home/PetHud.tsx` | Pet stats overlay (level, satiety bar) |
| PetProfileModal | `components/home/PetProfileModal.tsx` | Full pet profile popup |
| FeedPicker | `components/home/FeedPicker.tsx` | Food selection for feeding |
| InteractionDock | `components/home/InteractionDock.tsx` | Pet interaction buttons |

#### Habit System
| Component | File | Purpose |
|---|---|---|
| HabitModal | `components/home/HabitModal.tsx` | Create/edit habit form |
| TimerModal | `components/home/TimerModal.tsx` | Focus timer for timer-type habits |
| CelebrationModal | `components/home/CelebrationModal.tsx` | Completion celebration |

#### Task System
| Component | File | Purpose |
|---|---|---|
| TaskBoard | `components/tasks/TaskBoard.tsx` | Kanban board (todo/in_progress/done) with drag-and-drop |
| TaskDrawer | `components/tasks/TaskDrawer.tsx` | Create/edit task form (modal) |
| CarrotPlanting | `components/tasks/CarrotPlanting.tsx` | Visual carrot growth while task is in_progress |

#### Mindfulness
| Component | File | Purpose |
|---|---|---|
| MoodCheckinModal | `components/mindfulness/MoodCheckinModal.tsx` | Daily mood log |
| BreathingModal | `components/mindfulness/BreathingModal.tsx` | Breathing exercise |
| FirstAidModal | `components/mindfulness/FirstAidModal.tsx` | Mental first aid resources |

#### Social
| Component | File | Purpose |
|---|---|---|
| NeighborModal | `components/home/NeighborModal.tsx` | Visit neighbors |
| VibeInboxModal | `components/social/VibeInboxModal.tsx` | Social vibes inbox |
| TreeTownModal | `components/social/TreeTownModal.tsx` | Town/community view |

#### Adventure
| Component | File | Purpose |
|---|---|---|
| AdventureView | `components/adventure/AdventureView.tsx` | Adventure gameplay |
| StoryDialogModal | `components/adventure/StoryDialogModal.tsx` | Story choices A/B |

#### Navigation & Layout
| Component | File | Purpose |
|---|---|---|
| DesktopSidebar | `components/home/DesktopSidebar.tsx` | Left sidebar (desktop) |
| BottomNav | `components/home/BottomNav.tsx` | Mobile bottom navigation |
| SettingsModal | `components/home/SettingsModal.tsx` | Settings + dev tools |

#### Shop & Economy
| Component | File | Purpose |
|---|---|---|
| ShopModal | `components/home/ShopModal.tsx` | Buy items, rooms, consumables |
| MemoryAlbumModal | `components/home/MemoryAlbumModal.tsx` | Memory keepsakes album |

#### Shared UI
| Component | File |
|---|---|
| DuoButton | `components/ui/DuoButton.tsx` |
| HeatmapCalendar | `components/analytics/HeatmapCalendar.tsx` |

### Game Logic Libraries
| Lib | File | Key Exports |
|---|---|---|
| game.ts | `lib/game.ts` | `stageFromStreak`, `ratchetStage`, `nextStreak`, `levelFromExp`, `feedExpGain`, `moodFromStats`, `currentSatiety`, `STAGE_STREAK_THRESHOLDS` |
| rooms.ts | `lib/rooms.ts` | `unlockedRooms`, `allRoomsUnlocked`, `ROOMS` |
| items.ts | `lib/items.ts` | Item catalog (furniture, wallpapers, consumables) |
| companion.ts | `lib/companion.ts` | Pet dialogue & ambient action scheduler |
| memories.ts | `lib/memories.ts` | `eligibleMemoryKeys` |
| neighbors.ts | `lib/neighbors.ts` | Neighbor system logic |
| game_interactions.ts | `lib/game_interactions.ts` | Pet interaction kinds & effects |
| adventure_stories.ts | `lib/adventure_stories.ts` | Adventure story data |
| analytics.ts | `lib/analytics.ts` | Analytics data processing |

### Hooks
| Hook | File | Purpose |
|---|---|---|
| useDevice | `hooks/useDevice.ts` | Detect mobile/desktop |
| useSound | `hooks/useSound.ts` | Sound effects (lazy-loaded, failure-tolerant) |

### i18n
- Config: `src/i18n/routing.ts`, `src/i18n/request.ts`
- String files: `apps/web/messages/{vi,en,zh}.json`
- Default locale: `vi`

---

## Database Schema Summary

### Tables
| Table | Key Columns |
|---|---|
| `profiles` | id(UUID/PK), username, timezone, coins, current_streak, pet_stage, affection_level, pet_exp, satiety, last_fed_date, focus_tokens, adventure_*, personality_* |
| `habits` | id, user_id(FK), title, type(`boolean`/`timer`/`counter`/`negative`), config(JSONB), frequency(JSONB), time_of_day |
| `habit_logs` | id, habit_id(FK), user_id(FK), date, is_completed, value, UNIQUE(habit_id, date) |
| `inventory` | user_id(PK/FK), equipped_items(JSONB), unlocked_items(JSONB), consumables(JSONB) |
| `memories` | id, user_id(FK), memory_key, UNIQUE(user_id, memory_key) |
| `tasks` | id, user_id(FK), title, notes, status(`todo`/`in_progress`/`done`), priority(`low`/`medium`/`high`), assignee_type(`self`/`pet`), focus_duration(int), deadline |
| `friendships` | id, user_id(FK), friend_id(FK), UNIQUE(user_id, friend_id) |
| `social_vibes` | id, sender_id(FK), receiver_id(FK), vibe_type, claimed_at |

All tables have RLS enabled. Policy pattern: `auth.uid() = user_id`.
Auto-create trigger: new auth.user → profiles row + inventory row.

---

## Server Actions Quick Reference

All in `apps/web/src/app/[locale]/actions.ts`. Return `{ error?: string }`.

| Action | Line | Purpose |
|---|---|---|
| `updateTimezoneAction` | 62 | Set user timezone |
| `addHabitAction` | 77 | Create new habit |
| `updateHabitAction` | 112 | Edit habit details |
| `archiveHabitAction` | 151 | Soft-delete habit |
| `toggleHabitAction` | 170 | Mark habit done (awards coins, updates streak) |
| `incrementCounterHabitAction` | 290 | Increment counter-type habit |
| `claimDailyCheckinAction` | 367 | Daily check-in bonus |
| `buyFreezeAction` | 403 | Purchase streak freeze |
| `buyItemAction` | 436 | Buy furniture/decoration |
| `equipItemAction` | 492 | Equip/unequip item |
| `feedPetAction` | 552 | Feed pet (grants pet_exp, restores satiety) |
| `petInteractAction` | 651 | Pet/play/groom interaction (grants affection) |
| `claimNeighborGiftAction` | 767 | Daily neighbor gift |
| `buyConsumableAction` | 799 | Buy consumable items |
| `startAdventureAction` | 847 | Start adventure |
| `completeAdventureAction` | 880 | Complete adventure with choice A/B |
| `logMoodAction` | 947 | Log daily mood + tags + reflection |
| `completeBreathingAction` | 1080 | Complete breathing exercise |
| `addFriendAction` | 1110 | Add friend by code |
| `sendVibeAction` | 1145 | Send social vibe |
| `claimVibeAction` | 1161 | Claim received vibe |
| `getAiDiariesAction` | 1198 | Get AI-generated diaries |
| `claimKeepsakeAction` | 1212 | Claim memory keepsake |
| `createTaskAction` | 1243 | Create new task |
| `deleteTaskAction` | 1272 | Delete task |
| `updateTaskDetailsAction` | 1288 | Update task title/notes/priority/etc |
| `updateTaskStatusAction` | 1323 | Move task status (rewards focus_tokens + carrot on done) |
| `buyFocusItemAction` | 1407 | Buy item with focus tokens |

---

## Key TypeScript Types (in `lib/types.ts`)

- **`DashboardData`**: Everything the home page needs (profile, habits, inventory, tasks, etc.)
- **`ProfileSummary`**: User stats (coins, streak, petStage, petExp, satiety, affection, mood, focusTokens, adventure*, personality*)
- **`Task`**: id, userId, title, notes, status, priority, assigneeType, focusDuration, deadline
- **`HabitWithLog`**: Habit definition + today's completion state
- **`InventorySummary`**: equippedItems, unlockedItems, consumables

---

## Conventions

- **All user-facing strings go through next-intl** (`useTranslations`). Add the
  key to **all three** `messages/*.json` files. Exception: the Settings →
  Developer Tools panel is intentionally hardcoded Vietnamese.
- Server Actions return `{ error?: string }` and call `revalidatePath('/', 'layout')`.
- Habit types: `boolean` (daily), `timer` (`config.target_time` in seconds),
  `counter` (`config.target_count`), `negative` (track bad habits).
- Pet stage thresholds: `[0, 7, 21, 42, 70, 105, 120]` days of streak.
- Pet evolution NEVER reverses. Use `ratchetStage()`.
- Feeding gives `pet_exp` → `levelFromExp()` → room unlocks.
- Tasks: completing a task awards `focus_duration` focus tokens + 1 carrot.

## Don't waste tokens reading these

Generated/binary, never relevant: `node_modules/`, `apps/web/.next/`,
`package-lock.json` (252K), `apps/web/public/assets/*.png` sprites, `*.woff`,
`temp_agentpet/` (separate macOS desktop app, has its own `.git`),
`.turbo/`, `apps/web/tsconfig.tsbuildinfo`.

## Known gotchas

- **Signup needs email confirmation** (`mailer_autoconfirm: false` on the live
  Supabase). New users must confirm via email before login; the UI shows
  "check your inbox". For frictionless onboarding, configure SMTP or disable
  email confirmation in Supabase Auth settings.
- `apps/web/public/assets/sounds/*.mp3` are broken placeholders (S3 error pages);
  `useSound` loads them lazily and tolerates the failure.
- `middleware.ts` triggers a Next 16 "use proxy instead" deprecation warning —
  not breaking.
- `temp_agentpet/` is a nested git repo (origin: `ntd4996/agentpet`). Don't
  try to push it from this repo. Commit inside it separately if needed.

## Code Modification Rules

1. **NEVER modify components unrelated to the current task.**
2. Before editing, explicitly list which files will be changed.
3. If a component is NOT mentioned in the user's request, do NOT touch it.
4. If you think another component needs updating for consistency, ASK first.
