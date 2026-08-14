import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { geocodeAddress, getCurrentDeviceLocation, mapsUrl } from '@/lib/location';
import { useTheme } from '@/theme/useTheme';

export type LocationValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
};

export function LocationField({ value, onChange }: Props) {
  const { colors, spacing, typography } = useTheme();
  const [checking, setChecking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verified' | 'not-found'>('idle');

  const onVerifyAddress = async () => {
    if (!value.address.trim()) return;
    setChecking(true);
    setStatus('idle');
    try {
      const result = await geocodeAddress(value.address.trim());
      if (result) {
        onChange({ address: result.formattedAddress, latitude: result.latitude, longitude: result.longitude });
        setStatus('verified');
      } else {
        setStatus('not-found');
      }
    } catch {
      setStatus('not-found');
    } finally {
      setChecking(false);
    }
  };

  const onUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await getCurrentDeviceLocation();
      onChange({
        address: location.city ?? value.address,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setStatus('verified');
    } catch {
      setStatus('not-found');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Input
        label="Où"
        value={value.address}
        onChangeText={(text) => {
          onChange({ address: text, latitude: null, longitude: null });
          setStatus('idle');
        }}
        placeholder="Adresse, lieu ou ville"
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label="🔍 Vérifier l'adresse"
            variant="secondary"
            onPress={onVerifyAddress}
            loading={checking}
            disabled={!value.address.trim()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="📍 Ma position" variant="ghost" onPress={onUseCurrentLocation} loading={locating} />
        </View>
      </View>

      {status === 'verified' && value.latitude != null && value.longitude != null ? (
        <Pressable onPress={() => Linking.openURL(mapsUrl(value.latitude!, value.longitude!, value.address))}>
          <Text style={[typography.caption, { color: colors.success }]}>✓ Adresse localisée — ouvrir dans Plans</Text>
        </Pressable>
      ) : status === 'not-found' ? (
        <Text style={[typography.caption, { color: colors.warning }]}>
          Adresse introuvable — elle sera quand même enregistrée telle quelle.
        </Text>
      ) : null}
    </View>
  );
}
