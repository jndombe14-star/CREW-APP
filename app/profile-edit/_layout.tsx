import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function ProfileEditLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="personal" options={{ title: 'Infos personnelles' }} />
      <Stack.Screen name="pro" options={{ title: 'Profil professionnel' }} />
      <Stack.Screen name="collab" options={{ title: 'Profil collab' }} />
      <Stack.Screen name="availability" options={{ title: 'Disponibilités' }} />
    </Stack>
  );
}
