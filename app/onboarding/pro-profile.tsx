import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/onboarding/useCategories';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import type { PriceUnit } from '@/lib/database.types';

const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: 'hour', label: '/ heure' },
  { value: 'day', label: '/ jour' },
  { value: 'project', label: '/ projet' },
  { value: 'photo', label: '/ photo' },
  { value: 'video', label: '/ vidéo' },
  { value: 'from', label: 'à partir de' },
  { value: 'negotiable', label: 'à négocier' },
];

export default function ProProfileOnboarding() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { data: categories } = useCategories('pro-or-both');

  const [headline, setHeadline] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState<PriceUnit>('hour');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const goNext = () => {
    if (next === 'collab') router.replace('/onboarding/collab-profile');
    else router.replace('/map');
  };

  const onSkip = () => goNext();

  const onSave = async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    if (!headline.trim()) {
      setError('Ajoute un titre pour ton profil pro.');
      return;
    }

    setSaving(true);
    setError(null);

    const { data: proProfile, error: proError } = await supabase
      .from('professional_profiles')
      .insert({
        profile_id: userId,
        headline: headline.trim(),
        primary_category_id: categoryId,
      })
      .select()
      .single();

    if (proError || !proProfile) {
      setSaving(false);
      setError(proError?.message ?? 'Impossible de créer le profil.');
      return;
    }

    if (serviceTitle.trim()) {
      const { error: serviceError } = await supabase.from('services').insert({
        professional_profile_id: proProfile.id,
        title: serviceTitle.trim(),
        price_amount: price ? Number(price) : null,
        price_unit: priceUnit,
      });
      if (serviceError) {
        setSaving(false);
        setError(serviceError.message);
        return;
      }
    }

    setSaving(false);
    goNext();
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.title, { color: colors.text }]}>Ton profil professionnel</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Quelques infos pour te rendre visible. Tu pourras tout compléter plus tard.
        </Text>
      </View>

      <Input label="Titre (ex: Vidéaste à Marseille)" value={headline} onChangeText={setHeadline} />

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Catégorie principale</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {categories?.map((category) => (
              <Pressable key={category.id} onPress={() => setCategoryId(category.id)}>
                <Badge
                  label={`${category.icon} ${category.label}`}
                  tone={categoryId === category.id ? 'pro' : 'neutral'}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.subtitle, { color: colors.text }]}>Ajoute un premier service (optionnel)</Text>
        <Input label="Titre du service (ex: Shooting photo)" value={serviceTitle} onChangeText={setServiceTitle} />
        <Input label="Prix (€)" keyboardType="numeric" value={price} onChangeText={setPrice} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {PRICE_UNITS.map((unit) => (
              <Pressable key={unit.value} onPress={() => setPriceUnit(unit.value)}>
                <Badge label={unit.label} tone={priceUnit === unit.value ? 'pro' : 'neutral'} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Continuer" onPress={onSave} loading={saving} />
      <Button label="Compléter plus tard" variant="ghost" onPress={onSkip} />
    </Screen>
  );
}
