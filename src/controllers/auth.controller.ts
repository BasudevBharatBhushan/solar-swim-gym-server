import { Request, Response } from 'express';
import authService from '../services/auth.service';

/**
 * Staff Login
 */
export const staffLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = await authService.staffLogin(email, password);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in staffLogin:', err);
    res.status(401).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * User Registration
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      location_id,
      primary_profile,
      family_members
    } = req.body;

    // Validation
    if (!location_id || !primary_profile?.first_name || !primary_profile?.last_name || !primary_profile?.email || !primary_profile?.date_of_birth) {
      res.status(400).json({ 
        error: 'Missing required fields: location_id, primary_profile with first_name, last_name, email, date_of_birth' 
      });
      return;
    }

    const result = await authService.registerUser({
      location_id,
      primary_profile,
      family_members
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for activation link.',
      account_id: result.account_id,
      profile_id: result.profile_id,
      // In production, don't send token in response - only via email
      activation_token: result.activation_token
    });
  } catch (err: unknown) {
    console.error('Error in registerUser:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * Activate Account (Set Password)
 */
export const activateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    const result = await authService.activateAccount(token, password);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in activateAccount:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * Validate Activation Token (GET route)
 */
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = await authService.validateActivationToken(token as string);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in validateToken:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * User/Account Login
 */
export const accountLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = await authService.accountLogin(email, password);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in accountLogin:', err);
    res.status(401).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * Get Activation Token (Testing/Debug endpoint)
 */
export const getActivationToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = await authService.getActivationToken(email);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error in getActivationToken:', err);
    res.status(404).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

/**
 * Create Staff (Admin/SuperAdmin only)
 */
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id, first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await authService.createStaff({
      location_id: location_id || null,
      first_name,
      last_name,
      email,
      password,
      role
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    console.error('Error in createStaff:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  staffLogin,
  registerUser,
  activateAccount,
  validateToken,
  accountLogin,
  getActivationToken,
  createStaff
};


