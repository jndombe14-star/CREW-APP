import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CreatorProfileWithJoins } from '@/lib/database.types';

export function useCollabProfileDetail(profileId: string | undefined) {
  return useQuery({
    queryKey: ['collab-profile-detail', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*, profiles(*)')
        .eq('profile_id', profileId as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CreatorProfileWithJoins | null;
    },
  });
}
