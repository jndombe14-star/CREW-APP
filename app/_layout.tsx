import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Slot, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { syncPushToken } from '@/lib/notifications';
import { initAuthListener, useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

function AuthGate() {
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
    return <Redirect href="/home" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthGate />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
