import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, and, gte, lte } from 'drizzle-orm';
import { completions as completionsTable } from '../db/schema';
import * as schema from '../db/schema';

// Module-level cache to prevent redundant queries during re-mounts
type CacheKey = string;
type CacheEntry = {
  completions: string[];
  timestamp: number;
};

const completionsCache = new Map<CacheKey, CacheEntry>();
const CACHE_TTL_MS = 5000;
const CACHE_MAX_SIZE = 50;

function getCacheKey(habitId: number, fromDate: string, toDate: string): CacheKey {
  return `${habitId}-${fromDate}-${toDate}`;
}

function getCachedCompletions(key: CacheKey): string[] | null {
  const entry = completionsCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    completionsCache.delete(key);
    return null;
  }
  
  return entry.completions;
}

function setCachedCompletions(key: CacheKey, completions: string[]): void {
  if (completionsCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry (Map preserves insertion order)
    const firstKey = completionsCache.keys().next().value;
    if (firstKey !== undefined) completionsCache.delete(firstKey);
  }
  completionsCache.set(key, {
    completions,
    timestamp: Date.now(),
  });
}

export function useCompletions(
  habitId: number,
  fromDate: string,
  toDate: string
) {
  const sqliteDb = useSQLiteContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);

  // Initialize state with cached value if available (prevents flicker on re-mount)
  const cacheKey = getCacheKey(habitId, fromDate, toDate);
  const initialCompletions = getCachedCompletions(cacheKey) ?? [];
  
  const [completions, setCompletions] = useState<string[]>(initialCompletions);
  const [loading, setLoading] = useState(initialCompletions.length === 0);
  const isToggling = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const cacheKey = getCacheKey(habitId, fromDate, toDate);
      const cached = getCachedCompletions(cacheKey);
      
      if (cached !== null) {
        // Cache hit - return immediately without query
        setCompletions(cached);
        setLoading(false);
        return;
      }
      
      // Cache miss - query database
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
      
      const completionDates = rows.map((r) => r.date);
      setCachedCompletions(cacheKey, completionDates);
      setCompletions(completionDates);
    } finally {
      setLoading(false);
    }
  }, [db, habitId, fromDate, toDate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleCompletion = useCallback(
    async (date: string): Promise<void> => {
      if (isToggling.current) return;
      isToggling.current = true;
      try {
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

      // Invalidate cache after mutation
      const cacheKey = getCacheKey(habitId, fromDate, toDate);
      completionsCache.delete(cacheKey);
      await refetch();
      } finally {
        isToggling.current = false;
      }
    },
    [db, habitId, fromDate, toDate, refetch]
  );

  return { completions, loading, refetch, toggleCompletion };
}
