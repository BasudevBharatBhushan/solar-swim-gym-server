import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service';

// Mock Auth Middleware should populate req.user
// For now we assume req.headers['x-user-id'] or similar if we don't implement full JWT middleware yet.
// But I should implement JWT middleware.

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.profile_id; // From JWT middleware
    const result = await profileService.getProfile(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = (req as any).user?.account_id;
    const role = (req as any).user?.role;

    if (role !== 'PARENT') {
       // throw new AppError('Unauthorized', 403);
       return res.status(403).json({ message: 'Parent access only' });
    }

    const result = await profileService.getFamilyProfiles(accountId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
