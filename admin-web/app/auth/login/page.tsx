"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const next = params.get('next') || '/';

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/');
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    // Set cookies for SSR middleware gating
    try {
      const { data: sess } = await supabase.auth.getSession();
      const access = sess.session?.access_token;
      const refresh = sess.session?.refresh_token;
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      if (access) document.cookie = `sb-access-token=${access}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
      if (refresh) document.cookie = `sb-refresh-token=${refresh}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    } catch {}
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) { setError('Login failed'); return; }
    // Require approved status
    const { data: status } = await supabase.from('user_status').select('status').eq('user_id', userId).single();
    if (!status || status.status !== 'approved') { setError('User is not approved yet'); return; }
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
    const role = data?.role as string | undefined;
    if (role === 'admin') {
      router.replace(next || '/');
    } else {
      router.replace('/not-authorized');
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-card text-card-foreground p-6 rounded-lg shadow-card">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <input className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Password</label>
          <input className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="h-9 rounded-md bg-primary text-primary-foreground px-4">Sign in</button>
      </form>
    </main>
  );
}
