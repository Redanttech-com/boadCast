import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === "dark" ? "#fff" : "#1F2937",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1F2937" : "#fff",
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "National",
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe-sharp" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="county"
        options={{
          title: "County",
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="constituency"
        options={{
          title: "Constituency",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="flag" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ward"
        options={{
          title: "Ward",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="map-pin" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
