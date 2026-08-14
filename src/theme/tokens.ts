export const colors = {
  light: {
    background: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F0ED',
    border: '#E5E3DE',
    text: '#181715',
    textMuted: '#6B6863',
    textInverse: '#FAFAF9',
    primary: '#FF5A36',
    primaryText: '#FFFFFF',
    pro: '#1D3557',
    proSoft: '#E7EDF5',
    collab: '#E85D75',
    collabSoft: '#FCE9EC',
    success: '#2A9D6F',
    danger: '#D64545',
    warning: '#E0A836',
  },
  dark: {
    background: '#121110',
    surface: '#1C1B19',
    surfaceAlt: '#252320',
    border: '#333029',
    text: '#F5F4F1',
    textMuted: '#A8A49C',
    textInverse: '#121110',
    primary: '#FF7A55',
    primaryText: '#121110',
    pro: '#7C9CC9',
    proSoft: '#1E2A3A',
    collab: '#F08398',
    collabSoft: '#3A2129',
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
