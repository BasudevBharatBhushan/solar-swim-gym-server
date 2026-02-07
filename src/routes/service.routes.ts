import { Router } from 'express';
import serviceController from '../controllers/service.controller';
import servicePackController from '../controllers/service-pack.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, validateLocationAccess } from '../middlewares/authorize';
import multer from 'multer';

const router = Router();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.'));
        }
    }
});

// Service management
router.get('/', authenticateToken, serviceController.getAllServices);
router.get('/:serviceId/service-packs', authenticateToken, servicePackController.getServicePacks);
router.get('/:id', authenticateToken, serviceController.getService);
router.post('/', authenticateToken, requireAdmin, validateLocationAccess, serviceController.upsertService);

// Image Upload Route
router.post(
    '/:service_id/image', 
    authenticateToken, 
    requireAdmin, 
    // We might need validateLocationAccess, but it usually depends on body/query params which might not be here? 
    // Actually validation might need to check if service belongs to location. 
    // But for now follow instructions. existing upsertService uses it.
    // The prompt says "Ensure route is protected by existing auth middleware (admin/staff only)."
    upload.single('image'), 
    serviceController.uploadImage
);

export default router;
