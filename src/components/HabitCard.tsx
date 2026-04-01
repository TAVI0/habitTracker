import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Calendar } from './calendar';
import { CheckboxToday } from './ui/CheckboxToday';
import { StreakBadge } from './ui/StreakBadge';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import type { Habit, StreakResult } from '../types';

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
          <StreakBadge streak={streak} color={habit.color} />
          <CheckboxToday
            completed={streak.isActiveToday}
            color={habit.color}
            onPress={onToggleToday}
          />
        </View>
      </View>

      {/* Calendar — 52 semanas, scrolleado al día de hoy */}
      <View style={styles.calendarWrapper}>
        <Calendar
          completionDates={completionDates}
          color={habit.color}
          config={habit.config}
        />
      </View>

      {/* Descripción opcional */}
      {habit.description ? (
        <Text style={styles.description} numberOfLines={1}>
          {habit.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const HabitCard = React.memo(HabitCardComponent);

const styles = StyleSheet.create({
  card: {
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
