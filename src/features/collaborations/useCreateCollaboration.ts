import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { CollaborationType } from '@/lib/database.types';

type CreateCollaborationInput = {
  title: string;
  description: string | null;
  categoryId: string | null;
  collaborationType: CollaborationType;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  budgetAmount: number | null;
};

export function useCreateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCollaborationInput) => {
      const creatorId = useAuthStore.getState().session?.user.id;
      if (!creatorId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('collaborations')
        .insert({
          creator_id: creatorId,
          title: input.title,
          description: input.description,
          category_id: input.categoryId,
          collaboration_type: input.collaborationType,
          location: input.location,
          latitude: input.latitude,
          longitude: input.longitude,
          scheduled_date: input.scheduledDate,
          scheduled_time: input.scheduledTime,
          budget_amount: input.budgetAmount,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['my-collaborations'] });
    },
  });
}
