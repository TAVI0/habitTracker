import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '../../constants/theme';
import type { StreakResult } from '../../types';

type StreakBadgeProps = {
  streak: StreakResult;
  color: string;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
};

export function StreakBadge({ streak, color, reminderTime, reminderEnabled }: StreakBadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color + '40' }]}>
      {reminderEnabled && reminderTime && <Text style={styles.bell}>🔔</Text>}
      <Text style={styles.flame}>🔥</Text>
      <Text style={[styles.count, { color }]}>{streak.current}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bell: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm + 4,
  },
  flame: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm + 4,
  },
  count: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.sm + 4,
  },
});
