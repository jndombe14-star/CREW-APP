import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/database.types';

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  const query = useQuery({
    queryKey,
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData<Message[]>(queryKey, (current) => {
            const next = current ?? [];
            if (next.some((m) => m.id === (payload.new as Message).id)) return next;
            return [...next, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return query;
}
