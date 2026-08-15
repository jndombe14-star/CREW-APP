import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/onboarding/useCategories';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

const CONTENT_TYPES = ['Photo', 'Vidéo', 'TikTok', 'Reel', 'Podcast', 'Autre'];

export default function CollabProfileOnboarding() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: categories } = useCategories('collab-or-both');

  const [interests, setInterests] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const onFinish = async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('creator_profiles').insert({
      profile_id: userId,
      interests,
      preferred_content_types: contentTypes,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace('/map');
  };

  const onSkip = () => router.replace('/map');

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.title, { color: colors.text }]}>Tes centres d'intérêt</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Ça nous aide à te montrer des collaborations pertinentes.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Ce qui t'intéresse</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {categories?.map((category) => (
            <Pressable key={category.id} onPress={() => toggle(interests, setInterests, category.slug)}>
              <Badge
                label={`${category.icon} ${category.label}`}
                tone={interests.includes(category.slug) ? 'collab' : 'neutral'}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Type de contenu préféré</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CONTENT_TYPES.map((type) => (
            <Pressable key={type} onPress={() => toggle(contentTypes, setContentTypes, type)}>
              <Badge label={type} tone={contentTypes.includes(type) ? 'collab' : 'neutral'} />
            </Pressable>
          ))}
        </View>
      </View>

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Terminer" onPress={onFinish} loading={saving} />
      <Button label="Compléter plus tard" variant="ghost" onPress={onSkip} />
    </Screen>
  );
}
