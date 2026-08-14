import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function ChatLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    />
  );
}
