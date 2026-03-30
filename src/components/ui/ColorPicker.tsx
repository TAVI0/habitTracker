import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

const SWATCH_SIZE = 32;

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {Colors.accent.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={color}
            style={[
              styles.swatch,
              { backgroundColor: color },
              selected && styles.selected,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
