import { Request, Response } from 'express';
import membershipServiceService from '../services/membership-service.service';

/**
 * Controller for Membership Services
 */
export const getBasePlanServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    const services = await membershipServiceService.getBasePlanServices(locationId as string);
    res.json(services);
  } catch (err: unknown) {
    console.error('Error in getBasePlanServices:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertMembershipService = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await membershipServiceService.upsertMembershipService(req.body);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in upsertMembershipService:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  getBasePlanServices,
  upsertMembershipService
};
