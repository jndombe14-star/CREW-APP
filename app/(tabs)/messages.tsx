import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useConversations } from '@/features/messaging/useConversations';
import { useTheme } from '@/theme/useTheme';

export default function Messages() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();

  return (
    <Screen>
      <Text style={[typography.title, { color: colors.text, marginBottom: spacing.md }]}>Messages</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="Aucune conversation"
              description="Contacte un professionnel ou un créateur depuis Explorer pour démarrer une discussion."
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/chat/${item.conversation_id}`)}>
              <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Avatar name={item.other_full_name} uri={item.other_avatar_url} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{item.other_full_name}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.last_message ?? 'Dis bonjour 👋'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
