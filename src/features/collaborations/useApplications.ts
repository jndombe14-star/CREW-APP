import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { ApplicationStatus, ApplicationWithJoins } from '@/lib/database.types';

export function useApplicationsForCollaboration(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['applications', collaborationId],
    enabled: !!collaborationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*, profiles(*)')
        .eq('collaboration_id', collaborationId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ApplicationWithJoins[];
    },
  });
}

export function useMyApplications() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['my-applications', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*, collaborations(*)')
        .eq('applicant_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ApplicationWithJoins[];
    },
  });
}

export function useApplyToCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collaborationId, message }: { collaborationId: string; message: string | null }) => {
      const applicantId = useAuthStore.getState().session?.user.id;
      if (!applicantId) throw new Error('Not authenticated');

      const { error } = await supabase.from('applications').insert({
        collaboration_id: collaborationId,
        applicant_id: applicantId,
        message,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', variables.collaborationId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      collaborationId,
      status,
    }: {
      applicationId: string;
      collaborationId: string;
      status: ApplicationStatus;
    }) => {
      const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId);
      if (error) throw error;

      if (status === 'accepted') {
        await supabase.from('collaborations').update({ status: 'matched' }).eq('id', collaborationId);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', variables.collaborationId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['collaboration-detail', variables.collaborationId] });
      queryClient.invalidateQueries({ queryKey: ['open-collaborations'] });
    },
  });
}
