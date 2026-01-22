import { Request, Response, NextFunction } from 'express';
import * as activationService from '../services/activation.service';

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const result = await activationService.validateToken(token as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const activateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password required' });
    }
    const result = await activationService.activateProfile(token, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
