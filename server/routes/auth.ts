import express from 'express';
import { supabaseService } from '../../lib/supabaseServiceClient';

const router = express.Router();

// POST /auth/invite { email, role }
router.post('/invite', async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const inv = await (supabaseService as any).auth.admin.inviteUserByEmail(email);
    const user = inv.data?.user;
    if (!user) return res.status(500).json({ ok: false, error: 'invite failed' });
    // status pending and optional role
    await supabaseService.from('user_status').upsert({ user_id: user.id, status: 'pending' });
    if (role) await supabaseService.from('user_roles').upsert({ user_id: user.id, role });
    await supabaseService.from('profiles').upsert({ user_id: user.id, email });
    return res.json({ ok: true, user_id: user.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'server error' });
  }
});

export default router;

