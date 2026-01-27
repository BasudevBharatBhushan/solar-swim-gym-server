import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all subscription routes
router.use(protect);

// POST /api/v1/subscriptions - Create new subscription
router.post('/', subscriptionController.createSubscription);

// GET /api/v1/subscriptions - Get all subscriptions
router.get('/', subscriptionController.getSubscriptions);

// GET /api/v1/subscriptions/:subscriptionId - Get specific subscription
router.get('/:subscriptionId', subscriptionController.getSubscriptionById);

// POST /api/v1/subscriptions/:subscriptionId/cancel - Cancel subscription
router.post('/:subscriptionId/cancel', subscriptionController.cancelSubscription);

export default router;
