import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/useNotifications';
import { useTheme } from '@/theme/useTheme';
import type { Notification } from '@/lib/database.types';

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

function targetRoute(notification: Notification): string | null {
  if (!notification.related_id) return null;
  switch (notification.type) {
    case 'booking_requested':
    case 'booking_status_changed':
      return '/bookings';
    case 'application_received':
    case 'application_status_changed':
      return `/collaborations/${notification.related_id}`;
    case 'new_message':
      return `/chat/${notification.related_id}`;
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    markAllRead.mutate();
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <EmptyState icon="🔔" title="Aucune notification" description="Tu seras prévenu ici des nouvelles demandes, candidatures et messages." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!item.read) markRead.mutate(item.id);
              const route = targetRoute(item);
              if (route) router.push(route as never);
            }}
          >
            <Card style={{ gap: 2, backgroundColor: item.read ? colors.surface : colors.proSoft }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.subtitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{timeAgo(item.created_at)}</Text>
              </View>
              {item.body ? (
                <Text style={[typography.body, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.body}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
