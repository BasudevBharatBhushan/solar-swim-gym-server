import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/authorize';

const router = Router();

// Staff Authentication
router.post('/staff/login', authController.staffLogin);
router.post('/staff/create', authenticateToken, requireAdmin, authController.createStaff);

// User/Account Authentication
router.post('/user/register', authController.registerUser);
router.post('/user/activate', authController.activateAccount);
router.post('/user/login', authController.accountLogin);


// Testing/Debug endpoint - Get activation token
router.post('/user/get-activation-token', authController.getActivationToken);

export default router;

