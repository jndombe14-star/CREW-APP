import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { syncPushToken } from '@/lib/notifications';
import { initAuthListener, useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

// Declarative route protection (Stack.Protected) instead of imperative <Redirect> calls
// in this gate: an earlier version returned <Redirect> from here based on the current
// pathname, which raced against app/index.tsx's own <Redirect> for the "/" route and
// produced an unrecoverable "Maximum update depth exceeded" crash on every screen. With
// guards, every screen is always declared and Expo Router itself decides what's reachable
// — session/profile changes just flip which branch is active, no redirect race possible.
function AppNavigator() {
  const { session, profile, isInitializing } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      syncPushToken(session.user.id);
    }
  }, [session?.user.id]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hasProfile = !!(profile?.is_pro_mode || profile?.is_collab_mode);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && hasProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pro/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="collab/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="bookings/index" options={{ headerShown: true, title: 'Mes réservations' }} />
        <Stack.Screen name="collaborations/create" options={{ headerShown: true, title: 'Nouvelle collaboration' }} />
        <Stack.Screen name="collaborations/mine" options={{ headerShown: true, title: 'Mes collaborations' }} />
        <Stack.Screen name="collaborations/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="favorites/index" options={{ headerShown: true, title: 'Mes favoris' }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="admin/index" options={{ headerShown: true, title: 'Admin' }} />
        <Stack.Screen name="profile-edit/personal" options={{ headerShown: true, title: 'Infos personnelles' }} />
        <Stack.Screen name="profile-edit/pro" options={{ headerShown: true, title: 'Profil professionnel' }} />
        <Stack.Screen name="profile-edit/collab" options={{ headerShown: true, title: 'Profil collab' }} />
        <Stack.Screen name="profile-edit/availability" options={{ headerShown: true, title: 'Disponibilités' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
