import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ToastProvider } from '../components/Toast';
import { fonts } from '../constants/design';

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
    <ToastProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName="index">
         <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ToastProvider>
  );
}
