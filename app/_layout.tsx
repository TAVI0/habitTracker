import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { LogBox } from 'react-native';
import migrations from '../src/db/migrations/migrations';
import * as schema from '../src/db/schema';
import { setupNotificationHandler, requestPermissions } from '../src/utils/notifications';

// Ignorar warning de expo-notifications en Expo Go (no afecta notificaciones locales)
LogBox.ignoreLogs([
  'expo-notifications',
  'Push notifications',
]);

function MigrationsGate({ children }: { children: React.ReactNode }) {
  const sqliteDb = useSQLiteContext();
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Set up notification handler at module level (executes once when layout mounts)
void setupNotificationHandler();

// Request permissions on first launch (best-effort — user can deny)
void requestPermissions();

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="habitTracker.db" useSuspense={false}>
      <MigrationsGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Habits', headerShown: false }} />
          <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="habit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="habit/[id]/edit" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </MigrationsGate>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
