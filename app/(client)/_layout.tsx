// app/(client)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="units/[id]" options={{ title: 'Unit' }} />
      {/* IMPORTANT: name must match the actual file path */}
      <Stack.Screen name="units/payments/[ref]" options={{ title: 'Payment' }} />
    </Stack>
  );
}
