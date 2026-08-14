import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useOwnCreatorProfile } from '@/features/home/useOwnCreatorProfile';
import { useOwnProProfile } from '@/features/home/useOwnProProfile';
import { useUnreadNotificationCount } from '@/features/notifications/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

export default function Home() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: proProfile } = useOwnProProfile();
  const { data: creatorProfile } = useOwnCreatorProfile();
  const unreadCount = useUnreadNotificationCount();

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={[typography.title, { color: colors.text }]}>
            Bonjour {profile?.full_name?.split(' ')[0] ?? ''} 👋
          </Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>Que veux-tu faire aujourd'hui ?</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} style={{ padding: spacing.xs }}>
          <Text style={{ fontSize: 24 }}>🔔</Text>
          {unreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: colors.danger,
                borderRadius: radius.full,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="💼 Trouver un PRO" onPress={() => router.push('/explore')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="🤝 Collaborer" variant="secondary" onPress={() => router.push('/explore')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="📋 Mes réservations" variant="ghost" onPress={() => router.push('/bookings')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="🤝 Mes collaborations" variant="ghost" onPress={() => router.push('/collaborations/mine')} />
        </View>
      </View>

      {profile?.is_pro_mode ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Espace PRO</Text>
            <Badge label="PRO" tone="pro" />
          </View>
          {proProfile ? (
            <>
              <Text style={[typography.body, { color: colors.text }]}>{proProfile.headline}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {proProfile.services?.length ?? 0} service{(proProfile.services?.length ?? 0) === 1 ? '' : 's'} publié
                {(proProfile.services?.length ?? 0) === 1 ? '' : 's'}
              </Text>
            </>
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Complète ton profil professionnel depuis l'onglet Profil.
            </Text>
          )}
        </Card>
      ) : null}

      {profile?.is_collab_mode ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Espace Collab</Text>
            <Badge label="COLLAB" tone="collab" />
          </View>
          {creatorProfile && creatorProfile.interests.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {creatorProfile.interests.map((interest) => (
                <Badge key={interest} label={interest} tone="collab" />
              ))}
            </View>
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Ajoute tes centres d'intérêt depuis l'onglet Profil.
            </Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
