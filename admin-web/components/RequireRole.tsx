"use client";
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export function RequireRole({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // Skip checking under /auth
      if (pathname?.startsWith('/auth')) {
        setChecking(false);
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        const next = pathname && pathname !== '/auth/login' ? `?next=${encodeURIComponent(pathname)}` : '';
        router.replace(`/auth/login${next}`);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      const role = data?.role as string | undefined;
      if (!role || !allowed.includes(role)) {
        router.replace('/not-authorized');
        return;
      }
      setChecking(false);
    })();
  }, [pathname, allowed, router]);

  if (checking) return <div style={{ padding: 16 }}>Loading…</div>;
  return <>{children}</>;
}
