import 'dotenv/config';
import { Request } from 'express';

export interface TypedRequest<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
  TQuery = Record<string, any>
> extends Request<TParams, any, TBody, TQuery> {}
