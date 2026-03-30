import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MenuItem = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type KebabMenuProps = {
  items: MenuItem[];
  color?: string;
  disabled?: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KebabMenu({
  items,
  color = Colors.text.primary,
  disabled = false,
}: KebabMenuProps) {
  const [visible, setVisible] = useState(false);

  const handleOpen = () => {
    if (!disabled) setVisible(true);
  };

  const handleClose = () => setVisible(false);

  const handleItemPress = (item: MenuItem) => {
    setVisible(false);
    item.onPress();
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
        hitSlop={8}
        style={styles.trigger}
      >
        {disabled ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name="ellipsis-horizontal" size={24} color={color} />
        )}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <View
              style={styles.menuCard}
              onStartShouldSetResponder={() => true}
            >
              {items.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleItemPress(item)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="button"
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={Colors.text.primary}
                      style={styles.menuItemIcon}
                    />
                  )}
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  trigger: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    top: 50,
    right: Spacing.md,
    minWidth: 160,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  menuItemPressed: {
    backgroundColor: Colors.bg.input,
  },
  menuItemIcon: {
    marginRight: Spacing.sm,
  },
  menuItemLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
});
