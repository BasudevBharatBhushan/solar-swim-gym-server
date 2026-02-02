import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to set the location context
 * Extracts location_id from various sources and stores it in the request object
 * 
 * Note: Supabase JS client doesn't support PostgreSQL session variables directly.
 * The location_id is stored in req.locationId for use in service layer.
 * Services should use this to filter queries manually or use service role key with RLS.
 */
export const setLocationContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get location_id from multiple sources (in order of priority)
    let locationId = 
      req.headers['x-location-id'] as string ||  // 1. Header
      req.body?.location_id ||                     // 2. Request body
      (req as any).user?.location_id;              // 3. JWT token (set by auth middleware)
    
    if (locationId) {
      // Store in request object for use in controllers/services
      (req as any).locationId = locationId;
      console.log(`✓ Location context set: ${locationId}`);
    } else {
      console.log('⚠ No location_id found in request');
    }
    
    next();
  } catch (error: any) {
    console.error('Error in setLocationContext middleware:', error.message);
    // Don't block the request, just log the error
    next();
  }
};

export default setLocationContext;

