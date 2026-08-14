import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useOpenCollaborations } from '@/features/collaborations/useCollaborations';
import { useAllRatings } from '@/features/explore/useAllRatings';
import { useCreators } from '@/features/explore/useCreators';
import { useNearbyCreators, useNearbyProfessionals } from '@/features/explore/useNearby';
import { useProfessionals } from '@/features/explore/useProfessionals';
import { useCategories } from '@/features/onboarding/useCategories';
import { getCurrentDeviceLocation } from '@/lib/location';
import { useTheme } from '@/theme/useTheme';
import type { CreatorProfileWithJoins, ProfessionalProfileWithJoins, ProfileRating } from '@/lib/database.types';

type Segment = 'pro' | 'collab';
type CollabView = 'people' | 'projects';
type SortMode = 'recent' | 'relevance';
type Coords = { latitude: number; longitude: number } | null;
type ProItem = ProfessionalProfileWithJoins & { distanceKm?: number | null };
type CollabItem = CreatorProfileWithJoins & { distanceKm?: number | null };

// Spec §20's weighted-score idea, scaled down to the real signals we actually have
// (no captured search intent yet, so no skills/budget terms to weigh — see README).
function proRelevanceScore(item: ProItem, rating: ProfileRating | undefined, nearbyMode: boolean): number {
  const ratingScore = rating ? (rating.avg_rating / 5) * 0.4 : 0.15;
  const servicesScore = item.services.length > 0 ? 0.2 : 0;
  const distanceScore = nearbyMode && item.distanceKm != null ? Math.max(0, 1 - item.distanceKm / 50) * 0.3 : 0.15;
  const reviewVolumeScore = rating ? Math.min(rating.review_count / 10, 1) * 0.1 : 0;
  return ratingScore + servicesScore + distanceScore + reviewVolumeScore;
}

const TYPE_ICONS: Record<string, string> = {
  collaboration: '🤝',
  exchange: '🔄',
  free: '🆓',
  paid: '💰',
  group: '👥',
};

export default function Explore() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('pro');
  const [collabView, setCollabView] = useState<CollabView>('people');
  const [nearbyMode, setNearbyMode] = useState(false);
  const [coords, setCoords] = useState<Coords>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const { data: proCategories } = useCategories('pro-or-both');
  const { data: collabCategories } = useCategories('collab-or-both');
  const { data: ratings } = useAllRatings();
  const professionals = useProfessionals(categoryId);
  const creators = useCreators(categorySlug);
  const openCollaborations = useOpenCollaborations();
  const nearbyProfessionals = useNearbyProfessionals(coords, 50, categoryId);
  const nearbyCreators = useNearbyCreators(coords, 50, categorySlug);

  const onToggleNearby = async () => {
    if (nearbyMode) {
      setNearbyMode(false);
      return;
    }
    setLocationError(null);
    setLocating(true);
    try {
      const location = await getCurrentDeviceLocation();
      setCoords({ latitude: location.latitude, longitude: location.longitude });
      setNearbyMode(true);
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : 'Impossible de récupérer ta position.');
    } finally {
      setLocating(false);
    }
  };

  const proDataRaw: ProItem[] | undefined = nearbyMode ? nearbyProfessionals.data : professionals.data;
  const proData =
    sortMode === 'relevance' && proDataRaw
      ? [...proDataRaw].sort(
          (a, b) =>
            proRelevanceScore(b, ratings?.get(b.profile_id), nearbyMode) -
            proRelevanceScore(a, ratings?.get(a.profile_id), nearbyMode)
        )
      : proDataRaw;
  const collabData: CollabItem[] | undefined = nearbyMode ? nearbyCreators.data : creators.data;
  const isLoading =
    segment === 'pro'
      ? nearbyMode
        ? nearbyProfessionals.isLoading
        : professionals.isLoading
      : collabView === 'projects'
        ? openCollaborations.isLoading
        : nearbyMode
          ? nearbyCreators.isLoading
          : creators.isLoading;

  return (
    <Screen>
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        <Text style={[typography.title, { color: colors.text }]}>Explorer</Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['pro', 'collab'] as Segment[]).map((s) => (
            <Pressable key={s} onPress={() => setSegment(s)} style={{ flex: 1 }}>
              <View
                style={{
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  backgroundColor: segment === s ? colors.primary : colors.surfaceAlt,
                }}
              >
                <Text
                  style={[
                    typography.label,
                    { color: segment === s ? colors.primaryText : colors.textMuted },
                  ]}
                >
                  {s === 'pro' ? '💼 Professionnels' : '🤝 Collaborations'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {segment === 'pro' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable onPress={() => setSortMode('recent')}>
              <Badge label="🕒 Récents" tone={sortMode === 'recent' ? 'pro' : 'neutral'} />
            </Pressable>
            <Pressable onPress={() => setSortMode('relevance')}>
              <Badge label="✨ Pertinence" tone={sortMode === 'relevance' ? 'pro' : 'neutral'} />
            </Pressable>
          </View>
        ) : null}

        {segment === 'pro' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable onPress={() => setCategoryId(null)}>
                <Badge label="Tous" tone={categoryId === null ? 'pro' : 'neutral'} />
              </Pressable>
              {proCategories?.map((category) => (
                <Pressable key={category.id} onPress={() => setCategoryId(category.id)}>
                  <Badge
                    label={`${category.icon} ${category.label}`}
                    tone={categoryId === category.id ? 'pro' : 'neutral'}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {segment === 'collab' && collabView === 'people' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable onPress={() => setCategorySlug(null)}>
                <Badge label="Tous" tone={categorySlug === null ? 'collab' : 'neutral'} />
              </Pressable>
              {collabCategories?.map((category) => (
                <Pressable key={category.id} onPress={() => setCategorySlug(category.slug)}>
                  <Badge
                    label={`${category.icon} ${category.label}`}
                    tone={categorySlug === category.slug ? 'collab' : 'neutral'}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {segment === 'collab' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Pressable onPress={() => setCollabView('people')}>
              <Badge label="👤 Créateurs" tone={collabView === 'people' ? 'collab' : 'neutral'} />
            </Pressable>
            <Pressable onPress={() => setCollabView('projects')}>
              <Badge label="📋 Projets" tone={collabView === 'projects' ? 'collab' : 'neutral'} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => router.push('/collaborations/create')}>
              <Badge label="+ Publier" tone="collab" />
            </Pressable>
          </View>
        ) : null}

        {!(segment === 'collab' && collabView === 'projects') ? (
          <Pressable onPress={onToggleNearby}>
            <Badge label={locating ? 'Localisation…' : nearbyMode ? '📍 Près de moi ✓' : '📍 Près de moi'} tone={nearbyMode ? 'pro' : 'neutral'} />
          </Pressable>
        ) : null}
        {locationError ? (
          <Text style={[typography.caption, { color: colors.danger }]}>{locationError}</Text>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : segment === 'pro' ? (
        <FlatList
          data={proData ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="💼"
              title={nearbyMode ? 'Aucun professionnel à proximité' : "Aucun professionnel pour l'instant"}
              description={
                nearbyMode
                  ? "Personne n'a encore renseigné sa position dans cette zone."
                  : 'Les premiers profils PRO apparaîtront ici dès qu\'ils seront créés.'
              }
            />
          }
          renderItem={({ item }) => {
            const rating = ratings?.get(item.profile_id);
            return (
              <Pressable onPress={() => router.push(`/pro/${item.profile_id}`)}>
                <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                  <Avatar name={item.profiles?.full_name ?? '?'} uri={item.profiles?.avatar_url} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.subtitle, { color: colors.text }]}>{item.profiles?.full_name}</Text>
                    <Text style={[typography.body, { color: colors.textMuted }]}>{item.headline}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {item.services.length} service{item.services.length === 1 ? '' : 's'}
                      {rating ? ` · ⭐ ${rating.avg_rating}` : ''}
                      {item.distanceKm != null ? ` · ${item.distanceKm.toFixed(1)} km` : ''}
                    </Text>
                  </View>
                  <Badge label="PRO" tone="pro" />
                </Card>
              </Pressable>
            );
          }}
        />
      ) : collabView === 'projects' ? (
        <FlatList
          data={openCollaborations.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="Aucun projet pour l'instant"
              description="Sois le premier à publier une collaboration !"
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/collaborations/${item.id}`)}>
              <Card style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={{ fontSize: 18 }}>{TYPE_ICONS[item.collaboration_type]}</Text>
                </View>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {item.profiles?.full_name}
                  {item.location ? ` · 📍 ${item.location}` : ''}
                  {item.scheduled_date ? ` · 📅 ${item.scheduled_date}` : ''}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={collabData ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="🤝"
              title={nearbyMode ? 'Aucune collaboration à proximité' : 'Aucune collaboration pour l\'instant'}
              description={
                nearbyMode
                  ? "Personne n'a encore renseigné sa position dans cette zone."
                  : 'Les créateurs qui rejoignent CREW apparaîtront ici.'
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/collab/${item.profile_id}`)}>
              <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Avatar name={item.profiles?.full_name ?? '?'} uri={item.profiles?.avatar_url} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{item.profiles?.full_name}</Text>
                  {item.distanceKm != null ? (
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {item.distanceKm.toFixed(1)} km
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {item.interests.slice(0, 3).map((interest) => (
                      <Badge key={interest} label={interest} tone="collab" />
                    ))}
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
