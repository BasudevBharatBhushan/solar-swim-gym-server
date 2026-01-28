import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";

export const upsertServicePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plan = await adminService.upsertServicePlan(req.body);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

export const createSubscriptionType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = await adminService.createSubscriptionType(req.body);
    res.status(201).json(type);
  } catch (error) {
    next(error);
  }
};

export const createServicePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('[DEBUG] Controller received req.body:', JSON.stringify(req.body, null, 2));
    const plan = await adminService.createServicePlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

export const updateServicePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const planId = Array.isArray(id) ? id[0] : id;
    const plan = await adminService.updateServicePlan(planId, req.body);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptionTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const types = await adminService.getAllSubscriptionTypes();
    res.status(200).json(types);
  } catch (error) {
    next(error);
  }
};

export const getAllServicePlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await adminService.getAllServicePlans();
    res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/membership-plans
 * Create a new membership plan
 */
export const createMembershipPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plan = await adminService.createMembershipPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/membership-plans/:id
 * Update an existing membership plan
 */
export const updateMembershipPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const planId = Array.isArray(id) ? id[0] : id;
    const plan = await adminService.updateMembershipPlan(planId, req.body);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/membership-plans
 * Get all membership plans
 */
export const getAllMembershipPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await adminService.getAllMembershipPlans();
    res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/profiles
 * Search profiles
 */
export const getProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // Reindex all profiles when searching all (empty query) to ensure data is fresh
    if (!q || q.trim() === '') {
      await adminService.syncAllProfilesToElasticsearch();
    }

    const result = await adminService.searchProfiles(q, page, limit, sortBy, sortOrder);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/accounts
 * Search accounts
 */
export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // Reindex all accounts when searching all (empty query) to ensure data is fresh
    if (!q || q.trim() === '') {
      await adminService.syncAllAccountsToElasticsearch();
    }

    const result = await adminService.searchAccounts(q, page, limit, sortBy, sortOrder);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/services
 */
export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await adminService.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/services
 */
export const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await adminService.getAllServices();
    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/memberships
 */
export const createMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membership = await adminService.createMembership(req.body);
    res.status(201).json(membership);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/memberships
 */
export const getAllMemberships = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await adminService.getAllMemberships();
    res.status(200).json(memberships);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/memberships/:id/services
 * Body: { serviceId: string, accessType: 'CORE' | 'ADDON' }
 */
export const assignServiceToMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const membershipId = Array.isArray(id) ? id[0] : id;

    const { serviceId, accessType } = req.body;

    if (!serviceId || !accessType) {
      res.status(400).json({ message: 'serviceId and accessType are required' });
      return;
    }

    if (accessType !== 'CORE' && accessType !== 'ADDON') {
      res.status(400).json({ message: "accessType must be 'CORE' or 'ADDON'" });
      return;
    }

    const result = await adminService.assignServiceToMembership(membershipId, serviceId, accessType);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/memberships/:id/services
 */
export const getMembershipServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const membershipId = Array.isArray(id) ? id[0] : id;

    const services = await adminService.getMembershipServices(membershipId);
    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};
