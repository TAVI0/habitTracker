import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { habits as habitsTable } from '../db/schema';
import * as schema from '../db/schema';
import type { Habit, HabitConfig } from '../types';

// ─── Config JSON boundary ────────────────────────────────────────────────────
// parseHabit() is the ONLY place that casts the raw DB string → HabitConfig.
// Nothing past this hook boundary ever deals with a raw JSON string.

type HabitRow = typeof habitsTable.$inferSelect;

function parseHabit(row: HabitRow): Habit {
  return {
    ...row,
    config: JSON.parse(row.config) as HabitConfig,
    position: row.position ?? 0,
  };
}

// ─── Hook for Archived Habits ────────────────────────────────────────────────

export function useArchivedHabits() {
  const sqliteDb = useSQLiteContext();
  // useMemo ensures the drizzle client is stable across re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const rows = await db
        .select()
        .from(habitsTable)
        .where(isNotNull(habitsTable.archivedAt))
        .orderBy(desc(habitsTable.archivedAt));
      setHabits(rows.map(parseHabit));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ─── Hard Delete ───────────────────────────────────────────────────────────
  // Permanently deletes the habit from the database.
  // Completions are automatically deleted via CASCADE.

  const permanentDeleteHabit = useCallback(
    async (id: number): Promise<void> => {
      await db.delete(habitsTable).where(eq(habitsTable.id, id));
      await refetch();
    },
    [db, refetch]
  );

  // ─── Unarchive ─────────────────────────────────────────────────────────────
  // Restores a habit by setting archived_at back to null.

  const unarchiveHabit = useCallback(
    async (id: number): Promise<void> => {
      await db
        .update(habitsTable)
        .set({ archivedAt: null })
        .where(eq(habitsTable.id, id));
      await refetch();
    },
    [db, refetch]
  );

  return { habits, loading, error, refetch, permanentDeleteHabit, unarchiveHabit };
}
