import { Router } from 'express';
import billingController from '../controllers/billing.controller';
import { authenticateToken } from '../middlewares/auth';
import { validateLocationAccess } from '../middlewares/authorize';

const router = Router();

router.post('/subscriptions', authenticateToken, validateLocationAccess, billingController.createSubscription);
router.get('/accounts/:accountId/subscriptions', authenticateToken, validateLocationAccess, billingController.getAccountSubscriptions);

export default router;
