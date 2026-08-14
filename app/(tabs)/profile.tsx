import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useOwnCreatorProfile } from '@/features/home/useOwnCreatorProfile';
import { useOwnProProfile } from '@/features/home/useOwnProProfile';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

function completionPercent(hasPro: boolean, hasCollab: boolean, proDone: boolean, collabDone: boolean) {
  const steps = [true]; // account created
  if (hasPro) steps.push(proDone);
  if (hasCollab) steps.push(collabDone);
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

export default function ProfileTab() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: proProfile } = useOwnProProfile();
  const { data: creatorProfile } = useOwnCreatorProfile();

  if (!profile) return null;

  const percent = completionPercent(
    profile.is_pro_mode,
    profile.is_collab_mode,
    !!proProfile,
    !!creatorProfile
  );

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar name={profile.full_name} uri={profile.avatar_url} size={72} />
        <Text style={[typography.title, { color: colors.text }]}>{profile.full_name}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>@{profile.username}</Text>
        {profile.city ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>📍 {profile.city}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={[typography.body, { color: colors.text, textAlign: 'center' }]}>{profile.bio}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {profile.is_pro_mode ? <Badge label="PRO" tone="pro" /> : null}
          {profile.is_collab_mode ? <Badge label="COLLAB" tone="collab" /> : null}
        </View>
        <Button label="Modifier mes infos" variant="ghost" onPress={() => router.push('/profile-edit/personal')} />
      </View>

      <Card style={{ gap: spacing.xs }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Profil complété à {percent}%</Text>
        {percent < 100 ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Complète tes informations pour être plus facilement trouvé.
          </Text>
        ) : null}
      </Card>

      {profile.is_pro_mode ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Espace PRO</Text>
            <Pressable onPress={() => router.push('/profile-edit/pro')}>
              <Text style={[typography.label, { color: colors.primary }]}>Modifier</Text>
            </Pressable>
          </View>
          {proProfile ? (
            <>
              <Text style={[typography.body, { color: colors.text }]}>{proProfile.headline}</Text>
              {proProfile.services.map((service) => (
                <Text key={service.id} style={[typography.caption, { color: colors.textMuted }]}>
                  • {service.title} {service.price_amount ? `— ${service.price_amount}€` : ''}
                </Text>
              ))}
            </>
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Profil pro non complété.</Text>
          )}
        </Card>
      ) : (
        <Button
          label="💼 Activer l'espace PRO"
          variant="secondary"
          onPress={() => router.push('/profile-edit/pro')}
        />
      )}

      {profile.is_collab_mode ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.subtitle, { color: colors.text }]}>Espace Collab</Text>
            <Pressable onPress={() => router.push('/profile-edit/collab')}>
              <Text style={[typography.label, { color: colors.primary }]}>Modifier</Text>
            </Pressable>
          </View>
          {creatorProfile && creatorProfile.interests.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {creatorProfile.interests.map((interest) => (
                <Badge key={interest} label={interest} tone="collab" />
              ))}
            </View>
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Aucun centre d'intérêt renseigné.</Text>
          )}
        </Card>
      ) : (
        <Button
          label="🤝 Activer l'espace Collab"
          variant="secondary"
          onPress={() => router.push('/profile-edit/collab')}
        />
      )}

      <Button label="🤍 Mes favoris" variant="ghost" onPress={() => router.push('/favorites')} />

      {profile.is_admin ? (
        <Button label="🛡️ Admin" variant="ghost" onPress={() => router.push('/admin')} />
      ) : null}

      <Button
        label="Se déconnecter"
        variant="ghost"
        onPress={async () => {
          await signOut();
          router.replace('/welcome');
        }}
      />
    </Screen>
  );
}
