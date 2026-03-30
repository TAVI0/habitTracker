import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import type { HabitConfig } from '../../types';

type StreakRulePickerProps = {
  value: HabitConfig['streakRule'];
  onChange: (rule: HabitConfig['streakRule']) => void;
};

export function StreakRulePicker({ value, onChange }: StreakRulePickerProps) {
  const isDaily = value.type === 'daily';
  const isWeekly = value.type === 'weekly';

  const selectDaily = () => {
    onChange({ type: 'daily', requiredCount: 1 });
  };

  const selectWeekly = () => {
    if (!isWeekly) {
      onChange({ type: 'weekly', requiredCount: value.requiredCount ?? 3 });
    }
  };

  const decrementCount = () => {
    if (value.requiredCount > 1) {
      onChange({ ...value, requiredCount: value.requiredCount - 1 });
    }
  };

  const incrementCount = () => {
    if (value.requiredCount < 7) {
      onChange({ ...value, requiredCount: value.requiredCount + 1 });
    }
  };

  return (
    <View style={styles.container}>
      {/* Type toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={selectDaily}
          accessibilityRole="radio"
          accessibilityState={{ selected: isDaily }}
          style={[styles.option, isDaily && styles.optionActive]}
        >
          <Text style={[styles.optionText, isDaily && styles.optionTextActive]}>
            Diario
          </Text>
        </Pressable>
        <Pressable
          onPress={selectWeekly}
          accessibilityRole="radio"
          accessibilityState={{ selected: isWeekly }}
          style={[styles.option, isWeekly && styles.optionActive]}
        >
          <Text style={[styles.optionText, isWeekly && styles.optionTextActive]}>
            Semanal
          </Text>
        </Pressable>
      </View>

      {/* Weekly requiredCount stepper */}
      {isWeekly && (
        <View style={styles.stepperRow}>
          <Text style={styles.stepperLabel}>Veces por semana</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={decrementCount}
              disabled={value.requiredCount <= 1}
              accessibilityLabel="Reducir"
              style={[
                styles.stepperBtn,
                value.requiredCount <= 1 && styles.stepperBtnDisabled,
              ]}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperCount}>{value.requiredCount}</Text>
            <Pressable
              onPress={incrementCount}
              disabled={value.requiredCount >= 7}
              accessibilityLabel="Aumentar"
              style={[
                styles.stepperBtn,
                value.requiredCount >= 7 && styles.stepperBtnDisabled,
              ]}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg.input,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: Colors.text.secondary,
    backgroundColor: Colors.bg.card,
  },
  optionText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.muted,
  },
  optionTextActive: {
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperBtnText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    lineHeight: Typography.sizes.lg + 4,
  },
  stepperCount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
});
