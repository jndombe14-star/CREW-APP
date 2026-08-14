import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { StarPicker } from '@/components/StarPicker';
import {
  useApplicationsForCollaboration,
  useApplyToCollaboration,
  useUpdateApplicationStatus,
} from '@/features/collaborations/useApplications';
import { useCollaborationDetail } from '@/features/collaborations/useCollaborations';
import { useStartConversation } from '@/features/messaging/useStartConversation';
import { useCreateCollaborationReview, useMyReviewedCollaborationIds } from '@/features/reviews/useReviews';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import type { CollaborationType } from '@/lib/database.types';

const TYPE_LABELS: Record<CollaborationType, string> = {
  collaboration: '🤝 Collaboration',
  exchange: '🔄 Échange',
  free: '🆓 Gratuit',
  paid: '💰 Rémunéré',
  group: '👥 Groupe',
};

function CollaborationReviewForm({ collaborationId, revieweeId }: { collaborationId: string; revieweeId: string }) {
  const { colors, spacing, typography } = useTheme();
  const createReview = useCreateCollaborationReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return <Text style={[typography.caption, { color: colors.success }]}>Merci pour ton avis !</Text>;
  }

  return (
    <Card style={{ gap: spacing.sm }}>
      <Text style={[typography.subtitle, { color: colors.text }]}>Laisser un avis</Text>
      <StarPicker value={rating} onChange={setRating} />
      <Input placeholder="Un commentaire (optionnel)" value={comment} onChangeText={setComment} />
      <Button
        label="Envoyer l'avis"
        variant="secondary"
        loading={createReview.isPending}
        onPress={async () => {
          await createReview.mutateAsync({ collaborationId, revieweeId, rating, comment: comment.trim() || null });
          setDone(true);
        }}
      />
    </Card>
  );
}

export default function CollaborationDetail() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useAuthStore((s) => s.session?.user.id);
  const { data: collaboration, isLoading, refetch: refetchCollaboration } = useCollaborationDetail(id);
  const { data: applications } = useApplicationsForCollaboration(id);
  const applyMutation = useApplyToCollaboration();
  const updateApplication = useUpdateApplicationStatus();
  const startConversation = useStartConversation();
  const { data: reviewedCollaborationIds } = useMyReviewedCollaborationIds();

  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  if (!collaboration) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.textMuted }]}>Collaboration introuvable.</Text>
      </Screen>
    );
  }

  const isCreator = myId === collaboration.creator_id;
  const myApplication = applications?.find((a) => a.applicant_id === myId);
  const acceptedApplication = applications?.find((a) => a.status === 'accepted');
  const otherPartyId = isCreator ? acceptedApplication?.applicant_id : collaboration.creator_id;
  const isMatchedParty = isCreator || myApplication?.status === 'accepted';

  const onMarkCompleted = async () => {
    await supabase.from('collaborations').update({ status: 'completed' }).eq('id', id as string);
    await refetchCollaboration();
  };

  const onApply = async () => {
    if (!id) return;
    setError(null);
    try {
      await applyMutation.mutateAsync({ collaborationId: id, message: message.trim() || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer ta candidature.");
    }
  };

  const onAccept = async (applicationId: string, applicantId: string) => {
    if (!id) return;
    await updateApplication.mutateAsync({ applicationId, collaborationId: id, status: 'accepted' });
    const conversationId = await startConversation.mutateAsync(applicantId);
    router.push(`/chat/${conversationId}`);
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Badge label={TYPE_LABELS[collaboration.collaboration_type]} tone="collab" />
          {collaboration.categories ? (
            <Badge label={`${collaboration.categories.icon} ${collaboration.categories.label}`} tone="neutral" />
          ) : null}
          <Badge
            label={collaboration.status === 'open' ? 'Ouverte' : collaboration.status === 'matched' ? 'Matchée' : collaboration.status}
            tone={collaboration.status === 'open' ? 'success' : 'neutral'}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[typography.title, { color: colors.text, flex: 1 }]}>{collaboration.title}</Text>
          <FavoriteButton collaborationId={collaboration.id} />
        </View>
        {collaboration.description ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{collaboration.description}</Text>
        ) : null}
        {collaboration.location ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>📍 {collaboration.location}</Text>
        ) : null}
        {collaboration.scheduled_date ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>📅 {collaboration.scheduled_date}</Text>
        ) : null}
        {collaboration.budget_amount ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>💰 {collaboration.budget_amount}€</Text>
        ) : null}
      </View>

      <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Avatar name={collaboration.profiles?.full_name ?? '?'} uri={collaboration.profiles?.avatar_url} />
        <View>
          <Text style={[typography.subtitle, { color: colors.text }]}>{collaboration.profiles?.full_name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>@{collaboration.profiles?.username}</Text>
        </View>
      </Card>

      {isCreator && collaboration.status === 'matched' ? (
        <Button label="Marquer comme terminée" variant="secondary" onPress={onMarkCompleted} />
      ) : null}

      {isCreator ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>
            Candidatures ({applications?.length ?? 0})
          </Text>
          {applications?.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Aucune candidature pour l'instant.</Text>
          ) : (
            applications?.map((application) => (
              <Card key={application.id} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <Avatar name={application.profiles?.full_name ?? '?'} uri={application.profiles?.avatar_url} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text }]}>{application.profiles?.full_name}</Text>
                    {application.message ? (
                      <Text style={[typography.caption, { color: colors.textMuted }]}>{application.message}</Text>
                    ) : null}
                  </View>
                  <Badge
                    label={application.status === 'pending' ? 'En attente' : application.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                    tone={application.status === 'accepted' ? 'success' : 'neutral'}
                  />
                </View>
                {application.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Accepter et discuter"
                        onPress={() => onAccept(application.id, application.applicant_id)}
                        loading={updateApplication.isPending || startConversation.isPending}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Refuser"
                        variant="ghost"
                        onPress={() =>
                          updateApplication.mutate({ applicationId: application.id, collaborationId: id!, status: 'declined' })
                        }
                        loading={updateApplication.isPending}
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </View>
      ) : myApplication ? (
        <Card>
          <Text style={[typography.body, { color: colors.text }]}>
            Ta candidature est {myApplication.status === 'pending' ? 'en attente' : myApplication.status === 'accepted' ? 'acceptée 🎉' : 'refusée'}.
          </Text>
        </Card>
      ) : collaboration.status === 'open' ? (
        <View style={{ gap: spacing.sm }}>
          <Input placeholder="Un message pour te présenter (optionnel)" value={message} onChangeText={setMessage} />
          <Button label="🤝 Manifester mon intérêt" onPress={onApply} loading={applyMutation.isPending} />
        </View>
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted }]}>Cette collaboration n'est plus ouverte.</Text>
      )}

      {collaboration.status === 'completed' && isMatchedParty && otherPartyId ? (
        reviewedCollaborationIds?.has(collaboration.id) ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>Avis envoyé ✓</Text>
        ) : (
          <CollaborationReviewForm collaborationId={collaboration.id} revieweeId={otherPartyId} />
        )
      ) : null}

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </Screen>
  );
}
