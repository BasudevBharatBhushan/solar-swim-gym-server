import { Request, Response } from 'express';
import membershipServiceService from '../services/membership-service.service';

/**
 * Controller for Membership Services
 */
export const getServicesByOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId } = req.params;
    if (!ownerId) {
      res.status(400).json({ error: 'Owner ID required' });
      return;
    }

    const services = await membershipServiceService.getServicesByOwner(ownerId as string);
    res.json(services);
  } catch (err: unknown) {
    console.error('Error in getServicesByOwner:', err);
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
  getServicesByOwner,
  upsertMembershipService
};
