import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;

export const SUPABASE_URL = extra?.EXPO_PUBLIC_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
export const STRIPE_SECRET_KEY = extra?.STRIPE_SECRET_KEY as string;