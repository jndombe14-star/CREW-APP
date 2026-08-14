import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, scroll = false, style }: Props) {
  const { colors, spacing } = useTheme();
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.base, { backgroundColor: colors.background }]} edges={['top']}>
      <Container
        style={scroll ? undefined : [styles.flex, style]}
        contentContainerStyle={
          scroll ? [{ padding: spacing.lg, gap: spacing.lg }, style] : undefined
        }
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  flex: {
    flex: 1,
    padding: 16,
  },
});
