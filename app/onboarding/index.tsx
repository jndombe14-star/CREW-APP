import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

type Mode = 'pro' | 'collab' | 'both';

const OPTIONS: { mode: Mode; icon: string; title: string; description: string }[] = [
  { mode: 'pro', icon: '💼', title: 'Proposer mes services', description: 'Crée ta vitrine professionnelle et reçois des demandes.' },
  { mode: 'collab', icon: '🤝', title: 'Trouver des collaborations', description: 'Rencontre des créateurs pour créer du contenu ensemble.' },
  { mode: 'both', icon: '🔀', title: 'Les deux', description: 'Active les deux espaces sur ton profil.' },
];

export default function ModeSelect() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<Mode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!selected) return;
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_pro_mode: selected === 'pro' || selected === 'both',
        is_collab_mode: selected === 'collab' || selected === 'both',
      })
      .eq('id', userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await useAuthStore.getState().refreshProfile();

    if (selected === 'pro') router.replace('/onboarding/pro-profile');
    else if (selected === 'collab') router.replace('/onboarding/collab-profile');
    else router.replace({ pathname: '/onboarding/pro-profile', params: { next: 'collab' } });
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.title, { color: colors.text }]}>Que veux-tu faire sur CREW ?</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Tu pourras changer ça plus tard dans ton profil.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option.mode;
          return (
            <Pressable key={option.mode} onPress={() => setSelected(option.mode)}>
              <Card
                style={{
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                  flexDirection: 'row',
                  gap: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28 }}>{option.icon}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{option.description}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Continuer" onPress={onContinue} disabled={!selected} loading={saving} />
    </Screen>
  );
}
