import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// base64url → JSON helper (no external libs)
function decodeJwtPayload(jwt?: string) {
  try {
    if (!jwt) return null;
    const payload = jwt.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      + '==='.slice((payload.length + 3) % 4);
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch { return null; }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const payload = decodeJwtPayload(key);
  const diag = {
    url,
    serviceKeyPresent: Boolean(key),
    serviceKeyLen: key?.length ?? 0,
    jwtRole: payload?.role ?? null,
    jwtRef:  payload?.ref ?? null,
  };

  try {
    if (!url || !key) {
      return res.status(500).json({ ok:false, diag, error:'Missing env' });
    }

    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.from('gl_accounts').select('code').limit(1);
    return res.status(error ? 500 : 200).json({ ok: !error, diag, data, error: error?.message ?? null });
  } catch (e:any) {
    return res.status(500).json({ ok:false, diag, error: e.message });
  }
}
