import { Router } from 'express';
import servicePackController from '../controllers/service-pack.controller';
import { authenticateToken } from '../middlewares/auth';

import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

// Get prices for a specific service pack
router.get('/:servicePackId/prices', authenticateToken, servicePackController.getServicePackPrices);

// Upsert Service Pack
router.post('/upsert', authenticateToken, requireAdmin, servicePackController.upsertServicePack);

// Upsert Service Price
router.post('/prices/upsert', authenticateToken, requireAdmin, servicePackController.upsertServicePrice);

export default router;
