import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { supabaseService } from '../../lib/supabaseServiceClient';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// CSV expected columns: provider_ref, amount, status, paid_at(optional)
router.post('/upload', requireAuth(), requireRole(['admin','accountant']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'file required' });
    const text = req.file.buffer.toString('utf8');
    const rows = parse(text, { columns: true, skip_empty_lines: true });

    const rowSchema = z.object({
      provider_ref: z.string().or(z.number().transform(String)),
      amount: z.coerce.number(),
      status: z.string(),
      paid_at: z.string().datetime().optional().or(z.literal('')).optional(),
    }).passthrough();

    const results: any[] = [];
    const invalid: any[] = [];
    for (const r of rows) {
      const parsed = rowSchema.safeParse(r);
      if (!parsed.success) {
        invalid.push({ row: r, error: parsed.error.flatten() });
        continue;
      }
      const row = parsed.data as any;
      const ref = (row.provider_ref || (r as any).reference || (r as any).id || '').toString();
      if (!ref) continue;
      const amt = Number(row.amount || 0);
      const status = (row.status || '').toLowerCase();
      const paid_at = row.paid_at || null;
      const { data: pay } = await supabaseService
        .from('payments')
        .select('id, amount, status, provider_ref, paid_at')
        .eq('provider_ref', ref)
        .maybeSingle();
      if (!pay) {
        results.push({ ref, type: 'missing', csv: { amount: amt, status, paid_at } });
        continue;
      }
      const dbAmt = Number((pay as any).amount || 0);
      const dbStatus = (pay as any).status;
      const dbPaidAt = (pay as any).paid_at;
      const diff = {
        amountMismatch: dbAmt !== amt,
        statusMismatch: dbStatus?.toLowerCase() !== status,
        paidAtMismatch: paid_at && dbPaidAt && new Date(paid_at).toISOString() !== new Date(dbPaidAt).toISOString(),
      };
      results.push({ ref, type: 'matched', db: pay, csv: { amount: amt, status, paid_at }, diff });
    }
    const summary = {
      matched: results.filter(r => r.type === 'matched').length,
      missing: results.filter(r => r.type === 'missing').length,
      mismatched: results.filter(r => r.type === 'matched' && (r.diff.amountMismatch || r.diff.statusMismatch || r.diff.paidAtMismatch)).length,
      invalid: invalid.length,
    };
    return res.json({ ok: true, summary, results, invalid });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'server error' });
  }
});

export default router;

