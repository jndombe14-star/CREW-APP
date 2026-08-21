import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { PortfolioThumbnail } from '@/components/PortfolioThumbnail';
import { Screen } from '@/components/Screen';
import { useFeed } from '@/features/feed/useFeed';
import { useTheme } from '@/theme/useTheme';

export default function Feed() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data, isLoading } = useFeed();

  return (
    <Screen>
      <Text style={[typography.title, { color: colors.text, marginBottom: spacing.md }]}>Feed</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="🎬"
              title="Aucune réalisation pour l'instant"
              description="Les photos et vidéos ajoutées aux portfolios PRO apparaîtront ici."
            />
          }
          renderItem={({ item }) => {
            const profile = item.professional_profiles?.profiles;
            const profileId = item.professional_profiles?.profile_id;
            return (
              <Pressable onPress={() => profileId && router.push(`/pro/${profileId}`)}>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                    <Avatar name={profile?.full_name ?? '?'} uri={profile?.avatar_url} size={32} />
                    <Text style={[typography.subtitle, { color: colors.text }]}>{profile?.full_name}</Text>
                  </View>
                  <PortfolioThumbnail item={item} size={360} />
                  {item.title ? (
                    <Text style={[typography.body, { color: colors.textMuted }]}>{item.title}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
