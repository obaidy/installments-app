import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';
import { ToastProvider } from '../components/Toast';
import { fonts } from '../constants/design';
import QueryProvider from './_providers/QueryProvider';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Initialize i18n at app start
import '../lib/i18n';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    [fonts.interRegular]: require('../assets/fonts/Inter-Regular.ttf'),
    [fonts.interSemiBold]: require('../assets/fonts/Inter-SemiBold.ttf'),
    [fonts.poppinsRegular]: require('../assets/fonts/Poppins-Regular.ttf'),
    [fonts.poppinsSemiBold]: require('../assets/fonts/Poppins-SemiBold.ttf'),
    [fonts.poppinsBold]: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryProvider>
      <ToastProvider>
        <StripeProvider publishableKey={String(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')}>
          <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="dashboard" />
              {/* Removed old tabs group for unified client UX */}
              {/* Group routes don't need explicit Stack.Screen entries */}
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
          </SafeAreaProvider>
        </StripeProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
