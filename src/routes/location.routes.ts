import { Router } from 'express';
import locationController from '../controllers/location.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireSuperAdmin } from '../middlewares/authorize';

const router = Router();

// Location management - SuperAdmin only
router.get('/', authenticateToken, requireSuperAdmin, locationController.getAllLocations);
router.post('/', authenticateToken, requireSuperAdmin, locationController.upsertLocation);

export default router;

