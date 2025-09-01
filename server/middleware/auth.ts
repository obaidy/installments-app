import { Response, NextFunction } from 'express';
import { supabaseService } from '../../lib/supabaseServiceClient';
import { TypedRequest } from '../types';

export type AuthedRequest<
  TBody = unknown,
  TParams = Record<string, any>,
  TQuery = Record<string, any>
> = TypedRequest<TBody, TParams, TQuery> & { user?: { id: string } };

export function requireAuth() {
  return async (
    req: AuthedRequest,
    res: Response,
    next: NextFunction,
  ) => {
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

export function requireRole(roles: Array<'admin' | 'manager' | 'accountant'>) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
     if (!req.user)
      return res
        .status(401)
        .json({ ok: false, error: { code: 'UNAUTHORIZED' } });
    interface UserRoleRow {
      role: string | null;
    }
    const { data } = await supabaseService
      .from<UserRoleRow>('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();
    const role = data?.role ?? undefined;
    if (!role || !roles.includes(role as any))
      return res
        .status(403)
        .json({ ok: false, error: { code: 'FORBIDDEN' } });
    next();
  };
}

export async function assertUnitAccess(userId: string, unitId: number) {
  // Owner of unit
  interface UnitRow {
    user_id: string | null;
    complex_id: number | null;
  }
  const { data: u } = await supabaseService
    .from<UnitRow>('units')
    .select('user_id, complex_id')
    .eq('id', unitId)
    .single();
  const ownerId = u?.user_id;
  const complexId = u?.complex_id;
  if (ownerId && ownerId === userId) return true;
  if (complexId) {
    const { data: m } = await supabaseService
      .from<{ manager_id: string }>('manager_complexes')
      .select('manager_id')
      .eq('manager_id', userId)
      .eq('complex_id', complexId)
      .limit(1);
    if ((m ?? []).length) return true;
  }
  return false;
}

