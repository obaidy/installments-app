import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import Ionicons from '@expo/vector-icons/Ionicons';
import { palette, fonts, DesignTokens } from '../../constants/design';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const activeColor = palette[theme].primary;
  const inactiveColor = palette[theme].icon;
  const backgroundColor =
    theme === 'dark'
      ? 'rgba(21, 23, 24, 0.8)'
      : 'rgba(255, 255, 255, 0.8)';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontFamily: fonts.poppinsRegular, fontSize: 12 },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          height: 60,
          borderRadius: DesignTokens.radius.sm * 2,
          marginHorizontal: DesignTokens.spacing.element,
          marginBottom: DesignTokens.spacing.element,
          paddingBottom: 6,
          backgroundColor,
          overflow: 'hidden',
          borderTopWidth: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="paper-plane" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
