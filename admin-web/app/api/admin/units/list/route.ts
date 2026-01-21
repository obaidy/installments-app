import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '0');
    const pageSize = Number(url.searchParams.get('pageSize') || '50');
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // AuthN check (RLS enforces admin-only access for units)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      console.error('[units/list] Missing Supabase env in admin-web');
      return NextResponse.json({ error: 'ENV_MISSING_SUPABASE' }, { status: 500 });
    }
    const cookieStore = cookies();
    const sb = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); },
      },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    // Use the caller's session (RLS) instead of service role to avoid env pitfalls
    const { data: units, error: uErr } = await sb
      .from('units')
      .select('id, name, complex_id, user_id, autopay_enabled')
      .order('name')
      .range(from, to);
    if (uErr) {
      console.error('[units/list] units error:', uErr.message);
      return NextResponse.json({ error: `UNITS: ${uErr.message}` }, { status: 500 });
    }

    const complexIds = Array.from(new Set((units||[]).map((u:any)=>u.complex_id).filter(Boolean)));
    const userIds = Array.from(new Set((units||[]).map((u:any)=>u.user_id).filter(Boolean)));

    const [{ data: complexes, error: cErr }, { data: profiles, error: pErr }] = await Promise.all([
      complexIds.length ? sb.from('complexes').select('id, name').in('id', complexIds) : Promise.resolve({ data: [] as any[], error: null as any }),
      userIds.length ? sb.from('profiles').select('user_id, email, full_name').in('user_id', userIds) : Promise.resolve({ data: [] as any[], error: null as any }),
    ]);
    if (cErr) {
      console.error('[units/list] complexes error:', cErr.message);
      return NextResponse.json({ error: `COMPLEXES: ${cErr.message}` }, { status: 500 });
    }
    if (pErr) {
      console.error('[units/list] profiles error:', pErr.message);
      return NextResponse.json({ error: `PROFILES: ${pErr.message}` }, { status: 500 });
    }

    const cmap = new Map<number, string>();
    (complexes||[]).forEach((c:any)=>cmap.set(c.id, c.name));
    const pmap = new Map<string, { email?: string|null; full_name?: string|null }>();
    (profiles||[]).forEach((p:any)=>pmap.set(p.user_id, { email: p.email, full_name: p.full_name }));

    const rows = (units||[]).map((u:any)=>({
      id: u.id as number,
      name: u.name as string,
      complex_id: u.complex_id as number,
      complex: cmap.get(u.complex_id) || undefined,
      user_id: u.user_id as string | null,
      owner: u.user_id ? (pmap.get(u.user_id)?.email || pmap.get(u.user_id)?.full_name) : null,
      autopay: !!u.autopay_enabled,
    }));

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'INTERNAL' }, { status: 500 });
  }
}
