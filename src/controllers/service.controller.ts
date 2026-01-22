import { Request, Response, NextFunction } from 'express';
import * as serviceService from '../services/service.service';

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Services are public or protected? Docs say "Read-only from frontend". 
    // Usually public for onboarding.
    const services = await serviceService.getAllServices();
    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};
