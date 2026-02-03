import { Router } from 'express';
import membershipController from '../controllers/membership.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

router.get('/', authenticateToken, membershipController.getAllPrograms);
router.get('/:id', authenticateToken, membershipController.getProgram);
router.post('/', authenticateToken, requireAdmin, validateLocationAccess, membershipController.upsertProgram);

export default router;
