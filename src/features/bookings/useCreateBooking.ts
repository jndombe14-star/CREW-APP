import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type CreateBookingInput = {
  serviceId: string;
  professionalProfileId: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string | null; // HH:MM
  location: string | null;
  message: string | null;
};

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const clientId = useAuthStore.getState().session?.user.id;
      if (!clientId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          service_id: input.serviceId,
          professional_profile_id: input.professionalProfileId,
          client_id: clientId,
          requested_date: input.requestedDate,
          requested_time: input.requestedTime,
          location: input.location,
          message: input.message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-as-client'] });
    },
  });
}
