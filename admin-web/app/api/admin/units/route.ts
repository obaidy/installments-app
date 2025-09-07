import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    // Role check using caller session (RLS); if blocked, treat as forbidden
    const { data: roleRow } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (roleRow?.role !== 'admin') {
      // Fallback: role check via service role to avoid RLS recursion issues
      const { data: serverRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (serverRole?.role !== 'admin') {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const complexId = searchParams.get('complex_id');
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Number(searchParams.get('pageSize') || '50');
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseAdmin
      .from('units')
      .select('id, name, unit_number, complex_id, user_id, autopay_enabled')
      .order('id', { ascending: false })
      .range(from, to) as any;

    if (complexId) q = q.eq('complex_id', Number(complexId));

    const { data: units, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Two-step join to avoid dependency on FK names
    const cids = Array.from(new Set((units||[]).map((u:any)=>u.complex_id).filter(Boolean)));
    const uids = Array.from(new Set((units||[]).map((u:any)=>u.user_id).filter(Boolean)));
    const [{ data: complexes }, { data: profiles }] = await Promise.all([
      cids.length ? supabaseAdmin.from('complexes').select('id, name, code').in('id', cids) : Promise.resolve({ data: [] as any[] }),
      uids.length ? supabaseAdmin.from('profiles').select('user_id, full_name, email').in('user_id', uids) : Promise.resolve({ data: [] as any[] }),
    ]);
    const cmap = new Map<number, any>();
    (complexes||[]).forEach((c:any)=>cmap.set(c.id, c));
    const pmap = new Map<string, any>();
    (profiles||[]).forEach((p:any)=>pmap.set(p.user_id, p));
    const rows = (units||[]).map((u:any)=>({
      ...u,
      complexes: cmap.get(u.complex_id) || null,
      owner: u.user_id ? pmap.get(u.user_id) || null : null,
    }));
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    console.error('[admin.units.GET]', e);
    return NextResponse.json({ error: 'INTERNAL', details: e?.message }, { status: 500 });
  }
}
