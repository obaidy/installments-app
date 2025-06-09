import 'dotenv/config';
export default {
  expo: {
    name: "installments-app",
    slug: "installments-app",
    version: "1.0.0",
    scheme: "installments-app",
    extra: {
      // Expo Router requires PUBLIC prefix
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_STRIPE_SECRET_KEY: process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY,
    },
  },
};
  