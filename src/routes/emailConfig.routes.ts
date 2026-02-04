import { Router } from 'express';
import emailConfigController from '../controllers/emailConfig.controller';
import { authenticateToken } from '../middlewares/auth';
import { setLocationContext } from '../middlewares/setLocationContext';

const router = Router();

// Apply auth and location middleware to all routes
router.use(authenticateToken);
router.use(setLocationContext);

router.get('/', emailConfigController.getEmailConfig);
router.post('/', emailConfigController.upsertEmailConfig);

export default router;
