import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    // Require admin session
    const cookieStore = cookies();
    const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); },
      },
    });
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
