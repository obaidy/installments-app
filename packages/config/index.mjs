export function getSupabaseKeys() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!url || !anonKey) {
    throw new Error('Supabase URL/Anon key missing in env');
  }
  return { url, anonKey };
}

export function getPublicAdminBaseUrl() {
  const url = process.env.EXPO_PUBLIC_ADMIN_WEB_URL || process.env.NEXT_PUBLIC_ADMIN_WEB_URL || '';
  return url;
}

