import { Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { PortfolioItem } from '@/lib/database.types';

type Props = {
  item: PortfolioItem;
  size?: number;
};

export function PortfolioThumbnail({ item, size = 100 }: Props) {
  if (item.media_type === 'video') {
    return <VideoThumbnail uri={item.media_url} size={size} />;
  }

  return <Image source={{ uri: item.media_url }} style={[styles.media, { width: size, height: size }]} />;
}

function VideoThumbnail({ uri, size }: { uri: string; size: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={[styles.media, { width: size, height: size }]}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  media: {
    borderRadius: 8,
  },
});
