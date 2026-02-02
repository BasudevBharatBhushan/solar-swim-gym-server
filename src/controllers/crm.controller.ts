import { Request, Response } from 'express';
import crmService from '../services/crm.service';
import elasticService from '../services/elastic.service';

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

export const searchLeads = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = (req as any).locationId;
        const { q, from, size, sort, order } = req.query;
        const result = await elasticService.searchLeads(
            locationId as string,
            q as string,
            from ? parseInt(from as string) : 0,
            size ? parseInt(size as string) : 10,
            (sort as string) || 'created_at',
            (order as 'asc' | 'desc') || 'desc'
        );
        res.json(result);
    } catch (err: any) {
        console.error('Error in searchLeads:', err);
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

export const reindexLeads = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = (req as any).locationId;
        await crmService.reindexLeads(locationId);
        res.json({ message: 'Leads reindexing started' });
    } catch (err: any) {
        console.error('Error in reindexLeads:', err);
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

export const searchAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = (req as any).locationId;
        const { q, from, size, sort, order } = req.query;
        const result = await elasticService.searchAccounts(
            locationId as string,
            q as string,
            from ? parseInt(from as string) : 0,
            size ? parseInt(size as string) : 10,
            (sort as string) || 'created_at',
            (order as 'asc' | 'desc') || 'desc'
        );
        res.json(result);
    } catch (err: any) {
        console.error('Error in searchAccounts:', err);
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

export const reindexAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = (req as any).locationId;
        await crmService.reindexLeads(locationId);
        await crmService.reindexAccounts(locationId);
        res.json({ message: 'All data reindexing started' });
    } catch (err: any) {
        console.error('Error in reindexAll:', err);
        res.status(500).json({ error: err.message });
    }
};

export default {
  getLeads,
  searchLeads,
  upsertLead,
  reindexLeads,
  getAccounts,
  searchAccounts,
  upsertAccount,
  reindexAll
};
