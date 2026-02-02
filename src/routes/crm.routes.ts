import { Router } from 'express';
import crmController from '../controllers/crm.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireStaff, requireAdmin, validateLocationAccess } from '../middlewares/authorize';

const router = Router();

// Leads - Staff/Admin/SuperAdmin only
router.get('/leads', authenticateToken, requireStaff, validateLocationAccess, crmController.getLeads);
router.get('/leads/search', authenticateToken, requireStaff, validateLocationAccess, crmController.searchLeads);
router.post('/leads', authenticateToken, requireStaff, validateLocationAccess, crmController.upsertLead);
router.post('/leads/reindex', authenticateToken, requireAdmin, validateLocationAccess, crmController.reindexLeads);

// Accounts - Authenticated users, but Admin-scoped list
// A "User" role will see what the RLS allows (their own)
// An "Admin" role will see all in their location
router.get('/accounts', authenticateToken, validateLocationAccess, crmController.getAccounts);
router.get('/accounts/search', authenticateToken, validateLocationAccess, crmController.searchAccounts);
router.post('/accounts/upsert', authenticateToken, validateLocationAccess, crmController.upsertAccount);

// Global Reindex (Admin/Cron)
router.post('/cron/reindex-all', authenticateToken, requireAdmin, validateLocationAccess, crmController.reindexAll);

export default router;

