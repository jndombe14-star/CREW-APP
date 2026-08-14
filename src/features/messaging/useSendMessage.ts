import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Message } from '@/lib/database.types';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  return useMutation({
    mutationFn: async (content: string) => {
      const senderId = useAuthStore.getState().session?.user.id;
      if (!senderId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(queryKey, (current) => {
        const next = current ?? [];
        if (next.some((m) => m.id === message.id)) return next;
        return [...next, message];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
