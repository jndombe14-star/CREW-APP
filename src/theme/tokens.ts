export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F8',
    border: '#E7E7ED',
    text: '#14162B',
    textMuted: '#6B6F80',
    textInverse: '#FFFFFF',
    primary: '#FFC629',
    primaryText: '#14162B',
    pro: '#14162B',
    proSoft: '#E9E9F0',
    collab: '#FF7A00',
    collabSoft: '#FFE9D6',
    success: '#2A9D6F',
    danger: '#D64545',
    warning: '#B8860B',
  },
  dark: {
    background: '#0F1022',
    surface: '#181A2E',
    surfaceAlt: '#22243B',
    border: '#33354D',
    text: '#F5F5F8',
    textMuted: '#9A9CB0',
    textInverse: '#14162B',
    primary: '#FFC629',
    primaryText: '#14162B',
    pro: '#F5F5F8',
    proSoft: '#282A44',
    collab: '#FF9433',
    collabSoft: '#3A2A18',
    success: '#4FC08D',
    danger: '#E5716C',
    warning: '#E8BC5C',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  subtitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 16 },
};

export type ThemeColors = typeof colors.light;
