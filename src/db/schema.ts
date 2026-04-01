import { int, text, sqliteTable, unique } from 'drizzle-orm/sqlite-core';

export const habits = sqliteTable('habits', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366F1'),
  reminderTime: text('reminder_time'),
  config: text('config').notNull().default('{"freeDays":[]}'),
  createdAt: text('created_at').notNull(),
  archivedAt: text('archived_at'),
});

export const completions = sqliteTable('completions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  habitId: int('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
}, (t) => ({
  unq: unique().on(t.habitId, t.date),
}));
