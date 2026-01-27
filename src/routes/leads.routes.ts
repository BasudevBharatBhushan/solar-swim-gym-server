import { Router } from 'express';
import * as leadsController from '../controllers/leads.controller';

const router = Router();

// GET /api/v1/leads/stats - Get lead statistics (must be before /:leadId)
router.get('/stats', leadsController.getLeadStats);

// GET /api/v1/leads - Get all leads with pagination
router.get('/', leadsController.getAllLeads);

// GET /api/v1/leads/:leadId - Get specific lead
router.get('/:leadId', leadsController.getLeadById);

// POST /api/v1/leads - Create new lead
router.post('/', leadsController.createLead);

// PATCH /api/v1/leads/:leadId - Update lead
router.patch('/:leadId', leadsController.updateLead);

// DELETE /api/v1/leads/:leadId - Delete lead
router.delete('/:leadId', leadsController.deleteLead);

export default router;
