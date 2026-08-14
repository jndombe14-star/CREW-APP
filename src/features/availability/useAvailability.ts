import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AvailabilityBlock, WeeklyAvailability } from '@/lib/database.types';

export function useWeeklyAvailability(professionalProfileId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-availability', professionalProfileId],
    enabled: !!professionalProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_availability')
        .select('*')
        .eq('professional_profile_id', professionalProfileId as string)
        .order('day_of_week');
      if (error) throw error;
      return (data ?? []) as WeeklyAvailability[];
    },
  });
}

export function useAvailabilityBlocks(professionalProfileId: string | undefined) {
  return useQuery({
    queryKey: ['availability-blocks', professionalProfileId],
    enabled: !!professionalProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_profile_id', professionalProfileId as string)
        .gte('blocked_date', new Date().toISOString().slice(0, 10))
        .order('blocked_date');
      if (error) throw error;
      return (data ?? []) as AvailabilityBlock[];
    },
  });
}

export function useSetWeeklyAvailability(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayOfWeek, startTime, endTime }: { dayOfWeek: number; startTime: string; endTime: string }) => {
      const { error } = await supabase
        .from('weekly_availability')
        .upsert(
          { professional_profile_id: professionalProfileId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime },
          { onConflict: 'professional_profile_id,day_of_week' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-availability', professionalProfileId] });
    },
  });
}

export function useRemoveWeeklyAvailability(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_availability').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-availability', professionalProfileId] });
    },
  });
}

export function useAddAvailabilityBlock(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason: string | null }) => {
      const { error } = await supabase
        .from('availability_blocks')
        .insert({ professional_profile_id: professionalProfileId, blocked_date: date, reason });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', professionalProfileId] });
    },
  });
}

export function useRemoveAvailabilityBlock(professionalProfileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('availability_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', professionalProfileId] });
    },
  });
}
