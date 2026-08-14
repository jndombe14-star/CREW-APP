import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRating } from '@/lib/database.types';

// Small table (one row per rated profile) — fetched once and joined client-side
// rather than N+1 queries per list item.
export function useAllRatings() {
  return useQuery({
    queryKey: ['all-profile-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_ratings').select('*');
      if (error) throw error;
      const byProfileId = new Map<string, ProfileRating>();
      for (const row of (data ?? []) as ProfileRating[]) byProfileId.set(row.profile_id, row);
      return byProfileId;
    },
    staleTime: 60_000,
  });
}
