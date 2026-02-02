import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

export interface JwtPayload {
  staff_id?: string;
  profile_id?: string;
  account_id?: string;
  role?: string;
  location_id: string;
  type: 'staff' | 'user';
}

/**
 * Middleware to verify JWT token and extract user information
 * Sets req.user with the decoded token payload
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } catch (error: unknown) {
    console.error('Error in authenticateToken middleware:', (error as Error).message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * But validates token if present
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded as JwtPayload;
      }
      next();
    });
  } catch {
    // Silently fail for optional auth
    next();
  }
};

export default {
  authenticateToken,
  optionalAuth
};
