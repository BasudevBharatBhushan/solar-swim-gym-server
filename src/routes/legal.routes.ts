import { Router } from 'express';
import * as legalController from '../controllers/legal.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all legal routes
router.use(protect);

// GET /api/v1/legal/contracts - Get all contracts
router.get('/contracts', legalController.getContracts);

// GET /api/v1/legal/contracts/:contractId - Get specific contract
router.get('/contracts/:contractId', legalController.getContractById);

// POST /api/v1/legal/contracts/:contractId/sign - Sign a contract
router.post('/contracts/:contractId/sign', legalController.signContract);

export default router;
