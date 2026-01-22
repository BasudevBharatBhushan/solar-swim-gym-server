import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';

const router = Router();

// POST /api/billing/subscribe
router.post('/subscribe', billingController.subscribe);

// GET /api/billing/invoices/pending/:accountId
router.get('/invoices/pending/:accountId', billingController.getPendingInvoices);

export default router;
