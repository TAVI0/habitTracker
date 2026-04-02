import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitCard } from '../src/components/HabitCard';
import { KebabMenu } from '../src/components/ui/KebabMenu';
import { useHabits } from '../src/hooks/useHabits';
import { useCompletions } from '../src/hooks/useCompletions';
import { useStreak } from '../src/hooks/useStreak';
import { useExportDb } from '../src/hooks/useExportDb';
import { Colors, Spacing, Radius, Typography } from '../src/constants/theme';
import { today } from '../src/utils/dateUtils';
import type { Habit } from '../src/types';

// ─── Per-card data bridge ────────────────────────────────────────────────────
// Each HabitCardItem wires its own useCompletions + useStreak so renders are
// isolated — toggling one card only re-renders that card.

type HabitCardItemProps = {
  habit: Habit;
};

function HabitCardItem({ habit }: HabitCardItemProps) {
  const router = useRouter();
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const todayStr = today();
  const drag = useReorderableDrag();

  const { completions, toggleCompletion } = useCompletions(
    habit.id,
    yearStart,
    todayStr
  );

  const streak = useStreak(habit, completions);

  const handleToggleToday = useCallback(() => {
    toggleCompletion(todayStr);
  }, [toggleCompletion, todayStr]);

  const handlePress = useCallback(() => {
    router.push(`/habit/${habit.id}`);
  }, [router, habit.id]);

  return (
    <HabitCard
      habit={habit}
      completionDates={completions}
      streak={streak}
      onToggleToday={handleToggleToday}
      onPress={handlePress}
      onLongPress={drag}
    />
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { habits, loading, refetch, reorderHabits } = useHabits();
  const { exportDb, isExporting } = useExportDb();

  // Refetch cada vez que la pantalla vuelve a foco (ej: al volver desde /add)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Habit>) => <HabitCardItem habit={item} />,
    []
  );

  const keyExtractor = useCallback((item: Habit) => String(item.id), []);

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      const newOrder = reorderItems(habits, from, to);
      reorderHabits(newOrder.map(h => h.id));
    },
    [habits, reorderHabits]
  );

  const handleAddPress = useCallback(() => {
    router.push('/add');
  }, [router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent[0]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Hábitos</Text>
        <KebabMenu
          disabled={isExporting}
          items={[
            { label: 'Archivo', icon: 'archive-outline', onPress: () => router.push('/archive') },
            { label: 'Exportar DB', icon: 'download-outline', onPress: exportDb },
          ]}
        />
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No tenés hábitos aún. ¡Agregá uno!
          </Text>
          <Pressable
            onPress={handleAddPress}
            style={styles.emptyAddButton}
            accessibilityRole="button"
            accessibilityLabel="Agregar hábito"
          >
            <Text style={styles.emptyAddButtonText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <ReorderableList
          data={habits}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onReorder={handleReorder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Agregar hábito"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bg.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
    paddingBottom: FAB_SIZE + Spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyAddButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddButtonText: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.xl + 4,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent[0],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.xl + 4,
  },
});
