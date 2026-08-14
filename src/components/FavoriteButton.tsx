import { Pressable, Text } from 'react-native';
import {
  useIsFavoriteCollaboration,
  useIsFavoriteProfile,
  useToggleFavoriteCollaboration,
  useToggleFavoriteProfile,
} from '@/features/favorites/useFavorites';

type Props = { profileId: string } | { collaborationId: string };

export function FavoriteButton(props: Props) {
  const isProfile = 'profileId' in props;

  const profileFavorite = useIsFavoriteProfile(isProfile ? props.profileId : undefined);
  const collabFavorite = useIsFavoriteCollaboration(!isProfile ? props.collaborationId : undefined);
  const toggleProfile = useToggleFavoriteProfile();
  const toggleCollab = useToggleFavoriteCollaboration();

  const favoriteId = isProfile ? profileFavorite.data : collabFavorite.data;
  const isPending = isProfile ? toggleProfile.isPending : toggleCollab.isPending;

  const onToggle = () => {
    if (isProfile) {
      toggleProfile.mutate({ profileId: props.profileId, favoriteId: favoriteId ?? null });
    } else {
      toggleCollab.mutate({ collaborationId: props.collaborationId, favoriteId: favoriteId ?? null });
    }
  };

  return (
    <Pressable onPress={onToggle} disabled={isPending} hitSlop={8}>
      <Text style={{ fontSize: 24 }}>{favoriteId ? '❤️' : '🤍'}</Text>
    </Pressable>
  );
}
