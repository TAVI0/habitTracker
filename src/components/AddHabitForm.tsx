import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ColorPicker } from './ui/ColorPicker';
import { DayPicker } from './ui/DayPicker';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import type { HabitConfig } from '../types';
import type { CreateHabitInput } from '../hooks/useHabits';

// ─── Props ────────────────────────────────────────────────────────────────────

type AddHabitFormProps = {
  initialValues?: Partial<CreateHabitInput>;
  onSubmit: (input: CreateHabitInput) => void;
  onCancel: () => void;
  submitLabel?: string;
};

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationErrors = {
  name?: string;
};

function validate(name: string): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!name.trim()) {
    errors.name = 'El nombre es obligatorio';
  } else if (name.trim().length > 40) {
    errors.name = 'El nombre no puede superar 40 caracteres';
  }
  return errors;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: HabitConfig = {
  freeDays: [],
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AddHabitForm({ initialValues, onSubmit, onCancel, submitLabel = 'Crear hábito' }: AddHabitFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [color, setColor] = useState(initialValues?.color ?? Colors.accent[0]);
  const [reminderTime, setReminderTime] = useState(initialValues?.reminderTime ?? '');
  const [config, setConfig] = useState<HabitConfig>(
    initialValues?.config ?? DEFAULT_CONFIG
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleFreeDaysChange = useCallback((freeDays: number[]) => {
    setConfig((prev) => ({ ...prev, freeDays }));
  }, []);

  const handleSubmit = useCallback(() => {
    const validationErrors = validate(name);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validate reminderTime format if provided
    const trimmedTime = reminderTime.trim();
    const isValidTime = trimmedTime === '' || /^\d{2}:\d{2}$/.test(trimmedTime);
    if (!isValidTime) {
      setErrors({ ...validationErrors, name: undefined });
      // Just clear the reminder if invalid format
      onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        color,
        reminderTime: null,
        config,
      });
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      color,
      reminderTime: trimmedTime || null,
      config,
    });
  }, [name, description, color, reminderTime, config, onSubmit]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Ej: Meditar, Leer..."
          placeholderTextColor={Colors.text.muted}
          maxLength={40}
          returnKeyType="next"
          accessibilityLabel="Nombre del hábito"
        />
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : (
          <Text style={styles.charCount}>{name.length}/40</Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="¿Para qué querés este hábito?"
          placeholderTextColor={Colors.text.muted}
          multiline
          numberOfLines={3}
          maxLength={120}
          textAlignVertical="top"
          accessibilityLabel="Descripción del hábito"
        />
        <Text style={styles.charCount}>{(description ?? '').length}/120</Text>
      </View>

      {/* Color */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Color</Text>
        <ColorPicker value={color} onChange={setColor} />
      </View>

      {/* Reminder Time */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Recordatorio (opcional)</Text>
        <TextInput
          style={styles.input}
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="HH:MM"
          placeholderTextColor={Colors.text.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel="Hora del recordatorio"
        />
        <Text style={styles.hint}>Formato 24h, ej: 07:30</Text>
      </View>

      {/* Free Days */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Días libres</Text>
        <Text style={styles.hint}>Los días marcados no rompen la racha si no los completás</Text>
        <View style={styles.pickerWrapper}>
          <DayPicker value={config.freeDays} onChange={handleFreeDaysChange} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: color },
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
        >
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg.modal,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  inputMultiline: {
    minHeight: 80,
    paddingTop: Spacing.sm + 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: '#EF4444',
    marginTop: 2,
  },
  charCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    textAlign: 'right',
  },
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  },
  pickerWrapper: {
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
  },
  submitButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
