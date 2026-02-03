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
    const locationId = 
      req.headers['x-location-id'] as string ||  // 1. Header
      req.body?.location_id ||                     // 2. Request body
      req.user?.location_id;              // 3. JWT token (set by auth middleware)
    
    if (locationId) {
      // Store in request object for use in controllers/services
      req.locationId = locationId;
      console.log(`✓ Location context set: ${locationId} (Source: ${req.headers['x-location-id'] ? 'Header' : req.body?.location_id ? 'Body' : 'JWT'})`);
      if (req.user) console.log(`  User Type: ${req.user.type}, User Loc: ${req.user.location_id}`);

      // Attempt to set session variable in Postgres (for RLS)
      try {
        await (await import('../config/db')).default.rpc('set_config', { 
            name: 'app.current_location_id', 
            value: locationId, 
            is_local: false 
        });
      } catch (err) {
        // Fallback or ignore if rpc fails (it might if not defined)
      }
    } else {
      console.log('⚠ No location_id found in request');
    }
    
    next();
  } catch (error: unknown) {
    console.error('Error in setLocationContext middleware:', (error as Error).message);
    // Don't block the request, just log the error
    next();
  }
};

export default setLocationContext;

