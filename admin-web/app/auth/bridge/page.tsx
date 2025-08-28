"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function Bridge() {
  const router = useRouter();
  const params = useSearchParams();
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    (async () => {
      if (!access_token || !refresh_token) {
        router.replace('/');
        return;
      }
      try {
        await supabase.auth.setSession({ access_token, refresh_token });
        // Set simple cookies for SSR middleware gating
        try {
          const maxAge = 60 * 60 * 24 * 7; // 7 days
          document.cookie = `sb-access-token=${access_token}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${refresh_token}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        } catch {}
        // Determine role and redirect accordingly
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (userId) {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();
          const role = data?.role as string | undefined;
          if (role === 'admin') {
            router.replace('/');
            return;
          }
        }
      } catch (e) {
        // ignore and continue
      }
      router.replace('/not-authorized');
    })();
  }, [access_token, refresh_token, redirect, router]);

  return <p style={{ padding: 16 }}>Signing you in…</p>;
}
