import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { AvailabilityDot } from '@/components/AvailabilityDot';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ReportBlockActions } from '@/components/ReportBlockActions';
import { Screen } from '@/components/Screen';
import { SocialLinks } from '@/components/SocialLinks';
import { useCollabProfileDetail } from '@/features/profile-detail/useCollabProfileDetail';
import { useStartConversation } from '@/features/messaging/useStartConversation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

export default function CollabProfileDetail() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: creatorProfile, isLoading } = useCollabProfileDetail(id);
  const startConversation = useStartConversation();
  const [error, setError] = useState<string | null>(null);
  const myId = useAuthStore((s) => s.session?.user.id);

  const onContact = async () => {
    if (!id) return;
    setError(null);
    try {
      const conversationId = await startConversation.mutateAsync(id);
      router.push(`/chat/${conversationId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de démarrer la conversation.');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  if (!creatorProfile) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.textMuted }]}>Profil introuvable.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <View>
          <Avatar name={creatorProfile.profiles?.full_name ?? '?'} uri={creatorProfile.profiles?.avatar_url} size={88} />
          <View style={{ position: 'absolute', bottom: 2, right: 2 }}>
            <AvailabilityDot isAvailable={creatorProfile.is_available} size={16} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Text style={[typography.title, { color: colors.text }]}>{creatorProfile.profiles?.full_name}</Text>
          {myId !== creatorProfile.profile_id ? <FavoriteButton profileId={creatorProfile.profile_id} /> : null}
        </View>
        <Text style={[typography.body, { color: colors.textMuted }]}>@{creatorProfile.profiles?.username}</Text>
        {creatorProfile.profiles?.city ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>📍 {creatorProfile.profiles.city}</Text>
        ) : null}
        <SocialLinks
          instagramHandle={creatorProfile.profiles?.instagram_handle}
          tiktokHandle={creatorProfile.profiles?.tiktok_handle}
        />
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Badge label="COLLAB" tone="collab" />
          <Badge label={creatorProfile.is_available ? '🟢 Disponible' : '🟠 Indisponible'} tone="neutral" />
        </View>
      </View>

      {creatorProfile.profiles?.bio ? (
        <Card>
          <Text style={[typography.body, { color: colors.textMuted }]}>{creatorProfile.profiles.bio}</Text>
        </Card>
      ) : null}

      {creatorProfile.interests.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Intérêts</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {creatorProfile.interests.map((interest) => (
              <Badge key={interest} label={interest} tone="collab" />
            ))}
          </View>
        </View>
      ) : null}

      {creatorProfile.preferred_content_types.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Contenu préféré</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {creatorProfile.preferred_content_types.map((type) => (
              <Badge key={type} label={type} tone="neutral" />
            ))}
          </View>
        </View>
      ) : null}

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      {myId !== creatorProfile.profile_id ? (
        <>
          <Button label="🤝 Contacter" onPress={onContact} loading={startConversation.isPending} />
          <ReportBlockActions profileId={creatorProfile.profile_id} />
        </>
      ) : null}
    </Screen>
  );
}
