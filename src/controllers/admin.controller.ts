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
