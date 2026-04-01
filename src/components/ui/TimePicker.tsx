import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TextInput, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';

type TimePickerProps = {
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
  label?: string;
};

/**
 * Cross-platform time picker component.
 * - iOS/Android: Native time picker with 24-hour format
 * - Web: TextInput fallback with HH:MM placeholder
 */
export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Convert "HH:MM" string to Date object
  const timeToDate = (timeStr: string): Date => {
    const now = new Date();
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      return now;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Convert Date object to "HH:MM" string
  const dateToTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(dateToTime(selectedDate));
    }
  };

  // Web fallback: simple TextInput
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="HH:MM"
          placeholderTextColor={Colors.text.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel={label || 'Hora'}
        />
      </View>
    );
  }

  // Native platforms (iOS/Android)
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={styles.timeButton}
        accessibilityRole="button"
        accessibilityLabel={label || 'Seleccionar hora'}
      >
        <Text style={styles.timeText}>{value || 'HH:MM'}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          {...(Platform.OS === 'ios' && {
            onTouchCancel: () => setShowPicker(false),
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeButton: {
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  input: {
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
});
