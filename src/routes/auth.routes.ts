import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', (req, res) => res.status(200).json({ message: 'Logout successful' }));

export default router;
