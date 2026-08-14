import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { LocationField, type LocationValue } from '@/components/LocationField';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/onboarding/useCategories';
import { useCreateCollaboration } from '@/features/collaborations/useCreateCollaboration';
import { useTheme } from '@/theme/useTheme';
import type { CollaborationType } from '@/lib/database.types';

const TYPES: { value: CollaborationType; icon: string; label: string }[] = [
  { value: 'collaboration', icon: '🤝', label: 'Collaboration' },
  { value: 'exchange', icon: '🔄', label: 'Échange' },
  { value: 'free', icon: '🆓', label: 'Gratuit' },
  { value: 'paid', icon: '💰', label: 'Rémunéré' },
  { value: 'group', icon: '👥', label: 'Groupe' },
];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toTimeString(d: Date) {
  return d.toTimeString().slice(0, 5);
}

export default function CreateCollaboration() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: categories } = useCategories('collab-or-both');
  const createCollaboration = useCreateCollaboration();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CollaborationType>('collaboration');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<LocationValue>({ address: '', latitude: null, longitude: null });
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onPublish = async () => {
    if (!title.trim()) {
      setError('Ajoute un titre pour ta collaboration.');
      return;
    }
    setError(null);

    try {
      const collaboration = await createCollaboration.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        categoryId,
        collaborationType: type,
        location: location.address.trim() || null,
        latitude: location.latitude,
        longitude: location.longitude,
        scheduledDate: date ? toDateString(date) : null,
        scheduledTime: time ? toTimeString(time) : null,
        budgetAmount: type === 'paid' && budget ? Number(budget) : null,
      });
      router.replace(`/collaborations/${collaboration.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de publier la collaboration.');
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Que veux-tu faire ?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {categories?.map((category) => (
              <Pressable key={category.id} onPress={() => setCategoryId(category.id)}>
                <Badge
                  label={`${category.icon} ${category.label}`}
                  tone={categoryId === category.id ? 'collab' : 'neutral'}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <Input
        label="Titre (ex: Je cherche un photographe à Marseille samedi)"
        value={title}
        onChangeText={setTitle}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Type de collaboration</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {TYPES.map((t) => (
            <Pressable key={t.value} onPress={() => setType(t.value)}>
              <Badge label={`${t.icon} ${t.label}`} tone={type === t.value ? 'collab' : 'neutral'} />
            </Pressable>
          ))}
        </View>
      </View>

      {type === 'paid' ? (
        <Input label="Budget (€)" keyboardType="numeric" value={budget} onChangeText={setBudget} />
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <DateField label="Quand (optionnel)" mode="date" value={date} onChange={setDate} minimumDate={new Date()} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Heure (optionnel)" mode="time" value={time} onChange={setTime} />
        </View>
      </View>

      <LocationField value={location} onChange={setLocation} />

      <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Publier" onPress={onPublish} loading={createCollaboration.isPending} />
    </Screen>
  );
}
