import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Report } from '@/lib/database.types';

export function useAllReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(full_name, username), reported:profiles!reports_reported_profile_id_fkey(full_name, username)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as (Report & {
        reporter: { full_name: string; username: string } | null;
        reported: { full_name: string; username: string } | null;
      })[];
    },
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, proProfiles, creatorProfiles, bookings, collaborations, reports] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('professional_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('creator_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('collaborations').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
      ]);
      return {
        profiles: profiles.count ?? 0,
        proProfiles: proProfiles.count ?? 0,
        creatorProfiles: creatorProfiles.count ?? 0,
        bookings: bookings.count ?? 0,
        collaborations: collaborations.count ?? 0,
        reports: reports.count ?? 0,
      };
    },
  });
}
