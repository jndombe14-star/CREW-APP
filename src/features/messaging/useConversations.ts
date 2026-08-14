import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export type ConversationPreview = {
  conversation_id: string;
  other_profile_id: string;
  other_full_name: string;
  other_username: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
};

export function useConversations() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['conversations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_conversations');
      if (error) throw error;
      return (data ?? []) as ConversationPreview[];
    },
    refetchInterval: 10_000,
  });
}
