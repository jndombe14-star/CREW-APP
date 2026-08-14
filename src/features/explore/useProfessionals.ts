import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfessionalProfileWithJoins } from '@/lib/database.types';

export function useProfessionals(categoryId?: string | null) {
  return useQuery({
    queryKey: ['explore-professionals', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('professional_profiles')
        .select('*, profiles(*), services(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (categoryId) query = query.eq('primary_category_id', categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProfessionalProfileWithJoins[];
    },
  });
}
