import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Card({ style, ...props }: ViewProps) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
