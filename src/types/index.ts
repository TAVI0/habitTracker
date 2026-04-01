export type HabitConfig = {
  freeDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
};

export type Habit = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  reminderTime: string | null; // "HH:MM"
  config: HabitConfig;
  createdAt: string; // "YYYY-MM-DD"
  archivedAt: string | null; // "YYYY-MM-DD" or null if active
};

export type Completion = {
  id: number;
  habitId: number;
  date: string; // "YYYY-MM-DD"
};

export type StreakResult = {
  current: number;
  longest: number;
  isActiveToday: boolean;
};

export type CellStatus = 'completed' | 'empty' | 'free' | 'future' | 'missed';
