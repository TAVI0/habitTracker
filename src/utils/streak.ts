import type { HabitConfig, StreakResult } from '../types';
import { getDayOfWeek } from './dateUtils';

/**
 * Calculates streak data for a habit.
 *
 * Rules:
 * - Non-free day completed   → cuenta +1
 * - Non-free day no completado (pasado) → rompe la racha
 * - Non-free día de hoy sin completar   → no penaliza (todavía hay tiempo)
 * - Día libre completado     → cuenta +1 (bonus)
 * - Día libre sin completar  → transparente (no rompe, no cuenta)
 */
export function calculateStreak(
  completions: string[],
  config: HabitConfig,
  referenceDate: string
): StreakResult {
  if (config.freeDays.length === 7) {
    return { current: 0, longest: 0, isActiveToday: false };
  }

  const completionSet = new Set(completions.filter((d) => d <= referenceDate));
  const freeDaySet = new Set(config.freeDays);

  const todayDow = getDayOfWeek(referenceDate);
  const todayCompleted = completionSet.has(referenceDate);
  const todayFree = freeDaySet.has(todayDow);

  const isActiveToday = todayCompleted || todayFree;

  // Si hoy no fue completado y no es libre, arrancamos desde ayer
  const startDate =
    !todayCompleted && !todayFree ? prevDay(referenceDate) : referenceDate;

  const current = walkBack(completionSet, freeDaySet, startDate);
  const longest = longestStreak(completionSet, freeDaySet);

  return { current, longest, isActiveToday };
}

/**
 * Camina hacia atrás desde `fromDate` contando días en racha.
 *
 * - Día libre completado   → +1, continúa
 * - Día libre sin completar → skip, continúa
 * - Día normal completado  → +1, continúa
 * - Día normal sin completar → rompe
 */
function walkBack(
  completionSet: Set<string>,
  freeDaySet: Set<number>,
  fromDate: string
): number {
  let streak = 0;
  let cursor = fromDate;

  // Safety: no más de 10 años hacia atrás
  const limit = subtractDays(fromDate, 3650);

  while (cursor > limit) {
    const dow = getDayOfWeek(cursor);
    const isFree = freeDaySet.has(dow);
    const completed = completionSet.has(cursor);

    if (isFree) {
      if (completed) streak++; // libre completado → cuenta
      // libre no completado → skip sin romper
    } else {
      if (completed) {
        streak++;
      } else {
        break; // día obligatorio no completado → racha rota
      }
    }

    cursor = prevDay(cursor);
  }

  return streak;
}

/**
 * Calcula la racha más larga histórica en O(n log n).
 * Ordena las completions y hace un único pass hacia adelante: si entre dos
 * fechas consecutivas no hay días obligatorios sin completar, la racha continúa.
 */
function longestStreak(
  completionSet: Set<string>,
  freeDaySet: Set<number>
): number {
  if (completionSet.size === 0) return 0;

  const sorted = [...completionSet].sort();
  let longest = 0;
  let current = 0;
  let prev: string | null = null;

  for (const date of sorted) {
    if (prev === null || missedMandatoryDays(prev, date, freeDaySet) > 0) {
      current = 1;
    } else {
      current++;
    }
    if (current > longest) longest = current;
    prev = date;
  }

  return longest;
}

/**
 * Cuenta días obligatorios (no libres) entre `from` (exclusive) y `to` (exclusive).
 */
function missedMandatoryDays(from: string, to: string, freeDaySet: Set<number>): number {
  let count = 0;
  let cursor = nextDay(from);
  while (cursor < to) {
    if (!freeDaySet.has(getDayOfWeek(cursor))) count++;
    cursor = nextDay(cursor);
  }
  return count;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function prevDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return toISO(d);
}

function nextDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return toISO(d);
}

function subtractDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return toISO(d);
}

function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
