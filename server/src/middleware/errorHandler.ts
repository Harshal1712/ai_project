import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Wraps async route handlers so rejected promises reach the error handler
// instead of crashing the process or hanging the request.
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Must be registered last, after all routes.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
