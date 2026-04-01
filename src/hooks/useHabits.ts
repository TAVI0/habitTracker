import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { asc, eq, isNull, sql } from 'drizzle-orm';
import { habits as habitsTable } from '../db/schema';
import * as schema from '../db/schema';
import type { Habit, HabitConfig } from '../types';
import { today } from '../utils/dateUtils';
import {
  cancelHabitReminderById,
  rescheduleHabitReminder,
} from '../utils/notifications';

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

// ─── Input type ──────────────────────────────────────────────────────────────

export type CreateHabitInput = {
  name: string;
  description?: string | null;
  color: string;
  reminderTime?: string | null;
  config: HabitConfig;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useHabits() {
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
        .where(isNull(habitsTable.archivedAt))
        .orderBy(asc(habitsTable.position));
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

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createHabit = useCallback(
    async (input: CreateHabitInput): Promise<number> => {
      const maxResult = await db
        .select({ maxPos: sql<number>`MAX(${habitsTable.position})` })
        .from(habitsTable)
        .where(isNull(habitsTable.archivedAt));
      const nextPosition = (maxResult[0]?.maxPos ?? -1) + 1;

      const result = await db.insert(habitsTable).values({
        name: input.name,
        description: input.description ?? null,
        color: input.color,
        reminderTime: input.reminderTime ?? null,
        config: JSON.stringify(input.config),
        createdAt: today(),
        position: nextPosition,
      });
      await refetch();
      return result.lastInsertRowId;
    },
    [db, refetch]
  );

  const updateHabit = useCallback(
    async (id: number, input: Partial<CreateHabitInput>): Promise<void> => {
      const patch: Partial<HabitRow> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description ?? null;
      if (input.color !== undefined) patch.color = input.color;
      if (input.reminderTime !== undefined) patch.reminderTime = input.reminderTime ?? null;
      if (input.config !== undefined) patch.config = JSON.stringify(input.config);

      // Reschedule reminder if reminderTime changed
      if (input.reminderTime !== undefined) {
        const name = input.name ?? '';
        await rescheduleHabitReminder(id, name, input.reminderTime ?? null);
      }

      await db
        .update(habitsTable)
        .set(patch)
        .where(eq(habitsTable.id, id));
      await refetch();
    },
    [db, refetch]
  );

  const deleteHabit = useCallback(
    async (id: number): Promise<void> => {
      // Cancel any scheduled reminder before archiving
      await cancelHabitReminderById(id);
      // Soft delete: set archived_at timestamp instead of hard delete
      await db
        .update(habitsTable)
        .set({ archivedAt: today() })
        .where(eq(habitsTable.id, id));
      await refetch();
    },
    [db, refetch]
  );

  const reorderHabits = useCallback(
    async (orderedIds: number[]): Promise<void> => {
      await Promise.all(
        orderedIds.map((id, index) =>
          db.update(habitsTable).set({ position: index }).where(eq(habitsTable.id, id))
        )
      );
      await refetch();
    },
    [db, refetch]
  );

  return { habits, loading, error, refetch, createHabit, updateHabit, deleteHabit, reorderHabits };
}
