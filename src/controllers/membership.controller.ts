import { Request, Response } from 'express';
import membershipService from '../services/membership.service';

export const getAllPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    const programs = await membershipService.getAllPrograms(locationId as string);
    res.json(programs);
  } catch (err: unknown) {
    console.error('Error in getAllPrograms:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await membershipService.upsertProgram(req.body);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in upsertProgram:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Program ID required' });
      return;
    }

    const program = await membershipService.getProgramById(id as string);
    if (!program) {
      res.status(404).json({ error: 'Program not found' });
      return;
    }
    res.json(program);
  } catch (err: unknown) {
    console.error('Error in getProgram:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  getAllPrograms,
  upsertProgram,
  getProgram
};
