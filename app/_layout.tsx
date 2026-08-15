import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { syncPushToken } from '@/lib/notifications';
import { initAuthListener, useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

function AppNavigator() {
  const pathname = usePathname();
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

  const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/welcome' || pathname === '/login' || pathname === '/register';
  const inOnboardingGroup = pathname.startsWith('/onboarding');

  if (!session && !inAuthGroup) {
    return <Redirect href="/welcome" />;
  }

  if (session && !profile?.is_pro_mode && !profile?.is_collab_mode && !inOnboardingGroup && !inAuthGroup) {
    return <Redirect href="/onboarding" />;
  }

  if (session && (profile?.is_pro_mode || profile?.is_collab_mode) && (inAuthGroup || inOnboardingGroup)) {
    return <Redirect href="/map" />;
  }

  // A single root Stack so every screen shares one navigation history — screens reached
  // from the tab bar (pro/collab/chat/bookings/etc.) previously lived in their own
  // isolated per-folder Stacks with no shared parent, which is why the header back
  // button had nothing to return to. Flattening them here fixes that everywhere at once.
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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
