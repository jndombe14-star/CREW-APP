import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { FavoriteWithJoins } from '@/lib/database.types';

export function useMyFavorites() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['favorites', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, profiles(*), collaborations(*)')
        .eq('owner_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FavoriteWithJoins[];
    },
  });
}

export function useIsFavoriteProfile(profileId: string | undefined) {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['is-favorite-profile', userId, profileId],
    enabled: !!userId && !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('owner_id', userId as string)
        .eq('favorited_profile_id', profileId as string)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
}

export function useIsFavoriteCollaboration(collaborationId: string | undefined) {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['is-favorite-collaboration', userId, collaborationId],
    enabled: !!userId && !!collaborationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('owner_id', userId as string)
        .eq('favorited_collaboration_id', collaborationId as string)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
}

export function useToggleFavoriteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, favoriteId }: { profileId: string; favoriteId: string | null }) => {
      const ownerId = useAuthStore.getState().session?.user.id;
      if (!ownerId) throw new Error('Not authenticated');

      if (favoriteId) {
        const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorites').insert({ owner_id: ownerId, favorited_profile_id: profileId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite-profile'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useToggleFavoriteCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collaborationId, favoriteId }: { collaborationId: string; favoriteId: string | null }) => {
      const ownerId = useAuthStore.getState().session?.user.id;
      if (!ownerId) throw new Error('Not authenticated');

      if (favoriteId) {
        const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ owner_id: ownerId, favorited_collaboration_id: collaborationId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite-collaboration'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
