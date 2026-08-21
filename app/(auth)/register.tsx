import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

export default function Register() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);

    if (!fullName || !username || !email || !password) {
      setError('Tous les champs sont requis.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    // full_name/username travel as signup metadata and are picked up by a database
    // trigger (handle_new_user) that creates the `profiles` row atomically with the
    // auth.users row itself — a separate client-side insert here could be interrupted
    // (crash, dropped connection) between the two, leaving an unusable orphaned account.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username: username.trim().toLowerCase() } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session || !data.user) {
      setInfo('Compte créé. Vérifie ton email pour confirmer ton adresse, puis connecte-toi.');
      return;
    }

    await useAuthStore.getState().refreshProfile();
    router.replace('/onboarding');
  };

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.title, { color: colors.text }]}>Rejoins CREW</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Crée ton compte pour trouver des pros ou des collaborateurs.
        </Text>
      </View>

      <Input label="Nom complet" value={fullName} onChangeText={setFullName} />
      <Input label="Nom d'utilisateur" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input label="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
      {info ? <Text style={[typography.caption, { color: colors.success }]}>{info}</Text> : null}

      <Button label="Créer mon compte" onPress={onSubmit} loading={loading} />
      <Button label="J'ai déjà un compte" variant="ghost" onPress={() => router.push('/login')} />
    </Screen>
  );
}
