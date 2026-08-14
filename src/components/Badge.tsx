import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Tone = 'pro' | 'collab' | 'neutral' | 'success';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors, spacing, radius, typography } = useTheme();

  const backgrounds: Record<Tone, string> = {
    pro: colors.proSoft,
    collab: colors.collabSoft,
    neutral: colors.surfaceAlt,
    success: colors.success + '22',
  };
  const textColors: Record<Tone, string> = {
    pro: colors.pro,
    collab: colors.collab,
    neutral: colors.textMuted,
    success: colors.success,
  };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: backgrounds[tone],
          borderRadius: radius.full,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <Text style={[typography.label, { color: textColors[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
});
