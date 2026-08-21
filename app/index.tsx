import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

// The Stack.Protected guards in app/_layout.tsx decide which screens are reachable, but
// something still has to own the bare "/" route itself. This is the only place that
// redirects "/" anywhere — the root layout no longer does, so there's nothing left for
// this to race against.
export default function Index() {
  const { session, profile, isInitializing } = useAuthStore();

  if (isInitializing) return null;
  if (!session) return <Redirect href="/welcome" />;
  if (!profile?.is_pro_mode && !profile?.is_collab_mode) return <Redirect href="/onboarding" />;
  return <Redirect href="/map" />;
}
