import { Request, Response } from 'express';
import waiverTemplateService from '../services/waiver-template.service';
import { ApiResponse } from '../types';

export const getWaiverTemplates = async (req: Request, res: Response) => {
  try {
    const locationId = (req as any).locationId;
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'Location ID is required' });
    }

    const templates = await waiverTemplateService.getWaiverTemplates(locationId);
    const response: ApiResponse = {
      success: true,
      data: templates
    };
    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getWaiverTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const locationId = (req as any).locationId;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Waiver Template ID is required' });
    }

    const template = await waiverTemplateService.getWaiverTemplateById(id as string, locationId as string);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Waiver Template not found' });
    }

    const response: ApiResponse = {
      success: true,
      data: template
    };
    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const upsertWaiverTemplate = async (req: Request, res: Response) => {
  try {
    const locationId = (req as any).locationId;
    
    const templateData = {
      ...req.body,
      location_id: locationId
    };

    const result = await waiverTemplateService.upsertWaiverTemplate(templateData);
    const response: ApiResponse = {
      success: true,
      data: result
    };
    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getWaiverTemplates,
  getWaiverTemplateById,
  upsertWaiverTemplate
};
