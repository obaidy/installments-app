import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';
import { ToastProvider } from '../components/Toast';
import { fonts } from '../constants/design';
import { QueryProvider } from './_providers/QueryProvider';
import { StripeProvider } from '@stripe/stripe-react-native';

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
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack initialRouteName="index">
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Group routes don't need explicit Stack.Screen entries */}
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </StripeProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
