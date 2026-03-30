import { useMemo } from 'react';
import type { Habit, StreakResult } from '../types';
import { calculateStreak } from '../utils/streak';
import { today } from '../utils/dateUtils';

const EMPTY_STREAK: StreakResult = {
  current: 0,
  longest: 0,
  isActiveToday: false,
};

export function useStreak(
  habit: Habit | null,
  completionDates: string[]
): StreakResult {
  return useMemo(() => {
    if (!habit) return EMPTY_STREAK;
    return calculateStreak(completionDates, habit.config, today());
  }, [habit, completionDates]);
}
