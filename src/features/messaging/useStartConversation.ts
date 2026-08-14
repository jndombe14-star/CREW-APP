import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherProfileId: string) => {
      const { data, error } = await supabase.rpc('start_conversation', { other_profile_id: otherProfileId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
