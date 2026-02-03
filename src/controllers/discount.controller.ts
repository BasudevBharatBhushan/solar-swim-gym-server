import { Request, Response } from 'express';
import discountService from '../services/discount.service';
import { ApiResponse } from '../types';

export const getDiscountCodes = async (req: Request, res: Response) => {
  try {
    const locationId = (req as any).locationId;
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'Location ID is required' });
    }

    const discounts = await discountService.getDiscountCodes(locationId);
    const response: ApiResponse = {
      success: true,
      data: discounts
    };
    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const upsertDiscountCode = async (req: Request, res: Response) => {
  try {
    const locationId = (req as any).locationId;
    const staffId = (req as any).user?.staff_id;
    
    const discountData = {
      ...req.body,
      location_id: locationId,
      staff_id: staffId || req.body.staff_id
    };

    const result = await discountService.upsertDiscountCode(discountData);
    const response: ApiResponse = {
      success: true,
      data: result
    };
    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const validateDiscountCode = async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const locationId = (req as any).locationId;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Discount code is required' });
    }

    const discount = await discountService.getDiscountByCode(code as string, locationId);
    
    if (!discount) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive discount code' });
    }

    return res.json({
      success: true,
      data: discount
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getDiscountCodes,
  upsertDiscountCode,
  validateDiscountCode
};
