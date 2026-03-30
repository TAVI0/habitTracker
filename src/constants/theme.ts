export const Colors = {
  bg: {
    screen: '#1A1A1A',
    card: '#2A2A2A',
    input: '#333333',
    modal: '#242424',
  },
  text: {
    primary: '#F0F0F0',
    secondary: '#A0A0A0',
    muted: '#606060',
    inverse: '#1A1A1A',
  },
  cell: {
    // 'completed' is dynamic (habit.color) — not stored here
    missed: '#3A3A3A',
    free: '#2F2F2F',
    future: '#232323',
    empty: '#1E1E1E',
  },
  accent: [
    '#4CAF50', // green
    '#2196F3', // blue
    '#FF5722', // deep orange
    '#9C27B0', // purple
    '#00BCD4', // cyan
    '#FFC107', // amber
    '#E91E63', // pink
    '#FF9800', // orange
  ] as string[],
  border: '#3A3A3A',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 999,
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  family: {
    default: undefined as string | undefined,
  },
};
