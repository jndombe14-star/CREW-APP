import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useNearbyCreators, useNearbyProfessionals } from '@/features/explore/useNearby';
import { getCurrentDeviceLocation } from '@/lib/location';
import { useTheme } from '@/theme/useTheme';

type Coords = { latitude: number; longitude: number };

export default function Map() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const nearbyProfessionals = useNearbyProfessionals(coords, 100);
  const nearbyCreators = useNearbyCreators(coords, 100);

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
          description={error ?? 'Active ta localisation pour voir la carte.'}
        />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        showsUserLocation
      >
        {nearbyProfessionals.data
          ?.filter((item) => item.latitude != null && item.longitude != null)
          .map((item) => (
            <Marker
              key={`pro-${item.id}`}
              coordinate={{ latitude: item.latitude!, longitude: item.longitude! }}
              pinColor={colors.pro}
              title={item.profiles?.full_name}
              description={item.headline}
              onCalloutPress={() => router.push(`/pro/${item.profile_id}`)}
            />
          ))}
        {nearbyCreators.data
          ?.filter((item) => item.latitude != null && item.longitude != null)
          .map((item) => (
            <Marker
              key={`collab-${item.id}`}
              coordinate={{ latitude: item.latitude!, longitude: item.longitude! }}
              pinColor={colors.collab}
              title={item.profiles?.full_name}
              description="Créateur"
              onCalloutPress={() => router.push(`/collab/${item.profile_id}`)}
            />
          ))}
      </MapView>

      <View
        style={{
          position: 'absolute',
          bottom: spacing.xl,
          left: spacing.lg,
          right: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.xs,
        }}
      >
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {(nearbyProfessionals.data?.length ?? 0)} pro{(nearbyProfessionals.data?.length ?? 0) === 1 ? '' : 's'} ·{' '}
          {(nearbyCreators.data?.length ?? 0)} créateur{(nearbyCreators.data?.length ?? 0) === 1 ? '' : 's'} à moins de 100 km
        </Text>
        <Button label="Voir en liste" variant="ghost" onPress={() => router.push('/explore')} />
      </View>
    </View>
  );
}
