import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', fields: flat.fieldErrors, form: flat.formErrors } });
    }
    // attach typed data for downstream handlers
    (req as any).data = parsed.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', fields: flat.fieldErrors, form: flat.formErrors } });
    }
    (req as any).paramsData = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', fields: flat.fieldErrors, form: flat.formErrors } });
    }
    (req as any).queryData = parsed.data;
    next();
  };
}
