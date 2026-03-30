import React from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';

// Day labels in Spanish — index 0=Sun … 6=Sat
const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

type DayPickerProps = {
  value: number[];   // active (non-free) days — but we toggle "free" semantics
  onChange: (days: number[]) => void;
};

// NOTE: `value` holds the list of FREE days (days the habit is NOT tracked).
// When a user taps a day that is currently active (not in value), it becomes free → added to value.
// When a user taps a free day, it becomes active → removed from value.

export function DayPicker({ value, onChange }: DayPickerProps) {
  const freeDaysSet = new Set(value);

  const handlePress = (dayIndex: number) => {
    const isFree = freeDaysSet.has(dayIndex);

    if (isFree) {
      // Making the day active again — always safe
      onChange(value.filter((d) => d !== dayIndex));
    } else {
      // Making the day free — warn if this would leave 0 active days (all 7 free)
      const newFreeDays = [...value, dayIndex];
      const wouldBeAllFree = newFreeDays.length === 7;

      if (value.length === 6 || wouldBeAllFree) {
        Alert.alert(
          'Hábito inactivo',
          'Si marcás este día como libre, tu racha se perderá y el hábito quedará inactivo. ¿Continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              style: 'destructive',
              onPress: () => onChange(newFreeDays),
            },
          ]
        );
      } else {
        onChange(newFreeDays);
      }
    }
  };

  return (
    <View style={styles.row}>
      {DAY_LABELS.map((label, index) => {
        const isFree = freeDaysSet.has(index);
        return (
          <Pressable
            key={index}
            onPress={() => handlePress(index)}
            accessibilityRole="togglebutton"
            accessibilityState={{ selected: !isFree }}
            accessibilityLabel={`${label} ${isFree ? 'libre' : 'activo'}`}
            style={[
              styles.dayButton,
              !isFree && styles.dayButtonActive,
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                !isFree && styles.dayLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.input,
  },
  dayButtonActive: {
    backgroundColor: Colors.bg.card,
    borderColor: Colors.text.secondary,
  },
  dayLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.muted,
  },
  dayLabelActive: {
    color: Colors.text.primary,
    fontWeight: Typography.weights.bold,
  },
});
