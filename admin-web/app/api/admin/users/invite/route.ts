import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  // Ensure server env is configured (server-only keys)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'ADMIN_ENV_MISSING' }, { status: 500 });
  }
  try {
    const body = await req.json().catch(() => ({} as any));
    const { email, role = 'client', complexes = [] } = body ?? {};

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    // AuthN + admin check using caller session (anon key)
    const sb = createRouteHandlerClient({ cookies });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { data: roleRow } = await sb.from('user_roles').select('role').eq('user_id', user.id).limit(1).maybeSingle();
    if (roleRow?.role !== 'admin') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    // Feature flag to temporarily halt invites
    if (process.env.ADMIN_INVITES_ENABLED === '0') {
      try { await supabaseAdmin.from('email_invite_audit').insert({ email, invited_by: user.id, status: 'skipped', error: 'INVITES_DISABLED' }); } catch {}
      return NextResponse.json({ error: 'INVITES_DISABLED' }, { status: 503 });
    }

    // Invite or get existing user
    let userId: string | undefined;
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : undefined;

        // Server-side email validation & suppression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRegex.test(email)) return NextResponse.json({ error: 'EMAIL_INVALID' }, { status: 400 });
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const blocked = new Set(['example.com','test.com','mailinator.com','tempmail.com','dispostable.com']);
    if (blocked.has(domain)) return NextResponse.json({ error: 'EMAIL_BLOCKED_DOMAIN' }, { status: 400 });
    // Optional MX check
    if (process.env.ADMIN_CHECK_MX === '1') {
      try {
        const dns = await import('node:dns/promises');
        const mx = await dns.resolveMx(domain);
        if (!mx || mx.length === 0) return NextResponse.json({ error: 'EMAIL_NO_MX' }, { status: 400 });
      } catch {}
    }
    // Suppression table check
    try {
      const { data: sup } = await supabaseAdmin.from('email_suppression').select('email, reason').eq('email', email.toLowerCase()).limit(1).maybeSingle();
      if (sup?.email) return NextResponse.json({ error: 'EMAIL_SUPPRESSED', details: sup.reason }, { status: 400 });
    } catch {}
    const inv = await (supabaseAdmin as any).auth.admin.inviteUserByEmail(email, { emailRedirectTo: redirectTo });
    const invited = inv?.data; const inviteErr = inv?.error as any;
    if (invited?.user?.id) {
      userId = invited.user.id;
    } else if (inviteErr && String(inviteErr.message || '').toLowerCase().includes('already')) {
      const found = await (supabaseAdmin as any).auth.admin.getUserByEmail(email);
      if (found?.data?.user?.id) userId = found.data.user.id;
      else return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 400 });
    } else if (inviteErr) {
      try { await supabaseAdmin.from('email_invite_audit').insert({ email, invited_by: user.id, status: 'failed', error: 'INVITE_FAILED', details: inviteErr?.message }); await supabaseAdmin.from('email_suppression').upsert({ email: email.toLowerCase(), reason: 'invite_failed', meta: { details: inviteErr?.message } }); } catch {}\n      return NextResponse.json({ error: 'INVITE_FAILED', details: inviteErr?.message }, { status: 400 });
    }

    if (!userId) return NextResponse.json({ error: 'INVITE_NO_USER_ID' }, { status: 400 });

    // Role + approvals + optional manager complexes
    { const { error } = await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role }); if (error) return NextResponse.json({ error: 'DB_ERROR', step: 'user_roles_upsert', details: error.message }, { status: 500 }); }
    { const { error } = await supabaseAdmin.from('user_status').upsert({ user_id: userId, status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }); if (error) return NextResponse.json({ error: 'DB_ERROR', step: 'user_status_upsert', details: error.message }, { status: 500 }); }
    if (role === 'manager' && Array.isArray(complexes) && complexes.length) {
      const rows = complexes.map((cid: number) => ({ manager_id: userId, complex_id: cid }));
      { const { error } = await supabaseAdmin.from('manager_complexes').upsert(rows); if (error) return NextResponse.json({ error: 'DB_ERROR', step: 'manager_complexes_upsert', details: error.message }, { status: 500 }); }
    }

    try { await supabaseAdmin.from('email_invite_audit').insert({ email, invited_by: user.id, status: 'sent' }); } catch {}\n    return NextResponse.json({ ok: true, user_id: userId });
  } catch (e: any) {
    console.error('[invite]', e); return NextResponse.json({ error: 'INTERNAL', details: e?.message }, { status: 500 });
  }
}








