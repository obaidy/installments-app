import express from 'express';
import { z } from 'zod';
import { validateBody } from '../utils/validate';
import { supabaseService } from '../../lib/supabaseServiceClient';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin','manager','accountant','client']).optional(),
});

// POST /auth/invite { email, role }
router.post('/invite', requireAuth(), requireRole(['admin']), validateBody(inviteSchema), async (req, res) => {
  try {
    const { email, role } = (req as any).data as z.infer<typeof inviteSchema>;
    const inv = await (supabaseService as any).auth.admin.inviteUserByEmail(email);
    const user = inv.data?.user;
    if (!user) return res.status(500).json({ ok: false, error: { code: 'INVITE_FAILED' } });
    // status pending and optional role
    await supabaseService.from('user_status').upsert({ user_id: user.id, status: 'pending' });
    if (role) await supabaseService.from('user_roles').upsert({ user_id: user.id, role });
    await supabaseService.from('profiles').upsert({ user_id: user.id, email });
    return res.json({ ok: true, user_id: user.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
  }
});

export default router;

