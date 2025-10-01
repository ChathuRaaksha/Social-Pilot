import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { User } from '../../models';
import { ApiError } from '../../types';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In development mode, allow requests without authentication
    if (config.nodeEnv === 'development') {
      // Create a mock user for development
      req.user = {
        id: 'dev-user-001',
        email: 'dev@example.com',
        role: 'admin',
        isActive: true
      };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Please authenticate');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const user = await User.findOne({ where: { id: decoded.id, isActive: true } });

    if (!user) {
      throw new ApiError(401, 'Please authenticate');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Please authenticate'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied'));
    }

    next();
  };
};
