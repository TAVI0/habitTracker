import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as schema from '../db/schema';
import { habits as habitsTable, completions as completionsTable } from '../db/schema';

// ─── Types ───────────────────────────────────────────────────────────────────

type UseExportDbResult = {
  exportDb: () => Promise<void>;
  isExporting: boolean;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExportDb(): UseExportDbResult {
  const [isExporting, setIsExporting] = useState(false);
  const sqliteDb = useSQLiteContext();
  // useMemo keeps the drizzle client stable — matches the pattern in useHabits
  const db = useMemo(() => drizzle(sqliteDb, { schema }), [sqliteDb]);

  const exportDb = async () => {
    setIsExporting(true);
    try {
      const habits = await db.select().from(habitsTable);
      const completions = await db.select().from(completionsTable);

      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          version: 1,
          habits,
          completions,
        },
        null,
        2
      );

      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) {
        throw new Error('FileSystem no disponible en este entorno');
      }
      const uri = baseDir + 'habitTracker_export_' + Date.now() + '.json';

      await FileSystem.writeAsStringAsync(uri, payload, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Error',
          'El sistema de compartir no está disponible en este dispositivo.'
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar datos',
      });
    } catch (e) {
      console.error('[useExportDb] Error al exportar:', e);
      Alert.alert('Error', `No se pudo exportar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportDb, isExporting };
}
