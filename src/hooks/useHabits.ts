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
import { showToast } from '../utils/toast';
import { parseHabit } from '../db/parsers';


// ─── Helper functions for optimistic UI ──────────────────────────────────────

// Pure function to reorder habits array based on new ID order
const applyReorderLocally = (habits: Habit[], newOrder: number[]): Habit[] => {
  const orderMap = new Map(newOrder.map((id, index) => [id, index]));
  return [...habits].sort((a, b) => 
    (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );
};
// ─── Input type ──────────────────────────────────────────────────────────────

export type CreateHabitInput = {
  name: string;
  description?: string | null;
  color: string;
  reminderTime?: string | null;
  reminderEnabled: boolean;
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
        reminderEnabled: input.reminderEnabled ? 1 : 0,
        config: JSON.stringify(input.config),
        createdAt: today(),
        position: nextPosition,
      });

      // Schedule notification only if reminder is enabled and time is set
      if (input.reminderEnabled && input.reminderTime) {
        await rescheduleHabitReminder(
          Number(result.lastInsertRowId),
          input.name,
          input.reminderTime
        );
      }

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
      if (input.config !== undefined) patch.config = JSON.stringify(input.config);
      if (input.reminderTime !== undefined) patch.reminderTime = input.reminderTime ?? null;
      if (input.reminderEnabled !== undefined) patch.reminderEnabled = input.reminderEnabled ? 1 : 0;

      // Handle notifications
      if (input.reminderEnabled === true && input.reminderTime) {
        await rescheduleHabitReminder(id, input.name ?? '', input.reminderTime);
      } else if (input.reminderEnabled === false) {
        await cancelHabitReminderById(id);
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

  // Async persist function with transaction
  const persistReorderInTransaction = useCallback(
    async (newOrder: number[]): Promise<void> => {
      await db.transaction(async (tx) => {
        for (let i = 0; i < newOrder.length; i++) {
          await tx
            .update(habitsTable)
            .set({ position: i })
            .where(eq(habitsTable.id, newOrder[i]));
        }
      });
    },
    [db]
  );

  const reorderHabits = useCallback(
    (sortedData: Habit[]): void => {
      const originalHabits = habits;
      const newOrder = sortedData.map((h) => h.id);

      const orderUnchanged =
        originalHabits.length === sortedData.length &&
        originalHabits.every((h, i) => h.id === sortedData[i].id);
      if (orderUnchanged) return;

      setHabits(sortedData);

      // Defer DB persistence so the synchronous JS path returns instantly
      // and React can commit the visual reorder without waiting for SQLite.
      setTimeout(() => {
        persistReorderInTransaction(newOrder).catch((error) => {
          console.error('Failed to reorder habits:', error);
          setHabits(originalHabits);
          showToast('Error al reordenar hábitos');
        });
      }, 0);
    },
    [habits, persistReorderInTransaction]
  );

  return { habits, loading, error, refetch, createHabit, updateHabit, deleteHabit, reorderHabits };
}
