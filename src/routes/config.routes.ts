import { Router } from 'express';
import configController from '../controllers/config.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

// Age Groups (Global lookup but restricted to Admins for modification)
router.get('/age-groups', configController.getAgeGroups);
router.post('/age-groups', authenticateToken, requireAdmin, configController.upsertAgeGroup);

// Subscription Terms (Location scoped)
router.get('/subscription-terms', authenticateToken, configController.getTerms);
router.post('/subscription-terms', authenticateToken, requireAdmin, validateLocationAccess, configController.upsertTerm);

// Waiver Programs (Location scoped)
router.get('/waiver-programs', authenticateToken, configController.getWaivers);
router.post('/waiver-programs', authenticateToken, requireAdmin, validateLocationAccess, configController.upsertWaiver);

export default router;

