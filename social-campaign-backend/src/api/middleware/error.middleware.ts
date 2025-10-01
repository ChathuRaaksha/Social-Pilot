import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../types';
import logger from '../../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false);
  }

  const apiError = error as ApiError;

  logger.error('API Error', {
    statusCode: apiError.statusCode,
    message: apiError.message,
    stack: apiError.stack,
    path: req.path,
    method: req.method,
  });

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      message: apiError.message,
      ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack }),
    },
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};
