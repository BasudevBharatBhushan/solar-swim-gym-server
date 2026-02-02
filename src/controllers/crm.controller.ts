import { Request, Response } from 'express';
import crmService from '../services/crm.service';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = (req as any).locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }
    const data = await crmService.getLeads(locationId as string);
    res.json(data);
  } catch (err: any) {
    console.error('Error in getLeads:', err);
    res.status(500).json({ error: err.message });
  }
};

export const upsertLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await crmService.upsertLead(req.body);
    res.json(data);
  } catch (err: any) {
    console.error('Error in upsertLead:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = (req as any).locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }
    const data = await crmService.getAccounts(locationId as string);
    res.json(data);
  } catch (err: any) {
    console.error('Error in getAccounts:', err);
    res.status(500).json({ error: err.message });
  }
};

export const upsertAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await crmService.upsertAccount(req.body);
    res.json(data);
  } catch (err: any) {
    console.error('Error in upsertAccount:', err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  getLeads,
  upsertLead,
  getAccounts,
  upsertAccount
};
