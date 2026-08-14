import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useReportUser() {
  return useMutation({
    mutationFn: async ({
      reportedProfileId,
      reason,
      details,
    }: {
      reportedProfileId: string;
      reason: string;
      details: string | null;
    }) => {
      const reporterId = useAuthStore.getState().session?.user.id;
      if (!reporterId) throw new Error('Not authenticated');
      const { error } = await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_profile_id: reportedProfileId,
        reason,
        details,
      });
      if (error) throw error;
    },
  });
}
