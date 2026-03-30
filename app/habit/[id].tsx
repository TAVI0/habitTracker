import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from '../../src/components/calendar';
import { StreakBadge } from '../../src/components/ui/StreakBadge';
import { useHabitDetail } from '../../src/hooks/useHabitDetail';
import { useHabits } from '../../src/hooks/useHabits';
import { useCompletions } from '../../src/hooks/useCompletions';
import { useStreak } from '../../src/hooks/useStreak';
import { cancelHabitReminderById } from '../../src/utils/notifications';
import { today } from '../../src/utils/dateUtils';
import { Colors, Spacing, Radius, Typography } from '../../src/constants/theme';

// ─── Day labels ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const habitId = Number(id);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const todayStr = today();

  const { habit, loading, refetch: refetchHabit } = useHabitDetail(habitId);
  const { deleteHabit } = useHabits();
  const { completions, refetch: refetchCompletions } = useCompletions(habitId, yearStart, todayStr);
  const streak = useStreak(habit, completions);

  useFocusEffect(
    useCallback(() => {
      refetchHabit();
      refetchCompletions();
    }, [refetchHabit, refetchCompletions])
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar hábito',
      '¿Eliminar este hábito? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (habit?.config.notificationId) {
              await cancelHabitReminderById(habitId);
            }
            await deleteHabit(habitId);
            router.replace('/');
          },
        },
      ]
    );
  }, [habit, habitId, deleteHabit, router]);

  const handleEdit = useCallback(() => {
    router.push(`/habit/${habitId}/edit`);
  }, [router, habitId]);

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
      </View>
    );
  }

  const activeDays = ALL_DAYS.filter((d) => !habit.config.freeDays.includes(d));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: colored dot + name + back */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
          <Text style={styles.habitName} numberOfLines={2}>
            {habit.name}
          </Text>
        </View>

        {/* Description */}
        {habit.description ? (
          <Text style={styles.description}>{habit.description}</Text>
        ) : null}

        {/* Streak section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Racha</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakCard}>
              <Text style={styles.streakNumber}>{streak.current}</Text>
              <Text style={styles.streakLabel}>Actual</Text>
            </View>
            <View style={styles.streakCard}>
              <Text style={styles.streakNumber}>{streak.longest}</Text>
              <Text style={styles.streakLabel}>Mejor</Text>
            </View>
            <View style={[styles.streakCard, styles.streakCardBadge]}>
              <StreakBadge streak={streak} color={habit.color} />
              <Text style={styles.streakLabel}>
                {streak.isActiveToday ? 'Activo hoy' : 'Sin completar'}
              </Text>
            </View>
          </View>
        </View>

        {/* Full calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          <View style={styles.calendarWrapper}>
            <Calendar
              completionDates={completions}
              color={habit.color}
              config={habit.config}
            />
          </View>
        </View>

        {/* Config summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configKey}>Tipo de racha</Text>
              <Text style={styles.configValue}>
                {habit.config.streakRule.type === 'daily'
                  ? 'Diario'
                  : `Semanal (${habit.config.streakRule.requiredCount}×/sem)`}
              </Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configKey}>Días activos</Text>
              <Text style={styles.configValue}>
                {activeDays.length === 7
                  ? 'Todos los días'
                  : activeDays.length === 0
                  ? 'Ninguno'
                  : activeDays.map((d) => DAY_LABELS[d]).join(', ')}
              </Text>
            </View>
            {habit.reminderTime ? (
              <View style={styles.configRow}>
                <Text style={styles.configKey}>Recordatorio</Text>
                <Text style={styles.configValue}>{habit.reminderTime}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            style={[styles.actionButton, { borderColor: habit.color }]}
            accessibilityRole="button"
            accessibilityLabel="Editar hábito"
          >
            <Text style={[styles.actionButtonText, { color: habit.color }]}>
              Editar
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton]}
            accessibilityRole="button"
            accessibilityLabel="Eliminar hábito"
          >
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.screen,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bg.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.md,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  // ─── Header ───────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  backText: {
    fontSize: 28,
    color: Colors.text.primary,
    lineHeight: 32,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  habitName: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.md * 1.5,
  },
  // ─── Sections ─────────────────────────────────────────────────────────────
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // ─── Streak ───────────────────────────────────────────────────────────────
  streakRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  streakCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  streakCardBadge: {
    flex: 1.2,
  },
  streakNumber: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  streakLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  // ─── Calendar ─────────────────────────────────────────────────────────────
  calendarWrapper: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    overflow: 'hidden',
  },
  // ─── Config ───────────────────────────────────────────────────────────────
  configCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  configKey: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  configValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    textAlign: 'right',
  },
  // ─── Actions ──────────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  deleteButton: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#EF4444',
  },
});
