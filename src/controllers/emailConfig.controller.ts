import { Request, Response } from 'express';
import emailConfigService from '../services/emailConfig.service';
import { EmailConfig, ApiResponse } from '../types';

export const getEmailConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = req.locationId; // Assuming middleware populates this

        if (!locationId) {
            const response: ApiResponse = {
                success: false,
                message: 'Location ID not found in request context'
            };
            res.status(400).json(response);
            return;
        }

        const config = await emailConfigService.getEmailConfigByLocationId(locationId);

        const response: ApiResponse<EmailConfig | null> = {
            success: true,
            data: config,
        };
        res.json(response);

    } catch (error: any) {
        const response: ApiResponse = {
            success: false,
            message: error.message || 'Failed to fetch email config',
        };
        res.status(500).json(response);
    }
};

export const upsertEmailConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const locationId = req.locationId;
        const payload: EmailConfig = req.body;

        if (!locationId) {
             const response: ApiResponse = {
                success: false,
                message: 'Location ID not found in request context'
            };
            res.status(400).json(response);
            return;
        }

        // Ensure location_id in payload matches the auth context (security check)
        // Or if superadmin, maybe they can pass it? For now enforce consistency.
        payload.location_id = locationId;

        const updatedConfig = await emailConfigService.upsertEmailConfig(payload);

        const response: ApiResponse<EmailConfig> = {
            success: true,
            data: updatedConfig,
            message: 'Email config saved successfully'
        };
        res.json(response);

    } catch (error: any) {
        const response: ApiResponse = {
            success: false,
            message: error.message || 'Failed to upsert email config',
        };
        res.status(500).json(response);
    }
};

export default {
    getEmailConfig,
    upsertEmailConfig
};
