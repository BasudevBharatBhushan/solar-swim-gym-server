import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import * as billingService from '../services/billing.service';

/**
 * POST /api/v1/subscriptions
 * Create a new subscription (membership or addon)
 */
export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId, servicePlanId, membershipPlanId } = req.body;
    
    // Determine if it's a membership or addon based on which plan ID is provided
    let subscription;
    
    if (membershipPlanId) {
      // Create membership subscription
      subscription = await subscriptionService.createMembershipSubscription(
        accountId,
        profileId,
        membershipPlanId
      );
    } else if (servicePlanId) {
      // Create addon subscription
      subscription = await subscriptionService.createSubscription(
        accountId,
        profileId,
        servicePlanId
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either membershipPlanId or servicePlanId is required'
      });
    }
    
    // Fetch the invoice that was assigned to this subscription
    const invoice = await billingService.getInvoiceById(subscription.invoice_id, accountId);

    res.status(201).json({
      success: true,
      subscription,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/subscriptions/:subscriptionId/cancel
 * Cancel a subscription
 */
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId } = req.params;
    const { immediately } = req.body;
    
    const subscription = await subscriptionService.cancelSubscription(
      subscriptionId as string,
      immediately || false
    );

    res.status(200).json({
      success: true,
      message: immediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at period end',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/subscriptions
 * Get all subscriptions for authenticated user
 */
export const getSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const subscriptions = await subscriptionService.getAccountSubscriptions(accountId);

    res.status(200).json({
      success: true,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/subscriptions/:subscriptionId
 * Get specific subscription details
 */
export const getSubscriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId as string);

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};
