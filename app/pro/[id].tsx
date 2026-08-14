import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Input } from '@/components/Input';
import { PortfolioThumbnail } from '@/components/PortfolioThumbnail';
import { ReportBlockActions } from '@/components/ReportBlockActions';
import { Screen } from '@/components/Screen';
import { useAvailabilityBlocks, useWeeklyAvailability } from '@/features/availability/useAvailability';
import { useCreateBooking } from '@/features/bookings/useCreateBooking';
import { usePortfolioItems } from '@/features/portfolio/usePortfolioItems';
import { useProProfileDetail } from '@/features/profile-detail/useProProfileDetail';
import { useStartConversation } from '@/features/messaging/useStartConversation';
import { useProfileRating, useReviewsForProfile } from '@/features/reviews/useReviews';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function ProProfileDetail() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: proProfile, isLoading } = useProProfileDetail(id);
  const { data: rating } = useProfileRating(id);
  const { data: reviews } = useReviewsForProfile(id);
  const { data: portfolioItems } = usePortfolioItems(proProfile?.id);
  const { data: weeklyAvailability } = useWeeklyAvailability(proProfile?.id);
  const { data: availabilityBlocks } = useAvailabilityBlocks(proProfile?.id);
  const startConversation = useStartConversation();
  const createBooking = useCreateBooking();
  const [error, setError] = useState<string | null>(null);
  const myId = useAuthStore((s) => s.session?.user.id);

  const [requestingServiceId, setRequestingServiceId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  const onSubmitBooking = async () => {
    if (!proProfile || !requestingServiceId) return;
    setError(null);
    if (!DATE_RE.test(date)) {
      setError('Format de date attendu : AAAA-MM-JJ (ex: 2026-08-20).');
      return;
    }
    if (time && !TIME_RE.test(time)) {
      setError('Format d\'heure attendu : HH:MM (ex: 18:00).');
      return;
    }

    try {
      await createBooking.mutateAsync({
        serviceId: requestingServiceId,
        professionalProfileId: proProfile.id,
        requestedDate: date,
        requestedTime: time || null,
        location: location.trim() || null,
        message: message.trim() || null,
      });
      setBookingSuccess(true);
      setRequestingServiceId(null);
      setDate('');
      setTime('');
      setLocation('');
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d\'envoyer la demande.');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  if (!proProfile) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.textMuted }]}>Profil introuvable.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar name={proProfile.profiles?.full_name ?? '?'} uri={proProfile.profiles?.avatar_url} size={88} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Text style={[typography.title, { color: colors.text }]}>{proProfile.profiles?.full_name}</Text>
          {myId !== proProfile.profile_id ? <FavoriteButton profileId={proProfile.profile_id} /> : null}
        </View>
        <Text style={[typography.body, { color: colors.textMuted }]}>@{proProfile.profiles?.username}</Text>
        {proProfile.profiles?.city ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>📍 {proProfile.profiles.city}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Badge label="PRO" tone="pro" />
          {rating ? <Badge label={`⭐ ${rating.avg_rating} (${rating.review_count})`} tone="neutral" /> : null}
        </View>
      </View>

      <Card style={{ gap: spacing.sm }}>
        <Text style={[typography.subtitle, { color: colors.text }]}>{proProfile.headline}</Text>
        {proProfile.profiles?.bio ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{proProfile.profiles.bio}</Text>
        ) : null}
      </Card>

      {weeklyAvailability && weeklyAvailability.length > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>Disponibilités</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {weeklyAvailability.map((w) => (
              <Text key={w.id} style={[typography.caption, { color: colors.text }]}>
                {DAY_LABELS[w.day_of_week]} {w.start_time.slice(0, 5)}-{w.end_time.slice(0, 5)}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {portfolioItems && portfolioItems.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Portfolio</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {portfolioItems.map((item) => (
              <PortfolioThumbnail key={item.id} item={item} />
            ))}
          </View>
        </View>
      ) : null}

      {proProfile.services.length > 0 && myId !== proProfile.profile_id ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Services</Text>
          {proProfile.services.map((service) => (
            <Card key={service.id} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Text style={[typography.body, { color: colors.text }]}>{service.title}</Text>
                  {service.price_amount ? (
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{service.price_amount}€</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() =>
                    setRequestingServiceId(requestingServiceId === service.id ? null : service.id)
                  }
                >
                  <Text style={[typography.label, { color: colors.primary }]}>
                    {requestingServiceId === service.id ? 'Annuler' : 'Demander'}
                  </Text>
                </Pressable>
              </View>

              {requestingServiceId === service.id ? (
                <View style={{ gap: spacing.sm }}>
                  <Input label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} placeholder="2026-08-20" />
                  {(() => {
                    if (!DATE_RE.test(date)) return null;
                    const parsed = new Date(`${date}T00:00:00`);
                    const isBlocked = availabilityBlocks?.some((b) => b.blocked_date === date);
                    const hasWeeklySchedule = (weeklyAvailability?.length ?? 0) > 0;
                    const isAvailableDay = weeklyAvailability?.some((w) => w.day_of_week === parsed.getDay());
                    if (isBlocked) {
                      return (
                        <Text style={[typography.caption, { color: colors.danger }]}>
                          ⚠️ Ce professionnel a indiqué être indisponible ce jour-là.
                        </Text>
                      );
                    }
                    if (hasWeeklySchedule && !isAvailableDay) {
                      return (
                        <Text style={[typography.caption, { color: colors.warning }]}>
                          ⚠️ Ce professionnel ne travaille habituellement pas ce jour-là.
                        </Text>
                      );
                    }
                    return null;
                  })()}
                  <Input label="Heure (HH:MM, optionnel)" value={time} onChangeText={setTime} placeholder="18:00" />
                  <Input label="Lieu" value={location} onChangeText={setLocation} />
                  <Input label="Message (optionnel)" value={message} onChangeText={setMessage} multiline />
                  <Button label="Envoyer la demande" onPress={onSubmitBooking} loading={createBooking.isPending} />
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Avis</Text>
          {reviews.map((review) => (
            <Card key={review.id} style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.body, { color: colors.text }]}>{review.profiles?.full_name}</Text>
                <Text>{'⭐'.repeat(review.rating)}</Text>
              </View>
              {review.comment ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>{review.comment}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {bookingSuccess ? (
        <Text style={[typography.caption, { color: colors.success }]}>
          Demande envoyée ! Suis son statut dans "Mes réservations".
        </Text>
      ) : null}
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      {myId !== proProfile.profile_id ? (
        <>
          <Button label="💬 Contacter" variant="secondary" onPress={onContact} loading={startConversation.isPending} />
          <ReportBlockActions profileId={proProfile.profile_id} />
        </>
      ) : null}
    </Screen>
  );
}
