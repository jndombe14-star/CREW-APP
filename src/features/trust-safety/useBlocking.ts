import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useIsBlocked(otherProfileId: string | undefined) {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['is-blocked', userId, otherProfileId],
    enabled: !!userId && !!otherProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', userId as string)
        .eq('blocked_id', otherProfileId as string)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const blockerId = useAuthStore.getState().session?.user.id;
      if (!blockerId) throw new Error('Not authenticated');
      const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-blocked'] });
      queryClient.invalidateQueries({ queryKey: ['open-collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['explore-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['explore-creators'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const blockerId = useAuthStore.getState().session?.user.id;
      if (!blockerId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-blocked'] });
    },
  });
}
