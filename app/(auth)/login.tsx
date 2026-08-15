import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/useTheme';

export default function Login() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/map');
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.title, { color: colors.text }]}>Content de te revoir</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>Connecte-toi à ton compte CREW.</Text>
      </View>

      <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input label="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Button label="Se connecter" onPress={onSubmit} loading={loading} />
      <Button label="Créer un compte" variant="ghost" onPress={() => router.push('/register')} />
    </Screen>
  );
}
