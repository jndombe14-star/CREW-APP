import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useMyFavorites } from '@/features/favorites/useFavorites';
import { useTheme } from '@/theme/useTheme';

export default function FavoritesScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: favorites, isLoading } = useMyFavorites();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {(favorites ?? []).length === 0 ? (
        <EmptyState icon="🤍" title="Aucun favori" description="Enregistre des profils ou des projets depuis Explorer." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {favorites!.map((favorite) => (
            <Pressable
              key={favorite.id}
              onPress={() => {
                if (favorite.profiles) {
                  router.push(
                    favorite.profiles.is_pro_mode ? `/pro/${favorite.profiles.id}` : `/collab/${favorite.profiles.id}`
                  );
                } else if (favorite.collaborations) {
                  router.push(`/collaborations/${favorite.collaborations.id}`);
                }
              }}
            >
              <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                {favorite.profiles ? (
                  <>
                    <Avatar name={favorite.profiles.full_name} uri={favorite.profiles.avatar_url} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.subtitle, { color: colors.text }]}>{favorite.profiles.full_name}</Text>
                      <Text style={[typography.caption, { color: colors.textMuted }]}>@{favorite.profiles.username}</Text>
                    </View>
                    <Badge label={favorite.profiles.is_pro_mode ? 'PRO' : 'COLLAB'} tone={favorite.profiles.is_pro_mode ? 'pro' : 'collab'} />
                  </>
                ) : favorite.collaborations ? (
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.subtitle, { color: colors.text }]}>{favorite.collaborations.title}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Projet collaboratif</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
