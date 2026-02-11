import { Router } from 'express';
import multer from 'multer';
import SignedWaiverController from '../controllers/SignedWaiverController';
import { optionalAuth } from '../middlewares/auth';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes here are protected or require context, but middleware stack is usually applied in index.ts
// We'll trust index.ts to apply setLocationContext.

// Upload Signature
router.post('/signature', upload.single('file'), SignedWaiverController.uploadSignature);

// Upsert Signed Waiver
router.post('/upsert', SignedWaiverController.upsertSignedWaiver);

// Get Signed Waivers by Profile
router.get('/', SignedWaiverController.getSignedWaivers);

export default router;
