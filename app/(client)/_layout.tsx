// app/(client)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="units/[id]" />
      {/* IMPORTANT: name must match the actual file path */}
      <Stack.Screen name="units/payments/[ref]" />
    </Stack>
  );
}
