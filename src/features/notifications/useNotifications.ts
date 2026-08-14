import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/lib/database.types';

export function useNotifications() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const queryKey = ['notifications', userId];

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          queryClient.setQueryData<Notification[]>(queryKey, (current) => [
            payload.new as Notification,
            ...(current ?? []),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return query;
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}
