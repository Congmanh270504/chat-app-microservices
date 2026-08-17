import { HttpError } from '@chatapp/common';

import type { ErrorRequestHandler } from 'express';
import { logger } from '@/utils/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err }, 'Unhandled error occurred');

  const statusCode =
    err instanceof HttpError
      ? err.statusCode
      : typeof err?.statusCode === 'number'
        ? err.statusCode
        : typeof err?.status === 'number'
          ? err.status
          : 500;

  const message = err?.message || (statusCode >= 500 ? 'Internal Server Error' : 'Unknown Error');
  const payload = err?.details ? { message, details: err.details } : { message };

  res.status(statusCode).json(payload);

  void _next();
};
