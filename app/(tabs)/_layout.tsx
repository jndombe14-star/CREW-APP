import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Collaboration', tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" focused={focused} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explorer', tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" focused={focused} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: ({ focused }) => <TabIcon emoji="🎬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Carte', tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
