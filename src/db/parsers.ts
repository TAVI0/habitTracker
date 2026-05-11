import { habits } from './schema';
import type { Habit, HabitConfig } from '../types';

export type HabitRow = typeof habits.$inferSelect;

export function parseHabit(row: HabitRow): Habit {
  return {
    ...row,
    config: JSON.parse(row.config) as HabitConfig,
    position: row.position ?? 0,
    reminderEnabled: row.reminderEnabled === 1,
  };
}
