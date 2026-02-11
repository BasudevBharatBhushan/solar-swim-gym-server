import { Router } from 'express';
import dropdownValueController from '../controllers/dropdownValue.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/authorize';

const router = Router();

// Get all dropdown values or filtered by module and label
router.get('/', dropdownValueController.getDropdownValues);

// Upsert dropdown value (requires admin)
router.post('/upsert', authenticateToken, requireAdmin, dropdownValueController.upsertDropdownValue);

// Delete dropdown value (requires admin)
router.delete('/:id', authenticateToken, requireAdmin, dropdownValueController.deleteDropdownValue);

export default router;
