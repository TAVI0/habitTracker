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


export type UseHabitsReturn = {
  habits: Habit[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createHabit: (input: import('../hooks/useHabits').CreateHabitInput) => Promise<number>;
  deleteHabit: (id: number) => Promise<void>;
};

export type UseCompletionsReturn = {
  completionDates: string[];
  loading: boolean;
  toggleCompletion: (date: string) => Promise<void>;
};
