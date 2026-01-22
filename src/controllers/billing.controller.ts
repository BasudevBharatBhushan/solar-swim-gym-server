import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import * as billingService from '../services/billing.service';

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId, servicePlanId } = req.body;
    
    // 1. Create Subscription
    const subscription = await subscriptionService.createSubscription(accountId, profileId, servicePlanId);
    
    // 2. Generate First Invoice immediately
    const invoice = await billingService.generateInvoice(subscription.subscription_id);

    res.status(201).json({
      subscription,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const invoices = await billingService.getPendingInvoices(accountId as string);
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
};
