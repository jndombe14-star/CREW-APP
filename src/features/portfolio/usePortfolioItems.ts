import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { pickAndUploadPortfolioMedia } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';
import type { PortfolioItem } from '@/lib/database.types';

export function usePortfolioItems(professionalProfileId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-items', professionalProfileId],
    enabled: !!professionalProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('professional_profile_id', professionalProfileId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PortfolioItem[];
    },
  });
}

export function useAddPortfolioItem(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const ownerId = useAuthStore.getState().session?.user.id;
      if (!ownerId) throw new Error('Not authenticated');

      const picked = await pickAndUploadPortfolioMedia(ownerId);
      if (!picked) return null;

      const { error } = await supabase.from('portfolio_items').insert({
        professional_profile_id: professionalProfileId,
        media_url: picked.url,
        media_type: picked.mediaType,
      });
      if (error) throw error;
      return picked.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', professionalProfileId] });
    },
  });
}

export function useDeletePortfolioItem(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', professionalProfileId] });
    },
  });
}
