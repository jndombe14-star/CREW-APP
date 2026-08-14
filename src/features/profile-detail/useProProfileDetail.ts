import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfessionalProfileWithJoins } from '@/lib/database.types';

export function useProProfileDetail(profileId: string | undefined) {
  return useQuery({
    queryKey: ['pro-profile-detail', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*, profiles(*), services(*)')
        .eq('profile_id', profileId as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProfessionalProfileWithJoins | null;
    },
  });
}
