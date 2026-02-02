import { Request, Response } from 'express';
import locationService from '../services/location.service';

export const getAllLocations = async (req: Request, res: Response): Promise<void> => {
  console.log('Controller: getAllLocations called');
  try {
    const locations = await locationService.getAllLocations();
    console.log('Controller: fetched locations:', locations?.length);
    res.json(locations);
  } catch (err: any) {
    console.error('Error in getAllLocations:', err);
    console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    res.status(500).json({ 
      error: err.message || 'Unknown error', 
      details: err 
    });
  }
};

export const upsertLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const location = await locationService.upsertLocation(req.body);
    res.json(location);
  } catch (err: any) {
    console.error('Error in upsertLocation:', err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  getAllLocations,
  upsertLocation
};
