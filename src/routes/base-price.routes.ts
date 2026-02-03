import { Router } from 'express';
import basePriceController from '../controllers/base-price.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

router.get('/', authenticateToken, basePriceController.getAllBasePrices);
router.post('/', authenticateToken, requireAdmin, validateLocationAccess, basePriceController.upsertBasePrice);

export default router;
