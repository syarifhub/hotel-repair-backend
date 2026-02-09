import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthenticationService';

export interface AuthRequest extends Request {
  admin?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);
    const admin = await authService.validateToken(token);

    if (!admin) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'Invalid or expired session token'
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication Required',
      message: 'Authentication failed'
    });
  }
};
