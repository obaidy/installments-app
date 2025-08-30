import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ user: null });
  const { data: roleRow } = await sb.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ user: { id: user.id, email: user.email }, role: roleRow?.role ?? null });
}
