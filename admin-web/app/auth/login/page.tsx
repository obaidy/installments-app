'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If already logged in, bounce to home
    (async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) router.replace('/');
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1) Sign in
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // (Optional) ensure default role row exists for older accounts
      try { await supabaseBrowser.rpc('ensure_client_role'); } catch {}

      // 2) Fetch role + approval (RLS must allow self-read)
      const [{ data: statusRow, error: sErr }, { data: roleRow, error: rErr }] = await Promise.all([
        supabaseBrowser.from('user_status').select('status').maybeSingle(),
        supabaseBrowser.from('user_roles').select('role').maybeSingle(),
      ]);
      if (sErr) throw sErr;
      if (rErr) throw rErr;

      const status = statusRow?.status ?? 'pending';
      const role = (roleRow?.role as string | undefined) ?? 'client';

      if (status !== 'approved') {
        setError('Your account is pending approval.');
        setLoading(false);
        return;
      }

      // 3) Redirect: admins to requested page; others to not-authorized (adjust as you like)
      if (role === 'admin') router.replace(next);
      else router.replace('/not-authorized');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setLoading(false);
    }
  }

  async function onMagicLink(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : undefined;
      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setError('Check your email for the login link.');
    } catch (err: any) {
      setError(err?.message || 'Could not send magic link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-card text-card-foreground p-6 rounded-lg shadow-card">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <input
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Password</label>
          <input
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-9 w-full rounded-md bg-primary text-primary-foreground px-4"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="text-center">
          <a href="#" onClick={onMagicLink} className="text-sm underline">
            Send magic link instead
          </a>
        </div>
      </form>
    </main>
  );
}
