import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
    }

    const result = await authService.login(email, password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
