import { Router } from 'express';
import waiverTemplateController from '../controllers/waiver-template.controller';

const router = Router();

/**
 * @route   GET /api/v1/waiver-templates
 * @desc    Get all waiver templates for the current location
 * @access  Private
 */
router.get('/', waiverTemplateController.getWaiverTemplates);

/**
 * @route   GET /api/v1/waiver-templates/:id
 * @desc    Get a specific waiver template by ID
 * @access  Private
 */
router.get('/:id', waiverTemplateController.getWaiverTemplateById);

/**
 * @route   POST /api/v1/waiver-templates/upsert
 * @desc    Create or update a waiver template
 * @access  Private
 */
router.post('/upsert', waiverTemplateController.upsertWaiverTemplate);

export default router;
