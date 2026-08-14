import { useColorScheme } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function useTheme() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { colors: palette, spacing, radius, typography, scheme: scheme ?? 'light' };
}
