import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = {
  uri?: string | null;
  name: string;
  size?: number;
};

export function Avatar({ uri, name, size = 48 }: Props) {
  const { colors, typography } = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.proSoft,
        },
      ]}
    >
      <Text style={[typography.subtitle, { color: colors.pro, fontSize: size * 0.38 }]}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
