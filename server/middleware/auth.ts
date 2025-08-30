import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../../lib/supabaseServiceClient';

export type AuthedRequest = Request & { user?: { id: string } };

export function requireAuth() {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED' } });
      const { data, error } = await (supabaseService as any).auth.getUser(token);
      if (error || !data?.user) return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED' } });
      req.user = { id: data.user.id };
      next();
    } catch {
      return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED' } });
    }
  };
}

export function requireRole(roles: Array<'admin'|'manager'|'accountant'>) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED' } });
    const { data } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();
    const role = (data as any)?.role as string | undefined;
    if (!role || !roles.includes(role as any)) return res.status(403).json({ ok: false, error: { code: 'FORBIDDEN' } });
    next();
  };
}

export async function assertUnitAccess(userId: string, unitId: number) {
  // Owner of unit
  const { data: u } = await supabaseService.from('units').select('user_id, complex_id').eq('id', unitId).single();
  const ownerId = (u as any)?.user_id as string | null;
  const complexId = (u as any)?.complex_id as number | null;
  if (ownerId && ownerId === userId) return true;
  if (complexId) {
    const { data: m } = await supabaseService
      .from('manager_complexes')
      .select('manager_id')
      .eq('manager_id', userId)
      .eq('complex_id', complexId)
      .limit(1);
    if ((m as any[])?.length) return true;
  }
  return false;
}

