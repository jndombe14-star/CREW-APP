import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { AvailabilityDot } from '@/components/AvailabilityDot';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TomTomMap, type MapMarker } from '@/components/TomTomMap';
import { useNearbyCreators, useNearbyProfessionals } from '@/features/explore/useNearby';
import { getCurrentDeviceLocation, toGeographyPoint } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import type { CreatorProfileWithJoins, ProfessionalProfileWithJoins } from '@/lib/database.types';

type Coords = { latitude: number; longitude: number };
type Segment = 'pro' | 'collab';
type NearbyItem = (ProfessionalProfileWithJoins | CreatorProfileWithJoins) & {
  distanceKm?: number | null;
  headline?: string;
  latitude?: number | null;
  longitude?: number | null;
  hasUpcomingBooking?: boolean;
};

// Real live map (TomTom, via WebView on native / iframe on web) plus the existing
// distance-sorted list below it. Own position tracks live via watchPositionAsync while
// this screen is open; nearby pins refresh on an interval so they reflect DB changes
// without a manual reload — a plain polling refresh, not a push-based realtime claim.
export default function Map() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [segment, setSegment] = useState<Segment>('pro');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const nearbyProfessionals = useNearbyProfessionals(coords, 200);
  const nearbyCreators = useNearbyCreators(coords, 200);

  useEffect(() => {
    getCurrentDeviceLocation()
      .then((location) => setCoords({ latitude: location.latitude, longitude: location.longitude }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Impossible de récupérer ta position.'))
      .finally(() => setLoading(false));
  }, []);

  // Keep the "you are here" pin live while the screen is open.
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 25 },
      (position) => setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude })
    )
      .then((sub) => {
        subscription = sub;
      })
      .catch(() => {
        // Permission already handled by the initial getCurrentDeviceLocation() call above.
      });
    return () => subscription?.remove();
  }, []);

  // Refresh nearby pins periodically so the map reflects recent DB changes.
  useEffect(() => {
    const id = setInterval(() => {
      nearbyProfessionals.refetch();
      nearbyCreators.refetch();
    }, 20000);
    return () => clearInterval(id);
  }, [nearbyProfessionals, nearbyCreators]);

  async function shareMyLocation() {
    if (!session?.user.id) return;
    setSharing(true);
    try {
      const location = await getCurrentDeviceLocation();
      setCoords({ latitude: location.latitude, longitude: location.longitude });
      await supabase
        .from('profiles')
        .update({ location: toGeographyPoint(location.latitude, location.longitude) })
        .eq('id', session.user.id);
    } catch {
      // Silent: the button is a best-effort "make me visible now" nudge, initial
      // permission errors are already surfaced by the screen's main error state.
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  if (error || !coords) {
    return (
      <Screen>
        <EmptyState
          icon="📍"
          title="Position nécessaire"
          description={error ?? 'Active ta localisation pour voir qui est autour de toi.'}
        />
      </Screen>
    );
  }

  const isLoading = segment === 'pro' ? nearbyProfessionals.isLoading : nearbyCreators.isLoading;
  const data: NearbyItem[] | undefined = segment === 'pro' ? nearbyProfessionals.data : nearbyCreators.data;
  // Pin color reflects live availability (green = disponible, orange = indisponible), not
  // PRO/COLLAB category — that's what actually matters when deciding who to contact for a
  // shoot right now. A yellow ring means they already have an upcoming confirmed booking.
  const markers: MapMarker[] = (data ?? [])
    .filter((item) => item.latitude != null && item.longitude != null)
    .map((item) => ({
      id: item.profile_id,
      latitude: item.latitude as number,
      longitude: item.longitude as number,
      color: item.is_available ? '#2A9D6F' : '#E8963B',
      ringColor: item.hasUpcomingBooking ? '#FFC629' : undefined,
      label: item.profiles?.full_name ?? '',
    }));

  return (
    <Screen>
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        <Text style={[typography.title, { color: colors.text }]}>Autour de toi</Text>

        <TomTomMap
          latitude={coords.latitude}
          longitude={coords.longitude}
          markers={markers}
          onMarkerPress={(id) => router.push(segment === 'pro' ? `/pro/${id}` : `/collab/${id}`)}
        />

        <Pressable onPress={shareMyLocation} disabled={sharing}>
          <Text style={[typography.caption, { color: colors.primary, textAlign: 'right' }]}>
            {sharing ? 'Mise à jour…' : '📍 Mettre à jour ma position'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={() => setSegment('pro')}>
            <Badge label="💼 Professionnels" tone={segment === 'pro' ? 'pro' : 'neutral'} />
          </Pressable>
          <Pressable onPress={() => setSegment('collab')}>
            <Badge label="🤝 Créateurs" tone={segment === 'collab' ? 'collab' : 'neutral'} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="📍"
              title="Personne à proximité pour l'instant"
              description="Sois parmi les premiers à activer ta position dans ton profil pour apparaître ici."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push(segment === 'pro' ? `/pro/${item.profile_id}` : `/collab/${item.profile_id}`)
              }
            >
              <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <View>
                  <Avatar name={item.profiles?.full_name ?? '?'} uri={item.profiles?.avatar_url} />
                  <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
                    <AvailabilityDot isAvailable={item.is_available} hasUpcomingBooking={item.hasUpcomingBooking} />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{item.profiles?.full_name}</Text>
                  {segment === 'pro' && 'headline' in item ? (
                    <Text style={[typography.body, { color: colors.textMuted }]}>{item.headline}</Text>
                  ) : null}
                  {item.distanceKm != null ? (
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      📍 {item.distanceKm.toFixed(1)} km
                    </Text>
                  ) : null}
                </View>
                <Badge label={segment === 'pro' ? 'PRO' : 'COLLAB'} tone={segment === 'pro' ? 'pro' : 'collab'} />
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
