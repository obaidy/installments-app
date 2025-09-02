import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/** Admin client for server-side auth checks */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export interface AuthenticatedRequest extends Request {
  user?: User;
}

function getAccessToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieToken = (req as any).cookies?.['sb-access-token'];
  return cookieToken ?? null;
}

/** Optional: attach req.user if a valid token is present */
export async function optionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getAccessToken(req);
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) req.user = user;
    }
  } catch (_) {}
  next();
}

/** Require a logged-in Supabase user */
export async function requireUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = getAccessToken(req);
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  req.user = user;
  next();
}

/** Require role = 'admin' */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireUser(req, res, async () => {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (data?.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });

    next();
  });
}
