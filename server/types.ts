import { Request } from 'express';

export interface TypedRequest<TBody = unknown, TParams = Record<string, any>, TQuery = Record<string, any>> extends Request<TParams, any, TBody, TQuery> {}