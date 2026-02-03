import { Router } from 'express';
import serviceController from '../controllers/service.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

// Service management
router.get('/', authenticateToken, serviceController.getAllServices);
router.get('/:id', authenticateToken, serviceController.getService);
router.post('/', authenticateToken, requireAdmin, validateLocationAccess, serviceController.upsertService);

export default router;

