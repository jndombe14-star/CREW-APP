import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function FavoritesLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mes favoris' }} />
    </Stack>
  );
}
