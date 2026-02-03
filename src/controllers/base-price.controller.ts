import { Request, Response } from 'express';
import basePriceService from '../services/base-price.service';

export const getAllBasePrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    const prices = await basePriceService.getAllBasePrices(locationId as string);
    res.json(prices);
  } catch (err: unknown) {
    console.error('Error in getAllBasePrices:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertBasePrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await basePriceService.upsertBasePrice(req.body);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in upsertBasePrice:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  getAllBasePrices,
  upsertBasePrice
};
