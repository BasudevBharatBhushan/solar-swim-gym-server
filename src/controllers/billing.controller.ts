import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import * as billingService from '../services/billing.service';

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId, servicePlanId } = req.body;
    
    // 1. Create Subscription
    const subscription = await subscriptionService.createSubscription(accountId, profileId, servicePlanId);
    
    // 2. Fetch Invoice
    const invoice = await billingService.getInvoiceById(subscription.invoice_id, accountId);

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

/**
 * GET /api/v1/billing/invoices
 * Get all invoices for authenticated user
 */
export const getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const invoices = await billingService.getAllInvoices(accountId);
    res.status(200).json({
      success: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/billing/invoices/:invoiceId
 * Get specific invoice details
 */
export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const invoice = await billingService.getInvoiceById(invoiceId as string, accountId);
    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/billing/pay
 * Process payment for an invoice
 */
export const payInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, accountId, paymentMethodId } = req.body;
    
    if (!invoiceId || !accountId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'invoiceId, accountId, and paymentMethodId are required'
      });
    }

    const result = await billingService.processPayment(invoiceId, accountId, paymentMethodId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

