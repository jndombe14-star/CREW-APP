import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function CollaborationsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="create" options={{ title: 'Nouvelle collaboration' }} />
      <Stack.Screen name="mine" options={{ title: 'Mes collaborations' }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
