import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { ProfileRating, Review } from '@/lib/database.types';

export function useProfileRating(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-rating', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_ratings')
        .select('*')
        .eq('profile_id', profileId as string)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileRating | null;
    },
  });
}

export function useReviewsForProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewee_id', profileId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as (Review & { profiles: { full_name: string; avatar_url: string | null } })[];
    },
  });
}

export function useMyReviewedBookingIds() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['my-reviewed-bookings', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('booking_id')
        .eq('reviewer_id', userId as string)
        .not('booking_id', 'is', null);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.booking_id));
    },
  });
}

export function useMyReviewedCollaborationIds() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['my-reviewed-collaborations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('collaboration_id')
        .eq('reviewer_id', userId as string)
        .not('collaboration_id', 'is', null);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.collaboration_id));
    },
  });
}

export function useCreateCollaborationReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      collaborationId: string;
      revieweeId: string;
      rating: number;
      comment: string | null;
    }) => {
      const reviewerId = useAuthStore.getState().session?.user.id;
      if (!reviewerId) throw new Error('Not authenticated');

      const { error } = await supabase.from('reviews').insert({
        collaboration_id: input.collaborationId,
        reviewer_id: reviewerId,
        reviewee_id: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviewed-collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile-rating'] });
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { bookingId: string; revieweeId: string; rating: number; comment: string | null }) => {
      const reviewerId = useAuthStore.getState().session?.user.id;
      if (!reviewerId) throw new Error('Not authenticated');

      const { error } = await supabase.from('reviews').insert({
        booking_id: input.bookingId,
        reviewer_id: reviewerId,
        reviewee_id: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviewed-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile-rating'] });
    },
  });
}
