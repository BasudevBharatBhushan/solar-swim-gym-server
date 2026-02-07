import { Router } from 'express';
import sessionController from '../controllers/session.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/authorize';

const router = Router();

router.get('/', authenticateToken, sessionController.getSessions);
router.get('/:id', authenticateToken, sessionController.getSession);
router.post('/upsert', authenticateToken, requireAdmin, sessionController.upsertSession);

export default router;
