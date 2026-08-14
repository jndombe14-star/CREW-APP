import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useMyCollaborations } from '@/features/collaborations/useCollaborations';
import { useMyApplications } from '@/features/collaborations/useApplications';
import { useTheme } from '@/theme/useTheme';

type Tab = 'published' | 'applied';

export default function MyCollaborations() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('published');
  const published = useMyCollaborations();
  const applied = useMyApplications();

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label="Publiées" variant={tab === 'published' ? 'primary' : 'secondary'} onPress={() => setTab('published')} />
        <Button label="Candidatures" variant={tab === 'applied' ? 'primary' : 'secondary'} onPress={() => setTab('applied')} />
      </View>

      {tab === 'published' ? (
        published.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (published.data ?? []).length === 0 ? (
          <EmptyState icon="📋" title="Aucune collaboration publiée" description="Publie ton premier projet depuis Explorer." />
        ) : (
          <View style={{ gap: spacing.md }}>
            {published.data!.map((collab) => (
              <Pressable key={collab.id} onPress={() => router.push(`/collaborations/${collab.id}`)}>
                <Card style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.subtitle, { color: colors.text }]}>{collab.title}</Text>
                    <Badge label={collab.status} tone={collab.status === 'open' ? 'success' : 'neutral'} />
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : applied.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (applied.data ?? []).length === 0 ? (
        <EmptyState icon="🤝" title="Aucune candidature envoyée" description="Manifeste ton intérêt pour un projet depuis Explorer." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {applied.data!.map((application) => (
            <Pressable key={application.id} onPress={() => router.push(`/collaborations/${application.collaboration_id}`)}>
              <Card style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.subtitle, { color: colors.text }]}>{application.collaborations?.title}</Text>
                  <Badge
                    label={application.status === 'pending' ? 'En attente' : application.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                    tone={application.status === 'accepted' ? 'success' : 'neutral'}
                  />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
