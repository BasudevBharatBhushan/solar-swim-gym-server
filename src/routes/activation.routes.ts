import { Router } from 'express';
import * as activationController from '../controllers/activation.controller';

const router = Router();

router.get('/validate/:token', activationController.validateToken);
router.post('/activate', activationController.activateProfile);

export default router;
