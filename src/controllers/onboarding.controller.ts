import { Request, Response, NextFunction } from 'express';
import * as onboardingService from '../services/onboarding.service';

export const completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await onboardingService.completeOnboarding(req.body);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
