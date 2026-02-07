import { Router } from 'express';
import membershipServiceController from '../controllers/membership-service.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

/**
 * @route GET /api/membership-services/:ownerId
 * @desc Fetch membership services for a specific owner (Base Plan or Category)
 */
router.get('/:ownerId', authenticateToken, membershipServiceController.getServicesByOwner);

/**
 * @route POST /api/membership-services/upsert
 * @desc Upsert membership services (can be base plan or program linked)
 */
router.post('/upsert', authenticateToken, requireAdmin, validateLocationAccess, membershipServiceController.upsertMembershipService);

export default router;
