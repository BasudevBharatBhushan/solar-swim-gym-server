import { Request, Response } from 'express';
import servicePackService from '../services/service-pack.service';

export const getServicePacks = async (req: Request, res: Response): Promise<void> => {
    try {
        const serviceId = req.params.serviceId as string;
        if (!serviceId) {
            res.status(400).json({ error: 'Service ID is required' });
            return;
        }

        const packs = await servicePackService.getServicePacksByServiceId(serviceId);
        res.json(packs);
    } catch (err: unknown) {
        console.error('Error in getServicePacks:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export const getServicePackPrices = async (req: Request, res: Response): Promise<void> => {
    try {
        const servicePackId = req.params.servicePackId as string;
         if (!servicePackId) {
            res.status(400).json({ error: 'Service Pack ID is required' });
            return;
        }

        const prices = await servicePackService.getServicePackPrices(servicePackId);
        res.json(prices);
    } catch (err: unknown) {
        console.error('Error in getServicePackPrices:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export const upsertServicePack = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await servicePackService.upsertServicePack(req.body);
        res.json(result);
    } catch (err: unknown) {
        console.error('Error in upsertServicePack:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export const upsertServicePrice = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await servicePackService.upsertServicePrice(req.body);
        res.json(result);
    } catch (err: unknown) {
        console.error('Error in upsertServicePrice:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export default {
    getServicePacks,
    getServicePackPrices,
    upsertServicePack,
    upsertServicePrice
};
