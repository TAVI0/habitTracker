import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, and, gte, lte } from 'drizzle-orm';
import { completions as completionsTable } from '../db/schema';
import * as schema from '../db/schema';

export function useCompletions(
  habitId: number,
  fromDate: string,
  toDate: string
) {
  const sqliteDb = useSQLiteContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);

  const [completions, setCompletions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const rows = await db
        .select({ date: completionsTable.date })
        .from(completionsTable)
        .where(
          and(
            eq(completionsTable.habitId, habitId),
            gte(completionsTable.date, fromDate),
            lte(completionsTable.date, toDate)
          )
        );
      setCompletions(rows.map((r) => r.date));
    } finally {
      setLoading(false);
    }
  }, [db, habitId, fromDate, toDate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleCompletion = useCallback(
    async (date: string): Promise<void> => {
      // Check if a completion exists for this date
      const existing = await db
        .select({ id: completionsTable.id })
        .from(completionsTable)
        .where(
          and(
            eq(completionsTable.habitId, habitId),
            eq(completionsTable.date, date)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Exists → delete
        await db
          .delete(completionsTable)
          .where(eq(completionsTable.id, existing[0].id));
      } else {
        // Absent → insert
        await db.insert(completionsTable).values({ habitId, date });
      }

      await refetch();
    },
    [db, habitId, refetch]
  );

  return { completions, loading, refetch, toggleCompletion };
}
