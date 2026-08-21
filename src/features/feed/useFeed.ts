import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PortfolioItemWithJoins } from '@/lib/database.types';

// v1 scope: portfolio_items only exists for PRO profiles today (see README) — creator
// portfolios aren't built yet, so the feed shows PRO work platform-wide for now.
export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*, professional_profiles(*, profiles(*))')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as PortfolioItemWithJoins[];
    },
  });
}
