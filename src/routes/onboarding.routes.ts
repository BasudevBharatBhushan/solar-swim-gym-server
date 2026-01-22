import { Router } from 'express';
import { validate } from '../middleware/validation';
import { onboardingSchema } from '../utils/validationSchemas';
import * as onboardingController from '../controllers/onboarding.controller';

const router = Router();

router.post('/complete', validate(onboardingSchema), onboardingController.completeOnboarding);

export default router;
