import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CreatorProfileWithJoins, ProfessionalProfileWithJoins } from '@/lib/database.types';

type Coords = { latitude: number; longitude: number } | null;
type GeoRow = { distance_km: number; latitude: number; longitude: number; has_upcoming_booking: boolean };

export function useNearbyProfessionals(coords: Coords, radiusKm = 50, categoryId?: string | null) {
  return useQuery({
    queryKey: ['nearby-professionals', coords?.latitude, coords?.longitude, radiusKm, categoryId],
    enabled: !!coords,
    queryFn: async () => {
      const { data: nearby, error: rpcError } = await supabase.rpc('nearby_professionals', {
        origin_lat: coords!.latitude,
        origin_lng: coords!.longitude,
        radius_km: radiusKm,
      });
      if (rpcError) throw rpcError;
      const rows = (nearby ?? []) as ({ professional_profile_id: string } & GeoRow)[];
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.professional_profile_id);
      let detailsQuery = supabase.from('professional_profiles').select('*, profiles(*), services(*)').in('id', ids);
      if (categoryId) detailsQuery = detailsQuery.eq('primary_category_id', categoryId);
      const { data: details, error: detailsError } = await detailsQuery;
      if (detailsError) throw detailsError;

      const rowById = new Map(rows.map((r) => [r.professional_profile_id, r]));
      const detailsList = (details ?? []) as unknown as ProfessionalProfileWithJoins[];
      return detailsList
        .map((item) => {
          const row = rowById.get(item.id);
          return {
            ...item,
            distanceKm: row?.distance_km ?? null,
            latitude: row?.latitude ?? null,
            longitude: row?.longitude ?? null,
            hasUpcomingBooking: row?.has_upcoming_booking ?? false,
          };
        })
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    },
  });
}

export function useNearbyCreators(coords: Coords, radiusKm = 50, categorySlug?: string | null) {
  return useQuery({
    queryKey: ['nearby-creators', coords?.latitude, coords?.longitude, radiusKm, categorySlug],
    enabled: !!coords,
    queryFn: async () => {
      const { data: nearby, error: rpcError } = await supabase.rpc('nearby_creators', {
        origin_lat: coords!.latitude,
        origin_lng: coords!.longitude,
        radius_km: radiusKm,
      });
      if (rpcError) throw rpcError;
      const rows = (nearby ?? []) as ({ creator_profile_id: string } & GeoRow)[];
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.creator_profile_id);
      let detailsQuery = supabase.from('creator_profiles').select('*, profiles(*)').in('id', ids);
      if (categorySlug) detailsQuery = detailsQuery.contains('interests', [categorySlug]);
      const { data: details, error: detailsError } = await detailsQuery;
      if (detailsError) throw detailsError;

      const rowById = new Map(rows.map((r) => [r.creator_profile_id, r]));
      const detailsList = (details ?? []) as unknown as CreatorProfileWithJoins[];
      return detailsList
        .map((item) => {
          const row = rowById.get(item.id);
          return {
            ...item,
            distanceKm: row?.distance_km ?? null,
            latitude: row?.latitude ?? null,
            longitude: row?.longitude ?? null,
            hasUpcomingBooking: row?.has_upcoming_booking ?? false,
          };
        })
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    },
  });
}
