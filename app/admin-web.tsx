import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabaseClient';
import useAuthorization from '../hooks/useAuthorization';
import { ThemedText } from '../components/ThemedText';

const ADMIN_WEB_URL = process.env.EXPO_PUBLIC_ADMIN_WEB_URL;

export default function AdminWeb() {
  const { authorized, loading } = useAuthorization('admin');
  const [url, setUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      if (!authorized) return;
      const { data } = await supabase.auth.getSession();
      const access = data.session?.access_token;
      const refresh = data.session?.refresh_token;
      if (!ADMIN_WEB_URL) return;
      const base = new URL(ADMIN_WEB_URL);
      // Dev helpers: map localhost to platform-friendly hosts
      if (base.hostname === 'localhost') {
        if (Platform.OS === 'android') base.hostname = '10.0.2.2';
        if (Platform.OS === 'ios') base.hostname = '127.0.0.1';
      }
      const target = new URL('/auth/bridge', base);
      if (access && refresh) {
        target.searchParams.set('access_token', access);
        target.searchParams.set('refresh_token', refresh);
        target.searchParams.set('redirect', '/');
      }
      setUrl(target.toString());
    })();
  }, [authorized]);

  if (!authorized && !loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  if (loading || !url) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: url }}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      )}
      allowsInlineMediaPlayback
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
