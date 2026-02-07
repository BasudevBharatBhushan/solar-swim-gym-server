import { Request, Response } from 'express';
import serviceService from '../services/service.service';
import fs from 'fs';
import path from 'path';

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || req.headers['x-location-id'] || req.query.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    const services = await serviceService.getAllServices(locationId as string);
    res.json(services);
  } catch (err: unknown) {
    console.error('Error in getAllServices:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertService = async (req: Request, res: Response): Promise<void> => {
    console.log("upsertService",req.body);
    try {
        const logPath = path.join(process.cwd(), 'debug_log.txt');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] HIT upsertService with body: ${JSON.stringify(req.body)}\n`);
    console.log("upsertService",req.body);
    const result = await serviceService.upsertService(req.body);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in upsertService:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: 'Service ID is required' });
        return;
    }
    const service = await serviceService.getServiceById(id as string);
    if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
    }
    res.json(service);
  } catch (err: unknown) {
      console.error('Error in getService:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Param is usually :id or :service_id, need to match route definition.
        // Route will be /:service_id/image likely.
        const service_id = (req.params.service_id || req.params.id) as string; 
        
        if (!service_id) {
            res.status(400).json({ error: 'Service ID is required' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        // Validate file type (double check, though multer filter does it)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
             res.status(400).json({ error: 'Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.' });
             return;
        }

        const imageUrl = await serviceService.updateServiceImage(service_id, {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname
        });

        res.json({
            success: true,
            service_id,
            image_url: imageUrl
        });
    } catch (err: any) {
        console.error('Error in uploadImage:', err);
        if (err.message === 'Service not found') {
            res.status(404).json({ error: 'Service not found' });
        } else {
            res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }
};

export default {
  getAllServices,
  upsertService,
  getService,
  uploadImage
};
