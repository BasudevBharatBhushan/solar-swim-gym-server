import { Request, Response } from 'express';
import billingService from '../services/billing.service';

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await billingService.createSubscription(req.body);
    res.status(201).json(data);
  } catch (err: unknown) {
    console.error('Error in createSubscription:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getAccountSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    if (!accountId) {
      res.status(400).json({ error: 'Account ID required' });
      return;
    }
    const data = await billingService.getSubscriptionsByAccount(accountId as string);
    res.json(data);
  } catch (err: unknown) {
    console.error('Error in getAccountSubscriptions:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  createSubscription,
  getAccountSubscriptions
};
