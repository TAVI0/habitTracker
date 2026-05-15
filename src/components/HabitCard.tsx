import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Calendar } from './calendar';
import { CALENDAR_STEP } from './calendar/Calendar';
import { CheckboxToday } from './ui/CheckboxToday';
import { StreakBadge } from './ui/StreakBadge';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import type { Habit, StreakResult } from '../types';

// Card calendar fits exactly the card's inner width — no horizontal scroll.
// Inner width = screen − (list padding × 2) − (card padding × 2).
const CARD_INNER_WIDTH = Dimensions.get('window').width - Spacing.md * 4;
const CARD_WEEKS_TO_SHOW = Math.max(1, Math.floor(CARD_INNER_WIDTH / CALENDAR_STEP));

type HabitCardProps = {
  habit: Habit;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleToday: () => void;
  completionDates: string[];
  streak: StreakResult;
};

function HabitCardComponent({
  habit,
  onPress,
  onLongPress,
  onToggleToday,
  completionDates,
  streak,
}: HabitCardProps) {
  if (__DEV__) console.log('[PERF] HabitCard RENDER -', habit.id, habit.name);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Hábito: ${habit.name}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top row: name (izq) | checkbox + racha (der) */}
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.topRight}>
          <StreakBadge streak={streak} color={habit.color} reminderTime={habit.reminderTime} reminderEnabled={habit.reminderEnabled} />
          <CheckboxToday
            completed={streak.isActiveToday}
            color={habit.color}
            onPress={onToggleToday}
          />
        </View>
      </View>

      {/* Calendar � 52 semanas, scrolleado al d�a de hoy */}
      <View style={styles.calendarWrapper}>
        <Calendar
          habitId={habit.id}
          completionDates={completionDates}
          color={habit.color}
          config={habit.config}
          weeksToShow={CARD_WEEKS_TO_SHOW}
        />
      </View>

      {/* Descripci�n opcional */}
      {habit.description ? (
        <Text style={styles.description} numberOfLines={1}>
          {habit.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Custom memo comparator to prevent unnecessary re-renders
const arePropsEqual = (
  prevProps: HabitCardProps,
  nextProps: HabitCardProps
): boolean => {
  // Only re-render if actual data changes (ignore position)
  return (
    prevProps.habit.id === nextProps.habit.id &&
    prevProps.habit.name === nextProps.habit.name &&
    prevProps.habit.description === nextProps.habit.description &&
    prevProps.habit.color === nextProps.habit.color &&
    prevProps.habit.reminderTime === nextProps.habit.reminderTime &&
    prevProps.habit.reminderEnabled === nextProps.habit.reminderEnabled &&
    prevProps.completionDates === nextProps.completionDates &&
    prevProps.streak.current === nextProps.streak.current &&
    prevProps.streak.longest === nextProps.streak.longest &&
    prevProps.streak.isActiveToday === nextProps.streak.isActiveToday
  );
};

export const HabitCard = React.memo(HabitCardComponent, arePropsEqual);

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md, // Spacing for list (avoids layout shift during drag)
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  calendarWrapper: {
    overflow: 'hidden',
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  },
});
