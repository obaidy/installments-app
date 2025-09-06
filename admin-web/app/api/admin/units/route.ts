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
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const complexId = searchParams.get('complex_id');
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Number(searchParams.get('pageSize') || '50');
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseAdmin
      .from('units')
      .select(`
        id,
        name,
        unit_number,
        complex_id,
        user_id,
        autopay_enabled,
        complexes:complexes(id, name, code),
        owner:profiles!units_user_id_fkey(user_id, full_name, email)
      `)
      .order('id', { ascending: false })
      .range(from, to) as any;

    if (complexId) q = q.eq('complex_id', Number(complexId));

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('[admin.units.GET]', e);
    return NextResponse.json({ error: 'INTERNAL', details: e?.message }, { status: 500 });
  }
}

