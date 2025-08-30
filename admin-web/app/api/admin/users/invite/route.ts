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

    const { data: roleRow } = await sb.from('user_roles').select('role').eq('user_id', user.id).single();
    if (roleRow?.role !== 'admin') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    // Invite or get existing user
    let userId: string | undefined;
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : undefined;

    const inv = await (supabaseAdmin as any).auth.admin.inviteUserByEmail(email, { emailRedirectTo: redirectTo });
    const invited = inv?.data; const inviteErr = inv?.error as any;
    if (invited?.user?.id) {
      userId = invited.user.id;
    } else if (inviteErr && String(inviteErr.message || '').toLowerCase().includes('already')) {
      const found = await (supabaseAdmin as any).auth.admin.getUserByEmail(email);
      if (found?.data?.user?.id) userId = found.data.user.id;
      else return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 400 });
    } else if (inviteErr) {
      return NextResponse.json({ error: 'INVITE_FAILED', details: inviteErr?.message }, { status: 400 });
    }

    if (!userId) return NextResponse.json({ error: 'INVITE_NO_USER_ID' }, { status: 400 });

    // Role + approvals + optional manager complexes
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role });
    await supabaseAdmin.from('user_status').upsert({ user_id: userId, status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
    if (role === 'manager' && Array.isArray(complexes) && complexes.length) {
      const rows = complexes.map((cid: number) => ({ manager_id: userId, complex_id: cid }));
      await supabaseAdmin.from('manager_complexes').upsert(rows);
    }

    return NextResponse.json({ ok: true, user_id: userId });
  } catch (e: any) {
    console.error('[invite]', e); return NextResponse.json({ error: 'INTERNAL', details: e?.message }, { status: 500 });
  }
}


