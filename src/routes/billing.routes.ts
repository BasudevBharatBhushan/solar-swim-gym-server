import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import { protect } from '../middleware/auth';

const router = Router();

// POST /api/v1/billing/subscribe
router.post('/subscribe', billingController.subscribe);

// GET /api/v1/billing/invoices - Get all invoices
router.get('/invoices', protect, billingController.getAllInvoices);

// GET /api/v1/billing/invoices/:invoiceId - Get specific invoice
router.get('/invoices/:invoiceId', protect, billingController.getInvoiceById);

// GET /api/v1/billing/invoices/pending/:accountId - Get pending invoices
router.get('/invoices/pending/:accountId', billingController.getPendingInvoices);

// POST /api/v1/billing/pay - Process payment
router.post('/pay', protect, billingController.payInvoice);

export default router;

