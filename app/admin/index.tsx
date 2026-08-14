import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAllReports, usePlatformStats } from '@/features/admin/useAdminData';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

function StatTile({ label, value }: { label: string; value: number }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 100,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: 2,
      }}
    >
      <Text style={[typography.title, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const { colors, spacing, typography } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: reports, isLoading: reportsLoading } = useAllReports();

  if (!profile?.is_admin) {
    return (
      <Screen>
        <EmptyState icon="🔒" title="Accès refusé" description="Cette section est réservée aux administrateurs." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {statsLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatTile label="Utilisateurs" value={stats?.profiles ?? 0} />
          <StatTile label="Profils PRO" value={stats?.proProfiles ?? 0} />
          <StatTile label="Profils Collab" value={stats?.creatorProfiles ?? 0} />
          <StatTile label="Réservations" value={stats?.bookings ?? 0} />
          <StatTile label="Collaborations" value={stats?.collaborations ?? 0} />
          <StatTile label="Signalements" value={stats?.reports ?? 0} />
        </View>
      )}

      <Text style={[typography.subtitle, { color: colors.text }]}>Signalements</Text>

      {reportsLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (reports ?? []).length === 0 ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>Aucun signalement.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {reports!.map((report) => (
            <Card key={report.id} style={{ gap: spacing.xs }}>
              <Text style={[typography.body, { color: colors.text }]}>
                {report.reporter?.full_name ?? '?'} a signalé {report.reported?.full_name ?? '?'}
              </Text>
              <Text style={[typography.label, { color: colors.danger }]}>{report.reason}</Text>
              {report.details ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>{report.details}</Text>
              ) : null}
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {new Date(report.created_at).toLocaleString('fr-FR')}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
