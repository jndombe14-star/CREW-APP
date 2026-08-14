import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import {
  useAddAvailabilityBlock,
  useAvailabilityBlocks,
  useRemoveAvailabilityBlock,
  useRemoveWeeklyAvailability,
  useSetWeeklyAvailability,
  useWeeklyAvailability,
} from '@/features/availability/useAvailability';
import { useOwnProProfile } from '@/features/home/useOwnProProfile';
import { useTheme } from '@/theme/useTheme';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_RE = /^\d{2}:\d{2}$/;

export default function EditAvailability() {
  const { colors, spacing, typography } = useTheme();
  const { data: proProfile } = useOwnProProfile();
  const proProfileId = proProfile?.id ?? '';

  const { data: weekly } = useWeeklyAvailability(proProfileId);
  const { data: blocks } = useAvailabilityBlocks(proProfileId);
  const setDay = useSetWeeklyAvailability(proProfileId);
  const removeDay = useRemoveWeeklyAvailability(proProfileId);
  const addBlock = useAddAvailabilityBlock(proProfileId);
  const removeBlock = useRemoveAvailabilityBlock(proProfileId);

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSaveDay = async (dayOfWeek: number) => {
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      setError('Format attendu : HH:MM');
      return;
    }
    setError(null);
    await setDay.mutateAsync({ dayOfWeek, startTime, endTime });
    setEditingDay(null);
  };

  const onAddBlock = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blockDate)) {
      setError('Format de date attendu : AAAA-MM-JJ');
      return;
    }
    setError(null);
    await addBlock.mutateAsync({ date: blockDate, reason: blockReason.trim() || null });
    setBlockDate('');
    setBlockReason('');
  };

  return (
    <Screen scroll>
      <Text style={[typography.subtitle, { color: colors.text }]}>Horaires hebdomadaires</Text>
      <View style={{ gap: spacing.sm }}>
        {DAYS.map((label, dayOfWeek) => {
          const existing = weekly?.find((w) => w.day_of_week === dayOfWeek);
          return (
            <Card key={dayOfWeek} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
                {existing ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {existing.start_time.slice(0, 5)} – {existing.end_time.slice(0, 5)}
                  </Text>
                ) : (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>Indisponible</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={existing ? 'Modifier' : 'Ajouter'}
                    variant="secondary"
                    onPress={() => {
                      setEditingDay(dayOfWeek);
                      if (existing) {
                        setStartTime(existing.start_time.slice(0, 5));
                        setEndTime(existing.end_time.slice(0, 5));
                      }
                    }}
                  />
                </View>
                {existing ? (
                  <View style={{ flex: 1 }}>
                    <Button label="Retirer" variant="ghost" onPress={() => removeDay.mutate(existing.id)} />
                  </View>
                ) : null}
              </View>
              {editingDay === dayOfWeek ? (
                <View style={{ gap: spacing.sm }}>
                  <Input label="Début (HH:MM)" value={startTime} onChangeText={setStartTime} />
                  <Input label="Fin (HH:MM)" value={endTime} onChangeText={setEndTime} />
                  <Button label="Enregistrer" onPress={() => onSaveDay(dayOfWeek)} loading={setDay.isPending} />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <Text style={[typography.subtitle, { color: colors.text }]}>Dates bloquées</Text>
      {blocks?.map((block) => (
        <Card key={block.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.text }]}>{block.blocked_date}</Text>
            {block.reason ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{block.reason}</Text>
            ) : null}
          </View>
          <Pressable onPress={() => removeBlock.mutate(block.id)}>
            <Text style={[typography.label, { color: colors.danger }]}>Retirer</Text>
          </Pressable>
        </Card>
      ))}
      <Card style={{ gap: spacing.sm }}>
        <Input label="Date (AAAA-MM-JJ)" value={blockDate} onChangeText={setBlockDate} placeholder="2026-12-25" />
        <Input label="Raison (optionnel)" value={blockReason} onChangeText={setBlockReason} />
        <Button label="Bloquer cette date" variant="secondary" onPress={onAddBlock} loading={addBlock.isPending} />
      </Card>

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </Screen>
  );
}
