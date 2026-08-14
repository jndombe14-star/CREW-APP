import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useNearbyCreators, useNearbyProfessionals } from '@/features/explore/useNearby';
import { getCurrentDeviceLocation } from '@/lib/location';
import { useTheme } from '@/theme/useTheme';
import type { CreatorProfileWithJoins, ProfessionalProfileWithJoins } from '@/lib/database.types';

type Coords = { latitude: number; longitude: number };
type Segment = 'pro' | 'collab';
type NearbyItem = (ProfessionalProfileWithJoins | CreatorProfileWithJoins) & {
  distanceKm?: number | null;
  headline?: string;
};

// A pin-based map view (react-native-maps) was tried here but doesn't render reliably
// in standard Expo Go for this SDK — it needs a custom EAS dev client to verify properly.
// Rather than ship a broken map, this is a real, working "near me" view using the exact
// same PostGIS proximity data, sorted by distance instead of plotted on pins.
export default function Map() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('pro');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const nearbyProfessionals = useNearbyProfessionals(coords, 200);
  const nearbyCreators = useNearbyCreators(coords, 200);

  useEffect(() => {
    getCurrentDeviceLocation()
      .then((location) => setCoords({ latitude: location.latitude, longitude: location.longitude }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Impossible de récupérer ta position.'))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <Screen>
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        <Text style={[typography.title, { color: colors.text }]}>Autour de toi</Text>
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
                <Avatar name={item.profiles?.full_name ?? '?'} uri={item.profiles?.avatar_url} />
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
