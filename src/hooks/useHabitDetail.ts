import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, isNull, and } from 'drizzle-orm';
import { habits as habitsTable } from '../db/schema';
import * as schema from '../db/schema';
import type { Habit, HabitConfig } from '../types';

type HabitRow = typeof habitsTable.$inferSelect;

function parseHabit(row: HabitRow): Habit {
  return {
    ...row,
    config: JSON.parse(row.config) as HabitConfig,
  };
}

export function useHabitDetail(id: number) {
  const sqliteDb = useSQLiteContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const rows = await db
        .select()
        .from(habitsTable)
        .where(and(eq(habitsTable.id, id), isNull(habitsTable.archivedAt)))
        .limit(1);
      setHabit(rows.length > 0 ? parseHabit(rows[0]) : null);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { habit, loading, refetch };
}
