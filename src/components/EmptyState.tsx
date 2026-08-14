import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = {
  icon?: string;
  title: string;
  description?: string;
};

export function EmptyState({ icon = '✨', title, description }: Props) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.base, { padding: spacing.xxl, gap: spacing.sm }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[typography.subtitle, { color: colors.text, textAlign: 'center' }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },
});
