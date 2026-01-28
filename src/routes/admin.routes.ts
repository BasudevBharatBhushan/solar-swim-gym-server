import { Router } from "express";
import * as adminController from "../controllers/admin.controller";

const router = Router();

// Subscription Types
router.post("/subscription-types", adminController.createSubscriptionType);
router.get("/subscription-types", adminController.getAllSubscriptionTypes);

// Services
router.post("/services", adminController.createService);
router.get("/services", adminController.getAllServices);

// Memberships
router.post("/memberships", adminController.createMembership);
router.get("/memberships", adminController.getAllMemberships);
router.post("/memberships/:id/services", adminController.assignServiceToMembership);
router.get("/memberships/:id/services", adminController.getMembershipServices);


// Service Plans
router.get("/service-plans", adminController.getAllServicePlans);
router.post("/service-plans", adminController.createServicePlan);
router.patch("/service-plans/:id", adminController.updateServicePlan);

// Membership Plans
router.get("/membership-plans", adminController.getAllMembershipPlans);
router.post("/membership-plans", adminController.createMembershipPlan);
router.patch("/membership-plans/:id", adminController.updateMembershipPlan);

// Search
router.get("/profiles", adminController.getProfiles);
router.get("/accounts", adminController.getAccounts);

export default router;

