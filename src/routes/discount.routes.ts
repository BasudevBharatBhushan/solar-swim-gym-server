import { Router } from 'express';
import discountController from '../controllers/discount.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

/**
 * @route GET /api/v1/discounts
 * @desc Get all discount codes for the current location
 * @access Private (Staff)
 */
router.get('/', authenticateToken, validateLocationAccess, discountController.getDiscountCodes);

/**
 * @route POST /api/v1/discounts
 * @desc Create or update a discount code
 * @access Private (Admin)
 */
router.post('/', authenticateToken, requireAdmin, validateLocationAccess, discountController.upsertDiscountCode);

/**
 * @route GET /api/v1/discounts/validate/:code
 * @desc Validate a discount code (public-ish or user-facing)
 * @access Private (Authenticated)
 */
router.get('/validate/:code', authenticateToken, validateLocationAccess, discountController.validateDiscountCode);

export default router;
