import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Require admin session
    const sb = createRouteHandlerClient({ cookies });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const { data: roleRow } = await sb.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleRow?.role !== 'admin') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    const { data: uroles, error } = await supabaseAdmin.from('user_roles').select('user_id, role').eq('role', 'client');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const ids = Array.from(new Set((uroles||[]).map((r:any)=>r.user_id)));
    const { data: profs } = ids.length
      ? await supabaseAdmin.from('profiles').select('user_id, email, full_name').in('user_id', ids)
      : { data: [] as any[] } as any;
    const pmap = new Map<string, any>();
    (profs||[]).forEach((p:any)=>pmap.set(p.user_id, p));
    const rows = (uroles||[]).map((r:any)=>({ id: r.user_id, email: pmap.get(r.user_id)?.email || null, name: pmap.get(r.user_id)?.full_name || null }));
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    console.error('[admin.clients.GET]', e);
    return NextResponse.json({ error: 'INTERNAL', details: e?.message }, { status: 500 });
  }
}

