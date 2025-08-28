import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { supabaseService } from '../../lib/supabaseServiceClient';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// CSV expected columns: provider_ref, amount, status, paid_at(optional)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'file required' });
    const text = req.file.buffer.toString('utf8');
    const rows = parse(text, { columns: true, skip_empty_lines: true });

    const results: any[] = [];
    for (const r of rows) {
      const ref = (r.provider_ref || r.reference || r.id || '').toString();
      if (!ref) continue;
      const amt = Number(r.amount || 0);
      const status = (r.status || '').toLowerCase();
      const paid_at = r.paid_at || null;
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
    };
    return res.json({ ok: true, summary, results });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'server error' });
  }
});

export default router;

