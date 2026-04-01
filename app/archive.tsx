import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useArchivedHabits } from '../src/hooks/useArchivedHabits';
import { Colors, Spacing, Radius, Typography } from '../src/constants/theme';
import type { Habit } from '../src/types';

// ─── Archived Habit Card ─────────────────────────────────────────────────────

type ArchivedHabitCardProps = {
  habit: Habit;
  onDelete: (id: number) => void;
  onUnarchive: (id: number) => void;
};

function ArchivedHabitCard({ habit, onDelete, onUnarchive }: ArchivedHabitCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `¿Estás seguro que querés eliminar "${habit.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(habit.id),
        },
      ]
    );
  };

  const handleUnarchive = () => {
    onUnarchive(habit.id);
  };

  return (
    <View style={styles.card}>
      {/* Header: color indicator + name */}
      <View style={styles.cardHeader}>
        <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
        <Text style={styles.habitName} numberOfLines={1}>
          {habit.name}
        </Text>
      </View>

      {/* Description if present */}
      {habit.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {habit.description}
        </Text>
      ) : null}

      {/* Archive date */}
      {habit.archivedAt ? (
        <Text style={styles.archiveDate}>
          Archivado el {formatDate(habit.archivedAt)}
        </Text>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleUnarchive}
          style={({ pressed }) => [
            styles.actionButton,
            styles.unarchiveButton,
            pressed && styles.actionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Desarchivar hábito"
        >
          <Ionicons name="arrow-undo-outline" size={16} color={Colors.text.primary} />
          <Text style={styles.unarchiveButtonText}>Desarchivar</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            pressed && styles.actionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Eliminar hábito"
        >
          <Ionicons name="trash-outline" size={16} color="#FF5722" />
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Archive Screen ──────────────────────────────────────────────────────────

export default function ArchiveScreen() {
  const router = useRouter();
  const { habits, loading, refetch, permanentDeleteHabit, unarchiveHabit } = useArchivedHabits();

  // Refetch cada vez que la pantalla vuelve a foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await permanentDeleteHabit(id);
    },
    [permanentDeleteHabit]
  );

  const handleUnarchive = useCallback(
    async (id: number) => {
      await unarchiveHabit(id);
    },
    [unarchiveHabit]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Habit>) => (
      <ArchivedHabitCard habit={item} onDelete={handleDelete} onUnarchive={handleUnarchive} />
    ),
    [handleDelete, handleUnarchive]
  );

  const keyExtractor = useCallback((item: Habit) => String(item.id), []);

  const handleBack = useCallback(() => {
    router.back();
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
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Archivo</Text>
        <View style={styles.headerSpacer} />
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="archive-outline"
            size={64}
            color={Colors.text.muted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>No hay hábitos archivados</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day}/${month}/${year}`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  headerSpacer: {
    width: 24,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bg.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  habitName: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    paddingLeft: Spacing.sm + 12, // align with habitName (colorDot width + gap)
  },
  archiveDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    paddingLeft: Spacing.sm + 12,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  unarchiveButton: {
    borderColor: Colors.border,
  },
  unarchiveButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  deleteButton: {
    borderColor: '#FF5722',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#FF5722',
  },
});
