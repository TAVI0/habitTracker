import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddHabitForm } from '../src/components/AddHabitForm';
import { useHabits } from '../src/hooks/useHabits';
import { scheduleHabitReminder } from '../src/utils/notifications';
import { Colors, Spacing, Typography } from '../src/constants/theme';
import type { CreateHabitInput } from '../src/hooks/useHabits';

export default function AddHabitScreen() {
  const router = useRouter();
  const { createHabit } = useHabits();

  const handleSubmit = useCallback(
    async (input: CreateHabitInput) => {
      const newId = await createHabit(input);

      if (input.reminderTime) {
        await scheduleHabitReminder(newId, input.name, input.reminderTime);
      }

      router.back();
    },
    [createHabit, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo hábito</Text>
      </View>
      <AddHabitForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.modal,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
});
