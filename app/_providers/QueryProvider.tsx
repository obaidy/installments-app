// app/_providers/QueryProvider.tsx
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

const queryClient = new QueryClient();

function onAppStateChange(status: string) {
  // mark react-query focused when app is active so queries resume/refetch
  focusManager.setFocused(status === 'active');
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
