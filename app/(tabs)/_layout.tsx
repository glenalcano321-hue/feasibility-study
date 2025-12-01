import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#334155',
          
          // --- FIXED HEIGHT CALCULATION ---
          // 60 is the base height of the bar
          // We add insets.bottom so it grows taller to accommodate the system bar
          height: 60 + insets.bottom, 
          
          // --- FIXED PADDING ---
          // 8 is the base padding
          // We add insets.bottom to push the icons UP away from the edge
          paddingBottom: insets.bottom + 8, 
          
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -4,
        },
      }}>

      {/* --- HIDDEN SCREENS --- */}
      <Tabs.Screen
        name="index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="service-intent"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="booking"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />

      {/* --- VISIBLE TABS --- */}

      {/* 1. HOME */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* --- HIDDEN TABS --- */}
      <Tabs.Screen name="shorts" options={{ href: null }} />
      <Tabs.Screen name="add-service" options={{ href: null }} />
      <Tabs.Screen name="subscriptions" options={{ href: null }} />

      {/* 2. YOU (Profile) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}