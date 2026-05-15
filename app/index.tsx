import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ReorderableList, {
  ReorderableListReorderEvent,
  ReorderableListRenderItemInfo,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';
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
import { cancelAllReminders } from '../src/utils/notifications';
import type { Habit } from '../src/types';

// ─── Per-card data bridge ────────────────────────────────────────────────────
// Each HabitCardItem wires its own useCompletions + useStreak so renders are
// isolated — toggling one card only re-renders that card.

type HabitCardItemProps = {
  habit: Habit;
};

function HabitCardItemComponent({ habit }: HabitCardItemProps) {
  const router = useRouter();
  // useReorderableDrag subscribes to ReorderableCellContext; its identity
  // changes whenever the cell's index shifts during reorder. Stash it in a
  // ref and expose a stable wrapper so HabitCard's React.memo isn't blown
  // out on every drop.
  const drag = useReorderableDrag();
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const stableDrag = useCallback(() => dragRef.current(), []);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const todayStr = today();

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
      onLongPress={stableDrag}
    />
  );
}

// Memo with custom comparator - only re-render if habit data actually changed
const HabitCardItem = React.memo(
  HabitCardItemComponent,
  (prevProps, nextProps) => {
    // Return true if props are equal (should NOT re-render)
    // Return false if props are different (SHOULD re-render)
    
    const idEqual = prevProps.habit.id === nextProps.habit.id;
    const nameEqual = prevProps.habit.name === nextProps.habit.name;
    const descEqual = prevProps.habit.description === nextProps.habit.description;
    const colorEqual = prevProps.habit.color === nextProps.habit.color;
    const reminderEqual = prevProps.habit.reminderTime === nextProps.habit.reminderTime &&
      prevProps.habit.reminderEnabled === nextProps.habit.reminderEnabled;
    const createdEqual = prevProps.habit.createdAt === nextProps.habit.createdAt;
    const configEqual = JSON.stringify(prevProps.habit.config) === JSON.stringify(nextProps.habit.config);
    
    const allEqual = idEqual && nameEqual && descEqual && colorEqual && reminderEqual && createdEqual && configEqual;
    
    if (__DEV__) {
      console.log(`[MEMO] Habit ${nextProps.habit.id} - Returning ${allEqual} (${allEqual ? 'SKIP render' : 'WILL render'})`);
      if (!allEqual) {
        console.log(`[MEMO] Habit ${nextProps.habit.id} - Changed fields:`, {
          id: !idEqual,
          name: !nameEqual,
          desc: !descEqual,
          color: !colorEqual,
          reminder: !reminderEqual,
          created: !createdEqual,
          config: !configEqual,
        });
        console.log('[MEMO] Prev position:', prevProps.habit.position, 'Next position:', nextProps.habit.position);
      }
    }
    
    return allEqual;
  }
);

// ─── Draggable FlashList ─────────────────────────────────────────────────────
// Temporary: Use regular FlatList until drag implementation is fixed
// This eliminates the JS thread blocking from react-native-reorderable-list

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { habits, loading, refetch, reorderHabits } = useHabits();
  const { exportDb, isExporting } = useExportDb();

  // Refetch only when returning from another screen (not on initial mount or drag)
  const isInitialMount = React.useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      // Only refetch when coming back from another screen
      refetch();
    }, [refetch])
  );

  const renderItem = useCallback(
    ({ item }: ReorderableListRenderItemInfo<Habit>) => (
      <HabitCardItem habit={item} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Habit) => String(item.id), []);

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      if (from === to) return;
      const reordered = reorderItems(habits, from, to);
      reorderHabits(reordered);
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
            ...(__DEV__ ? [{ label: 'Limpiar notificaciones', icon: 'notifications-off-outline' as const, onPress: async () => { await cancelAllReminders(); alert('Notificaciones canceladas'); } }] : []),
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
          cellAnimations={{ opacity: 1, transform: [] }}
          animationDuration={120}
          shouldUpdateActiveItem={false}
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
