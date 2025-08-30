import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.SUPABASE_URL;
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (!url || !hasServiceKey) {
      return res.status(500).json({ ok: false, env: { url, serviceKey: hasServiceKey ? 'present' : 'missing' } });
    }

    const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await sb.from('gl_accounts').select('code').limit(1);

    return res.status(200).json({
      ok: !error,
      env: { url, serviceKey: 'present' },
      data,
      error: error?.message ?? null,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, env: { url, serviceKey: hasServiceKey ? 'present' : 'missing' }, error: e.message });
  }
}
