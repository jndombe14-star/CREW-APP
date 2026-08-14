import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category, CategoryKind } from '@/lib/database.types';

export function useCategories(kind: CategoryKind | 'pro-or-both' | 'collab-or-both') {
  return useQuery({
    queryKey: ['categories', kind],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('label');
      if (error) throw error;
      const categories = (data ?? []) as unknown as Category[];
      if (kind === 'pro-or-both') return categories.filter((c) => c.kind === 'pro' || c.kind === 'both');
      if (kind === 'collab-or-both') return categories.filter((c) => c.kind === 'collab' || c.kind === 'both');
      return categories.filter((c) => c.kind === kind);
    },
  });
}
