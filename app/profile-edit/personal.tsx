import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { getCurrentDeviceLocation, toGeographyPoint } from '@/lib/location';
import { pickAndUploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

// Accepts "@handle", a bare "handle", or a pasted profile URL and stores just the handle.
function normalizeHandle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const afterSlash = trimmed.includes('/') ? trimmed.split('/').filter(Boolean).pop() ?? trimmed : trimmed;
  return afterSlash.replace(/^@/, '');
}

export default function EditPersonalInfo() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [instagramHandle, setInstagramHandle] = useState(profile?.instagram_handle ?? '');
  const [tiktokHandle, setTiktokHandle] = useState(profile?.tiktok_handle ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChangeAvatar = async () => {
    if (!profile) return;
    setError(null);
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadImage('avatars', profile.id);
      if (!url) return;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      if (updateError) throw updateError;
      setAvatarUrl(url);
      await useAuthStore.getState().refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de mettre à jour la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onUseCurrentLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const location = await getCurrentDeviceLocation();
      setCoords({ latitude: location.latitude, longitude: location.longitude });
      if (location.city) setCity(location.city);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de récupérer ta position.');
    } finally {
      setLocating(false);
    }
  };

  const onSave = async () => {
    if (!profile) return;
    if (!fullName.trim() || !username.trim()) {
      setError('Le nom et le nom d\'utilisateur sont requis.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        city: city.trim() || null,
        bio: bio.trim() || null,
        instagram_handle: normalizeHandle(instagramHandle),
        tiktok_handle: normalizeHandle(tiktokHandle),
        ...(coords ? { location: toGeographyPoint(coords.latitude, coords.longitude) } : {}),
      })
      .eq('id', profile.id);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.message.includes('duplicate') ? "Ce nom d'utilisateur est déjà pris." : updateError.message
      );
      return;
    }

    await useAuthStore.getState().refreshProfile();
    router.back();
  };

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar name={fullName || '?'} uri={avatarUrl} size={88} />
        <Button
          label={uploadingAvatar ? 'Envoi…' : 'Changer la photo'}
          variant="ghost"
          onPress={onChangeAvatar}
          loading={uploadingAvatar}
        />
      </View>

      <Input label="Nom complet" value={fullName} onChangeText={setFullName} />
      <Input label="Nom d'utilisateur" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <Input label="Ville" value={city} onChangeText={setCity} />
      <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
      <Input
        label="Instagram"
        placeholder="@tonpseudo"
        autoCapitalize="none"
        value={instagramHandle}
        onChangeText={setInstagramHandle}
      />
      <Input
        label="TikTok"
        placeholder="@tonpseudo"
        autoCapitalize="none"
        value={tiktokHandle}
        onChangeText={setTiktokHandle}
      />

      <Button
        label={coords ? '📍 Position mise à jour' : '📍 Utiliser ma position actuelle'}
        variant="secondary"
        onPress={onUseCurrentLocation}
        loading={locating}
      />

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Enregistrer" onPress={onSave} loading={saving} />
    </Screen>
  );
}
