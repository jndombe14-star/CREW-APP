import { Linking, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = {
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
};

// Just links to the public profile page — no OAuth. Real account linking would need
// developer app registration on each platform, deliberately out of scope for now (see
// README's "What's NOT built yet").
export function SocialLinks({ instagramHandle, tiktokHandle }: Props) {
  const { spacing, typography } = useTheme();

  if (!instagramHandle && !tiktokHandle) return null;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {instagramHandle ? (
        <Pressable onPress={() => Linking.openURL(`https://instagram.com/${instagramHandle}`)}>
          <Text style={[typography.body, { color: '#C13584' }]}>📷 @{instagramHandle}</Text>
        </Pressable>
      ) : null}
      {tiktokHandle ? (
        <Pressable onPress={() => Linking.openURL(`https://tiktok.com/@${tiktokHandle}`)}>
          <Text style={[typography.body, { color: '#000000' }]}>🎵 @{tiktokHandle}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
