import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  const background: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    ghost: 'transparent',
    danger: colors.danger,
  };
  const textColor: Record<Variant, string> = {
    primary: colors.primaryText,
    secondary: colors.text,
    ghost: colors.text,
    danger: '#FFFFFF',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background[variant],
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <Text style={[typography.subtitle, { color: textColor[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
