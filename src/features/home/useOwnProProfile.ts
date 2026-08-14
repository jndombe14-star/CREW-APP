import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { ProfessionalProfile, Service } from '@/lib/database.types';

export function useOwnProProfile() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['own-pro-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: proProfile, error } = await supabase
        .from('professional_profiles')
        .select('*, services(*)')
        .eq('profile_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return proProfile as unknown as (ProfessionalProfile & { services: Service[] }) | null;
    },
  });
}
