import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { PortfolioThumbnail } from '@/components/PortfolioThumbnail';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/onboarding/useCategories';
import { useOwnProProfile } from '@/features/home/useOwnProProfile';
import { useAddPortfolioItem, useDeletePortfolioItem, usePortfolioItems } from '@/features/portfolio/usePortfolioItems';
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

export default function EditProProfile() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: proProfile, refetch } = useOwnProProfile();
  const { data: categories } = useCategories('pro-or-both');
  const { data: portfolioItems } = usePortfolioItems(proProfile?.id);
  const addPortfolioItem = useAddPortfolioItem(proProfile?.id ?? '');
  const deletePortfolioItem = useDeletePortfolioItem(proProfile?.id ?? '');

  const [headline, setHeadline] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState<PriceUnit>('hour');
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    if (proProfile) {
      setHeadline(proProfile.headline);
      setCategoryId(proProfile.primary_category_id);
    }
  }, [proProfile?.id]);

  const onSaveProfile = async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;
    if (!headline.trim()) {
      setError('Ajoute un titre pour ton profil pro.');
      return;
    }

    setSaving(true);
    setError(null);

    if (proProfile) {
      const { error: updateError } = await supabase
        .from('professional_profiles')
        .update({ headline: headline.trim(), primary_category_id: categoryId })
        .eq('id', proProfile.id);
      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('professional_profiles')
        .insert({ profile_id: userId, headline: headline.trim(), primary_category_id: categoryId });
      const { error: modeError } = await supabase
        .from('profiles')
        .update({ is_pro_mode: true })
        .eq('id', userId);
      setSaving(false);
      if (insertError || modeError) {
        setError(insertError?.message ?? modeError?.message ?? 'Erreur inconnue.');
        return;
      }
      await useAuthStore.getState().refreshProfile();
    }

    await refetch();
    router.back();
  };

  const onAddService = async () => {
    if (!proProfile || !newServiceTitle.trim()) return;
    setAddingService(true);
    const { error: serviceError } = await supabase.from('services').insert({
      professional_profile_id: proProfile.id,
      title: newServiceTitle.trim(),
      price_amount: newServicePrice ? Number(newServicePrice) : null,
      price_unit: newServiceUnit,
    });
    setAddingService(false);
    if (serviceError) {
      setError(serviceError.message);
      return;
    }
    setNewServiceTitle('');
    setNewServicePrice('');
    await refetch();
  };

  const onDeleteService = async (serviceId: string) => {
    await supabase.from('services').delete().eq('id', serviceId);
    await refetch();
  };

  return (
    <Screen scroll>
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

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Enregistrer" onPress={onSaveProfile} loading={saving} />

      {proProfile ? (
        <View style={{ gap: spacing.md }}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Mes services</Text>

          {proProfile.services.map((service) => (
            <Card key={service.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[typography.body, { color: colors.text }]}>{service.title}</Text>
                {service.price_amount ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {service.price_amount}€ {PRICE_UNITS.find((u) => u.value === service.price_unit)?.label}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => onDeleteService(service.id)}>
                <Text style={[typography.label, { color: colors.danger }]}>Supprimer</Text>
              </Pressable>
            </Card>
          ))}

          <Card style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.textMuted }]}>Ajouter un service</Text>
            <Input label="Titre" value={newServiceTitle} onChangeText={setNewServiceTitle} />
            <Input label="Prix (€)" keyboardType="numeric" value={newServicePrice} onChangeText={setNewServicePrice} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {PRICE_UNITS.map((unit) => (
                  <Pressable key={unit.value} onPress={() => setNewServiceUnit(unit.value)}>
                    <Badge label={unit.label} tone={newServiceUnit === unit.value ? 'pro' : 'neutral'} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Button
              label="Ajouter"
              variant="secondary"
              onPress={onAddService}
              loading={addingService}
              disabled={!newServiceTitle.trim()}
            />
          </Card>

          <Text style={[typography.subtitle, { color: colors.text }]}>Portfolio</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {portfolioItems?.map((item) => (
              <Pressable key={item.id} onLongPress={() => deletePortfolioItem.mutate(item.id)}>
                <PortfolioThumbnail item={item} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => addPortfolioItem.mutate()}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 28, color: colors.textMuted }}>
                {addPortfolioItem.isPending ? '…' : '+'}
              </Text>
            </Pressable>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Appui long sur une photo pour la supprimer.
          </Text>

          <Button
            label="🗓️ Gérer mes disponibilités"
            variant="secondary"
            onPress={() => router.push('/profile-edit/availability')}
          />
        </View>
      ) : null}
    </Screen>
  );
}
