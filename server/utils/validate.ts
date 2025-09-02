import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

function sendValidation(res: Response, parsed: any) {
  const flat = parsed.error.flatten();
  return res.status(400).json({
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      fields: flat.fieldErrors,
      form: flat.formErrors,
    },
  });
}

/** Validate req.body against a Zod schema */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendValidation(res, parsed);
    // attach parsed data for downstream handlers
    (req as any).body = parsed.data;
    next();
  };
}

/** Validate req.params against a Zod schema */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) return sendValidation(res, parsed);
    (req as any).params = parsed.data as Record<string, string>;
    next();
  };
}

/** Validate req.query against a Zod schema */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse((req as any).query);
    if (!parsed.success) return sendValidation(res, parsed);
    (req as any).query = parsed.data as T;
    next();
  };
}
