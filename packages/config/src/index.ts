export function getSupabaseKeys(): { url: string; anonKey: string } {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
    (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
    (process.env.SUPABASE_URL as string | undefined) ||
    '';
  const anonKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.SUPABASE_ANON_KEY as string | undefined) ||
    '';
  if (!url || !anonKey) throw new Error('Supabase URL/Anon key missing in env');
  return { url, anonKey };
}

export function getPublicAdminBaseUrl(): string {
  return (
    (process.env.EXPO_PUBLIC_ADMIN_WEB_URL as string | undefined) ||
    (process.env.NEXT_PUBLIC_ADMIN_WEB_URL as string | undefined) ||
    ''
  );
}

