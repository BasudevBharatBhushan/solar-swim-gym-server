import { Router } from "express";
import * as adminController from "../controllers/admin.controller";

const router = Router();

// POST /api/admin/subscription-types
router.post("/subscription-types", adminController.createSubscriptionType);

// GET all subscription types
router.get("/subscription-types", adminController.getAllSubscriptionTypes);
// GET all service plans
router.get("/service-plans", adminController.getAllServicePlans);
// POST create service plan
router.post("/service-plans", adminController.createServicePlan);
// PATCH update service plan
router.patch("/service-plans/:id", adminController.updateServicePlan);

export default router;
