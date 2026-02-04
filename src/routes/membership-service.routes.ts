import { Router } from 'express';
import membershipServiceController from '../controllers/membership-service.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

/**
 * @route GET /api/membership-services/base-plan
 * @desc Fetch membership services for the base plan (membership_program_id is null)
 */
router.get('/base-plan', authenticateToken, membershipServiceController.getBasePlanServices);

/**
 * @route POST /api/membership-services/upsert
 * @desc Upsert membership services (can be base plan or program linked)
 */
router.post('/upsert', authenticateToken, requireAdmin, validateLocationAccess, membershipServiceController.upsertMembershipService);

export default router;
