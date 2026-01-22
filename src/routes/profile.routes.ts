import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // Protect all profile routes

router.get('/me', profileController.getMe);
router.get('/family', profileController.getFamily);

export default router;
