import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, requireSuperAdmin } from '../middlewares/authorize';

const router = Router();

// Staff Authentication
router.post('/staff/login', authController.staffLogin);
router.post('/staff/create', authenticateToken, requireAdmin, authController.createStaff);
router.post('/staff/upsert', authenticateToken, requireAdmin, authController.upsertStaff);
router.post('/staff/reset-password', authenticateToken, requireAdmin, authController.sendStaffResetLink);
router.get('/staff/all', authenticateToken, requireSuperAdmin, authController.getAllStaff);

// Admin Activation/Password Reset
router.get('/admin/activate', authController.validateAdminToken);
router.post('/admin/activate', authController.activateAdmin);

// User/Account Authentication
router.post('/user/register', authController.registerUser);
router.get('/user/activate', authController.validateToken);
router.post('/user/activate', authController.activateAccount);
router.post('/user/login', authController.accountLogin);

// Testing/Debug endpoint - Get activation token
router.post('/user/get-activation-token', authController.getActivationToken);

export default router;
