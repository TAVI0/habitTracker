import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddHabitForm } from '../../../src/components/AddHabitForm';
import { useHabitDetail } from '../../../src/hooks/useHabitDetail';
import { useHabits } from '../../../src/hooks/useHabits';
import { Colors, Spacing, Typography } from '../../../src/constants/theme';
import type { CreateHabitInput } from '../../../src/hooks/useHabits';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habitId = Number(id);
  const { habit, loading } = useHabitDetail(habitId);
  const { updateHabit } = useHabits();

  const handleSubmit = useCallback(
    async (input: CreateHabitInput) => {
      await updateHabit(habitId, input);
      router.back();
    },
    [habitId, updateHabit, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent[0]} />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Hábito no encontrado</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Editar hábito</Text>
      </View>
      <AddHabitForm
        initialValues={{
          name: habit.name,
          description: habit.description,
          color: habit.color,
          reminderEnabled: habit.reminderEnabled,
          reminderTime: habit.reminderTime,
          config: habit.config,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Guardar cambios"
      />
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
  center: {
    flex: 1,
    backgroundColor: Colors.bg.modal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
});
