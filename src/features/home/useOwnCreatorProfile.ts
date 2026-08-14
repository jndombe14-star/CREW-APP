import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CreatorProfile } from '@/lib/database.types';

export function useOwnCreatorProfile() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['own-creator-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('profile_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CreatorProfile | null;
    },
  });
}
