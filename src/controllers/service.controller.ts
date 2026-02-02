import { Request, Response } from 'express';
import serviceService from '../services/service.service';

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = (req as any).locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    const services = await serviceService.getAllServices(locationId as string);
    res.json(services);
  } catch (err: any) {
    console.error('Error in getAllServices:', err);
    res.status(500).json({ error: err.message });
  }
};

export const upsertService = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await serviceService.upsertService(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('Error in upsertService:', err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  getAllServices,
  upsertService
};
