import { Component, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Last-resort catch: without this, any render error (e.g. a corrupted/expired session
// restored from storage) leaves a permanently blank/crashed screen with no way back in.
// Signing out clears the bad persisted session so the app can boot clean on retry.
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App crashed, clearing session and offering reload:', error);
  }

  handleReset = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort — we're already recovering from a crash
    }
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            Un problème est survenu
          </Text>
          <Text style={{ textAlign: 'center', color: '#6B6F80' }}>
            Ta session a peut-être expiré. Appuie pour redémarrer l'app.
          </Text>
          <Button label="Redémarrer" onPress={this.handleReset} />
        </View>
      );
    }
    return this.props.children;
  }
}
