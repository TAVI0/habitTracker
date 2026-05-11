# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm test               # Jest test suite
npm test -- --testPathPattern=<file>  # Run a single test file
npx drizzle-kit generate  # Generate migration after schema change
npx drizzle-kit migrate   # Apply migrations
```

## Architecture

**Stack**: React Native 0.81 + Expo 54 + Expo Router 6 + TypeScript 5.9 + Drizzle ORM + SQLite

**Routing**: File-based via Expo Router. Routes live in `app/`:
- `/` → home (draggable habit list)
- `/add` → create habit modal
- `/habit/[id]` → detail view
- `/habit/[id]/edit` → edit modal
- `/archive` → archived habits

**Data layer**: SQLite (`habitTracker.db`) via `expo-sqlite` + Drizzle ORM. Schema in `src/db/schema.ts` (`habits` + `completions` tables). Migrations live in `src/db/migrations/` and run at app startup through `MigrationsGate` in `app/_layout.tsx`.

**State management**: Custom hooks in `src/hooks/`. No global store — each screen calls the relevant hook (useHabits, useCompletions, useStreak, etc.). Hooks encapsulate all DB queries.

**Soft deletes**: Habits are archived via `archivedAt` timestamp, never hard-deleted.

## Key Patterns

**Optimistic UI + rollback**: `app/index.tsx` reorders the list immediately and rolls back on DB error.

**Completion cache**: `src/hooks/useCompletions.ts` uses a module-level `Map` with a 5-second TTL to avoid redundant queries. Invalidate it when writing completions.

**Drag & drop**: `react-native-draggable-flatlist` on the home screen. `HabitCard` is memoized with a custom comparator that intentionally ignores `position` changes to prevent re-renders during drags.

**Notifications**: `src/utils/notifications.ts` — reminder identifiers stored per habit in `AsyncStorage`. Lazy-loaded to avoid startup cost.

**Performance markers**: `[PERF]` and `[MEMO]` console.log tags are intentional — don't remove them.

## Database Changes

After editing `src/db/schema.ts`, always run `npx drizzle-kit generate` to create a migration file, then test that `MigrationsGate` applies it cleanly on a fresh install.

## Build

EAS build is configured (`eas.json`) with a `development` profile. Use `eas build --profile development` for device builds. The project uses `--legacy-peer-deps` due to peer dependency conflicts with React 19.
