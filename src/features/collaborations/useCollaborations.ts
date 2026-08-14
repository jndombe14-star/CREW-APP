import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CollaborationWithJoins } from '@/lib/database.types';

export function useOpenCollaborations() {
  return useQuery({
    queryKey: ['open-collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*, profiles(*), categories(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CollaborationWithJoins[];
    },
  });
}

export function useCollaborationDetail(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['collaboration-detail', collaborationId],
    enabled: !!collaborationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*, profiles(*), categories(*)')
        .eq('id', collaborationId as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CollaborationWithJoins | null;
    },
  });
}

export function useMyCollaborations() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['my-collaborations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*, profiles(*), categories(*)')
        .eq('creator_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CollaborationWithJoins[];
    },
  });
}
