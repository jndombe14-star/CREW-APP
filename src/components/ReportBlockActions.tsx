import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useBlockUser, useIsBlocked, useUnblockUser } from '@/features/trust-safety/useBlocking';
import { useReportUser } from '@/features/trust-safety/useReport';
import { useTheme } from '@/theme/useTheme';

const REPORT_REASONS = ['Comportement inapproprié', 'Faux profil', 'Arnaque', 'Contenu offensant', 'Autre'];

export function ReportBlockActions({ profileId }: { profileId: string }) {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: isBlocked } = useIsBlocked(profileId);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const reportUser = useReportUser();

  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const onSubmitReport = async () => {
    if (!reason) return;
    await reportUser.mutateAsync({ reportedProfileId: profileId, reason, details: details.trim() || null });
    setReportSent(true);
    setShowReport(false);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
        <Pressable onPress={() => setShowReport((v) => !v)}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>🚩 Signaler</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            if (isBlocked) {
              await unblockUser.mutateAsync(profileId);
            } else {
              await blockUser.mutateAsync(profileId);
              router.back();
            }
          }}
        >
          <Text style={[typography.caption, { color: colors.danger }]}>
            {isBlocked ? '✓ Débloquer' : '🚫 Bloquer'}
          </Text>
        </Pressable>
      </View>

      {reportSent ? (
        <Text style={[typography.caption, { color: colors.success, textAlign: 'center' }]}>
          Signalement envoyé, merci.
        </Text>
      ) : null}

      {showReport ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
            {REPORT_REASONS.map((r) => (
              <Pressable key={r} onPress={() => setReason(r)}>
                <Badge label={r} tone={reason === r ? 'collab' : 'neutral'} />
              </Pressable>
            ))}
          </View>
          <Input placeholder="Détails (optionnel)" value={details} onChangeText={setDetails} />
          <Button
            label="Envoyer le signalement"
            variant="secondary"
            onPress={onSubmitReport}
            loading={reportUser.isPending}
            disabled={!reason}
          />
        </View>
      ) : null}
    </View>
  );
}
