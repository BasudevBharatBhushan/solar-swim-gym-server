import { Request, Response } from 'express';
import SignedWaiverService from '../services/SignedWaiverService';

export const uploadSignature = async (req: Request, res: Response): Promise<void> => {
  try {
    let buffer: Buffer;
    let originalname: string;
    let mimetype: string;

    if (req.file) {
      // Multipart upload
      buffer = req.file.buffer;
      originalname = req.file.originalname;
      mimetype = req.file.mimetype;
    } else if (req.body.signature_base64) {
      // Base64 upload
      const base64Data = req.body.signature_base64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, 'base64');
      originalname = `signature_${Date.now()}.png`;
      mimetype = 'image/png';
    } else {
      res.status(400).json({ success: false, message: 'No signature file or base64 data provided.' });
      return;
    }

    const signatureUrl = await SignedWaiverService.uploadSignature(buffer, originalname, mimetype);

    res.status(200).json({
      success: true,
      signature_url: signatureUrl
    });
  } catch (error: any) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertSignedWaiver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile_id, waiver_template_id, waiver_type, content, signature_url, signed_waiver_id } = req.body;
    const locationId = req.locationId; // From middleware

    if (!locationId) {
      res.status(400).json({ success: false, message: 'Location context missing.' });
      return;
    }

    // profile_id is optional now to allow saving before profile creation
    if (!waiver_template_id || !waiver_type || !content || !signature_url) {
       res.status(400).json({ success: false, message: 'Missing required fields (waiver_template_id, waiver_type, content, signature_url).' });
       return;
    }

    const data = {
      signed_waiver_id,
      profile_id: profile_id || null,
      waiver_template_id,
      waiver_type,
      content,
      signature_url,
      location_id: locationId
    };

    const result = await SignedWaiverService.upsertSignedWaiver(data);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error upserting signed waiver:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSignedWaivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile_id } = req.query;
    const locationId = req.locationId;

    if (!locationId) {
      res.status(400).json({ success: false, message: 'Location context missing.' });
      return;
    }

    if (!profile_id || typeof profile_id !== 'string') {
      res.status(400).json({ success: false, message: 'Valid profile_id query parameter is required.' });
      return;
    }

    const waivers = await SignedWaiverService.getSignedWaivers(profile_id, locationId);

    res.status(200).json({
      success: true,
      data: waivers
    });
  } catch (error: any) {
    console.error('Error fetching signed waivers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  uploadSignature,
  upsertSignedWaiver,
  getSignedWaivers
};
