import { Request, Response } from 'express';
import configService from '../services/config.service';

// Helper to get location ID from request
const getLocationId = (req: Request): string | undefined => {
  const locId = req.locationId || req.headers['x-location-id'] || req.query.location_id;
  return locId ? (locId as string) : undefined;
};


export const getAgeGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await configService.getAgeGroups();
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in getAgeGroups:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertAgeGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await configService.upsertAgeGroup(req.body);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in upsertAgeGroup:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const loc = getLocationId(req);
    const data = await configService.getTerms(loc);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in getTerms:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await configService.upsertTerm(req.body);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in upsertTerm:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getWaivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const loc = getLocationId(req);
    const data = await configService.getWaivers(loc);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in getWaivers:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertWaiver = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await configService.upsertWaiver(req.body);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in upsertWaiver:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  getAgeGroups,
  upsertAgeGroup,
  getTerms,
  upsertTerm,
  getWaivers,
  upsertWaiver
};
