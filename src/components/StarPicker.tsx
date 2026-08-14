import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)}>
          <Text style={{ fontSize: 24 }}>{n <= value ? '⭐' : '☆'}</Text>
        </Pressable>
      ))}
    </View>
  );
}
