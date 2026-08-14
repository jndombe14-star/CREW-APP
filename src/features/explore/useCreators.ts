import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CreatorProfileWithJoins } from '@/lib/database.types';

export function useCreators(categorySlug?: string | null) {
  return useQuery({
    queryKey: ['explore-creators', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('creator_profiles')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (categorySlug) query = query.contains('interests', [categorySlug]);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CreatorProfileWithJoins[];
    },
  });
}
