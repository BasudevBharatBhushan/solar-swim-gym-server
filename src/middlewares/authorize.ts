import { Request, Response, NextFunction } from 'express';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'user';
export type UserType = 'staff' | 'user';

export interface AuthUser {
  // Staff fields
  staff_id?: string;
  role?: UserRole;
  
  // User fields
  profile_id?: string;
  account_id?: string;
  
  // Common fields
  location_id: string;
  type: UserType;
}

/**
 * Middleware to check if user is authenticated
 * Must be used after authenticateToken middleware
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthUser;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  next();
};

/**
 * Middleware to check if user has required role(s)
 * Roles are hierarchical: SUPERADMIN > ADMIN > STAFF > user
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // SuperAdmin has access to everything
    if (user.type === 'staff' && user.role === 'SUPERADMIN') {
      next();
      return;
    }
    
    // Check if user's role is in allowed roles
    const userRole = user.type === 'user' ? 'user' : user.role;
    
    if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware to check if user is SuperAdmin
 */
export const requireSuperAdmin = requireRole('SUPERADMIN');

/**
 * Middleware to check if user is Admin or SuperAdmin
 */
export const requireAdmin = requireRole('SUPERADMIN', 'ADMIN');

/**
 * Middleware to check if user is Staff (any staff role) or SuperAdmin
 */
export const requireStaff = requireRole('SUPERADMIN', 'ADMIN', 'STAFF');

/**
 * Middleware to validate location access
 * SuperAdmin can access all locations
 * Admin/Staff can only access their assigned location
 * Users can only access their account's location
 */
export const validateLocationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthUser;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // SuperAdmin has access to all locations
  if (user.type === 'staff' && user.role === 'SUPERADMIN') {
    next();
    return;
  }
  
  // Get requested location_id from various sources
  const requestedLocationId = 
    req.params.location_id ||
    req.body?.location_id ||
    req.query?.location_id ||
    req.headers['x-location-id'];
  
  // If no specific location requested, allow (will use user's location)
  if (!requestedLocationId) {
    next();
    return;
  }
  
  // Check if user has access to requested location
  if (requestedLocationId !== user.location_id) {
    res.status(403).json({ 
      error: 'Access denied to this location',
      userLocation: user.location_id,
      requestedLocation: requestedLocationId
    });
    return;
  }
  
  next();
};

export default {
  requireAuth,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  validateLocationAccess
};
