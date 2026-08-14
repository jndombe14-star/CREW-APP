import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BookingStatus, BookingWithJoins } from '@/lib/database.types';

export function useBookingsAsClient() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['bookings-as-client', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, services(*), professional_profiles(*, profiles(*))')
        .eq('client_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BookingWithJoins[];
    },
  });
}

export function useBookingsAsProfessional(professionalProfileId: string | undefined) {
  return useQuery({
    queryKey: ['bookings-as-professional', professionalProfileId],
    enabled: !!professionalProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, services(*), profiles(*)')
        .eq('professional_profile_id', professionalProfileId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BookingWithJoins[];
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-as-professional'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-as-client'] });
    },
  });
}
