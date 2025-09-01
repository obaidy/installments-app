import { ZodSchema } from 'zod';
import { Response, NextFunction } from 'express';
import { TypedRequest } from '../types';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (
    req: TypedRequest<T>,
    res: Response,
    next: NextFunction,
  ) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res
        .status(400)
        .json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            fields: flat.fieldErrors,
            form: flat.formErrors,
          },
        });
    }
    // attach typed data for downstream handlers
     req.body = parsed.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {return (
    req: TypedRequest<any, T>,
    res: Response,
    next: NextFunction,
  ) => {return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res
        .status(400)
        .json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            fields: flat.fieldErrors,
            form: flat.formErrors,
          },
        });
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (
    req: TypedRequest<any, any, T>,
    res: Response,
    next: NextFunction,
  ) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res
        .status(400)
        .json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            fields: flat.fieldErrors,
            form: flat.formErrors,
          },
        });
    }
    req.query = parsed.data as typeof req.query;
    next();
  };
}
