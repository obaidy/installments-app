import { Router } from 'express';
import { optionalUser, requireUser, requireAdmin, type AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../../lib/supabaseServiceClient';

const router = Router();

/**
 * GET /auth/me
 * Returns current user (if any) plus role & approval status.
 * Send Authorization: Bearer <access_token> or sb-access-token cookie.
 */
router.get('/me', optionalUser, async (req: AuthenticatedRequest, res) => {
  const u = req.user;
  if (!u) return res.json({ user: null });

  const [{ data: roleRow, error: rErr }, { data: statusRow, error: sErr }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', u.id).maybeSingle(),
    supabase.from('user_status').select('status').eq('user_id', u.id).maybeSingle(),
  ]);
  if (rErr || sErr) {
    return res.status(500).json({ error: rErr?.message || sErr?.message || 'lookup failed' });
  }

  return res.json({
    user: { id: u.id, email: u.email },
    role: roleRow?.role ?? null,
    status: statusRow?.status ?? null,
  });
});

/** Requires any logged-in user */
router.get('/ping', requireUser, (_req, res) => {
  res.json({ ok: true, auth: 'user' });
});

/** Requires admin role */
router.get('/admin/ping', requireAdmin, (_req, res) => {
  res.json({ ok: true, auth: 'admin' });
});

export default router;
