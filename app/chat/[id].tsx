import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useMessages } from '@/features/messaging/useMessages';
import { useSendMessage } from '@/features/messaging/useSendMessage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import type { Message, Profile } from '@/lib/database.types';

function useOtherParticipant(conversationId: string | undefined) {
  const myId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['conversation-other-participant', conversationId],
    enabled: !!conversationId && !!myId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('profile_id, profiles(*)')
        .eq('conversation_id', conversationId as string)
        .neq('profile_id', myId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as { profiles: Profile } | null)?.profiles ?? null;
    },
  });
}

export default function Chat() {
  const { colors, spacing, radius, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useAuthStore((s) => s.session?.user.id);
  const { data: messages, isLoading } = useMessages(id);
  const { data: otherParticipant } = useOtherParticipant(id);
  const sendMessage = useSendMessage(id ?? '');
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const onSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    await sendMessage.mutateAsync(content);
    listRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen>
        {otherParticipant ? (
          <Text style={[typography.subtitle, { color: colors.text, marginBottom: spacing.sm }]}>
            {otherParticipant.full_name}
          </Text>
        ) : null}

        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = item.sender_id === myId;
            return (
              <View
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  backgroundColor: isMine ? colors.primary : colors.surfaceAlt,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  maxWidth: '80%',
                }}
              >
                <Text style={[typography.body, { color: isMine ? colors.primaryText : colors.text }]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
                Dis bonjour 👋
              </Text>
            ) : null
          }
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', paddingTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Message…" value={draft} onChangeText={setDraft} onSubmitEditing={onSend} />
          </View>
          <Pressable
            onPress={onSend}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.full,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 18 }}>➤</Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
