import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/useTheme';

export default function Welcome() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xxl }}>
        <View style={{ gap: spacing.sm, marginTop: spacing.xxl }}>
          <Text style={{ fontSize: 44 }}>🎬</Text>
          <Text style={[typography.display, { color: colors.text }]}>CREW</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Trouve tes gens. Trouve ton lieu. Crée ensemble.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <Button label="Créer un compte" onPress={() => router.push('/register')} />
          <Button
            label="J'ai déjà un compte"
            variant="secondary"
            onPress={() => router.push('/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
