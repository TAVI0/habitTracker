import React, { useCallback } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Colors, Radius } from '../../constants/theme';

type CheckboxTodayProps = {
  completed: boolean;
  color: string;
  onPress: () => void;
  disabled?: boolean;
};

export function CheckboxToday({
  completed,
  color,
  onPress,
  disabled = false,
}: CheckboxTodayProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed, disabled }}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.box,
          completed
            ? { backgroundColor: color, borderColor: color }
            : styles.unchecked,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.disabled,
        ]}
      >
        {completed && (
          <View style={styles.checkmarkContainer}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Polyline
                points="5,12 10,17 19,8"
                stroke={Colors.text.inverse}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unchecked: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
