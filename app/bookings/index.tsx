import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { StarPicker } from '@/components/StarPicker';
import { useBookingsAsClient, useBookingsAsProfessional, useUpdateBookingStatus } from '@/features/bookings/useBookings';
import { useOwnProProfile } from '@/features/home/useOwnProProfile';
import { useCreateReview, useMyReviewedBookingIds } from '@/features/reviews/useReviews';
import { mapsUrl } from '@/lib/location';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import type { BookingStatus } from '@/lib/database.types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'En attente',
  accepted: 'Acceptée',
  declined: 'Refusée',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

const STATUS_TONES: Record<BookingStatus, 'neutral' | 'success' | 'pro'> = {
  requested: 'neutral',
  accepted: 'success',
  declined: 'neutral',
  cancelled: 'neutral',
  completed: 'pro',
};

type Tab = 'received' | 'sent';

function ReviewForm({ bookingId, revieweeId }: { bookingId: string; revieweeId: string }) {
  const { colors, spacing, typography } = useTheme();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return <Text style={[typography.caption, { color: colors.success }]}>Merci pour ton avis !</Text>;
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <StarPicker value={rating} onChange={setRating} />
      <Input placeholder="Un commentaire (optionnel)" value={comment} onChangeText={setComment} />
      <Button
        label="Envoyer l'avis"
        variant="secondary"
        loading={createReview.isPending}
        onPress={async () => {
          await createReview.mutateAsync({ bookingId, revieweeId, rating, comment: comment.trim() || null });
          setDone(true);
        }}
      />
    </View>
  );
}

export default function BookingsScreen() {
  const { colors, spacing, typography } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { data: proProfile } = useOwnProProfile();
  const [tab, setTab] = useState<Tab>(profile?.is_pro_mode ? 'received' : 'sent');

  const received = useBookingsAsProfessional(proProfile?.id);
  const sent = useBookingsAsClient();
  const updateStatus = useUpdateBookingStatus();
  const { data: reviewedBookingIds } = useMyReviewedBookingIds();

  return (
    <Screen scroll>
      {profile?.is_pro_mode ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Reçues"
            variant={tab === 'received' ? 'primary' : 'secondary'}
            onPress={() => setTab('received')}
          />
          <Button
            label="Envoyées"
            variant={tab === 'sent' ? 'primary' : 'secondary'}
            onPress={() => setTab('sent')}
          />
        </View>
      ) : null}

      {tab === 'received' ? (
        received.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (received.data ?? []).length === 0 ? (
          <EmptyState icon="📋" title="Aucune demande reçue" description="Les demandes de prestation apparaîtront ici." />
        ) : (
          <View style={{ gap: spacing.md }}>
            {received.data!.map((booking) => (
              <Card key={booking.id} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <Avatar name={booking.profiles?.full_name ?? '?'} uri={booking.profiles?.avatar_url} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.subtitle, { color: colors.text }]}>{booking.profiles?.full_name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{booking.services?.title}</Text>
                  </View>
                  <Badge label={STATUS_LABELS[booking.status]} tone={STATUS_TONES[booking.status]} />
                </View>
                <Text style={[typography.body, { color: colors.text }]}>
                  📅 {booking.requested_date} {booking.requested_time ?? ''}
                </Text>
                {booking.location ? (
                  booking.latitude != null && booking.longitude != null ? (
                    <Pressable onPress={() => Linking.openURL(mapsUrl(booking.latitude!, booking.longitude!, booking.location!))}>
                      <Text style={[typography.caption, { color: colors.primary }]}>
                        📍 {booking.location} · ouvrir dans Plans
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={[typography.caption, { color: colors.textMuted }]}>📍 {booking.location}</Text>
                  )
                ) : null}
                {booking.message ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>"{booking.message}"</Text>
                ) : null}
                {booking.status === 'requested' ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Accepter"
                        onPress={() => updateStatus.mutate({ bookingId: booking.id, status: 'accepted' })}
                        loading={updateStatus.isPending}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Refuser"
                        variant="ghost"
                        onPress={() => updateStatus.mutate({ bookingId: booking.id, status: 'declined' })}
                        loading={updateStatus.isPending}
                      />
                    </View>
                  </View>
                ) : null}
                {booking.status === 'accepted' ? (
                  <Button
                    label="Marquer comme terminée"
                    variant="secondary"
                    onPress={() => updateStatus.mutate({ bookingId: booking.id, status: 'completed' })}
                    loading={updateStatus.isPending}
                  />
                ) : null}
              </Card>
            ))}
          </View>
        )
      ) : sent.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (sent.data ?? []).length === 0 ? (
        <EmptyState icon="📋" title="Aucune réservation envoyée" description="Tes demandes de prestation apparaîtront ici." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {sent.data!.map((booking) => (
            <Card key={booking.id} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Avatar
                  name={booking.professional_profiles?.profiles?.full_name ?? '?'}
                  uri={booking.professional_profiles?.profiles?.avatar_url}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>
                    {booking.professional_profiles?.profiles?.full_name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{booking.services?.title}</Text>
                </View>
                <Badge label={STATUS_LABELS[booking.status]} tone={STATUS_TONES[booking.status]} />
              </View>
              <Text style={[typography.body, { color: colors.text }]}>
                📅 {booking.requested_date} {booking.requested_time ?? ''}
              </Text>

              {booking.status === 'completed' && booking.professional_profiles?.profiles?.id ? (
                reviewedBookingIds?.has(booking.id) ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>Avis envoyé ✓</Text>
                ) : (
                  <ReviewForm bookingId={booking.id} revieweeId={booking.professional_profiles.profiles.id} />
                )
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
