import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.text,
            backgroundColor: colors.surface,
          },
          typography.body,
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
