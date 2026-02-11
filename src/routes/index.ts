import { Router } from 'express';
import locationRoutes from './location.routes';
import authRoutes from './auth.routes';
import configRoutes from './config.routes';
import serviceRoutes from './service.routes';
import crmRoutes from './crm.routes';
import basePriceRoutes from './base-price.routes';
import membershipRoutes from './membership.routes';
import billingRoutes from './billing.routes';
import discountRoutes from './discount.routes';
import membershipServiceRoutes from './membership-service.routes';
import emailConfigRoutes from './emailConfig.routes';
import servicePackRoutes from './service-pack.routes';
import sessionRoutes from './session.routes';
import waiverTemplateRoutes from './waiver-template.routes';
import signedWaiverRoutes from './signed-waiver.routes';
import dropdownValueRoutes from './dropdownValue.routes';


const router = Router();

router.use('/locations', locationRoutes);
router.use('/email-config', emailConfigRoutes);
router.use('/auth', authRoutes);
router.use('/config', configRoutes);
router.use('/services', serviceRoutes);
router.use('/base-prices', basePriceRoutes);
router.use('/memberships', membershipRoutes);
router.use('/membership-services', membershipServiceRoutes);
router.use('/billing', billingRoutes);
router.use('/discounts', discountRoutes);
router.use('/service-packs', servicePackRoutes);
router.use('/sessions', sessionRoutes);
router.use('/waiver-templates', waiverTemplateRoutes);
router.use('/signed-waivers', signedWaiverRoutes);
router.use('/dropdown-values', dropdownValueRoutes);

router.use('/', crmRoutes); // Exposes /leads, /accounts directly

export default router;
