import { Router } from 'express';
import locationRoutes from './location.routes';
import authRoutes from './auth.routes';
import configRoutes from './config.routes';
import serviceRoutes from './service.routes';
import crmRoutes from './crm.routes';

const router = Router();

router.use('/locations', locationRoutes);
router.use('/auth', authRoutes);
router.use('/config', configRoutes);
router.use('/services', serviceRoutes);
router.use('/', crmRoutes); // Exposes /leads, /accounts directly

export default router;
