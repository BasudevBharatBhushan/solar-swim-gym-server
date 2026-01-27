import { supabase } from "../config/supabase";
import { AppError } from "../middleware/error";
import { SubscriptionType, ServicePlan } from "../types/billing.types";
import { searchProfiles as esSearchProfiles, searchAccounts as esSearchAccounts } from "../config/elasticsearch";

export const createSubscriptionType = async (
  type: Partial<SubscriptionType>
): Promise<SubscriptionType> => {
  const { data, error } = await supabase
    .from("subscription_types")
    .insert(type)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to create subscription type: ${error.message}`,
      500
    );
  }

  return data as unknown as SubscriptionType;
};

export const upsertServicePlan = async (
  plan: Partial<ServicePlan>
): Promise<ServicePlan> => {
  const { data, error } = await supabase
    .from("service_plans")
    .upsert(plan, {
      onConflict: "service_id,subscription_type_id,funding_type,age_group",
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to upsert service plan: ${error.message}`, 500);
  }

  return data as unknown as ServicePlan;
};

export const createServicePlan = async (
  plan: Partial<ServicePlan>
): Promise<ServicePlan> => {
  // Set default currency if not provided
  if (!plan.currency) {
    plan.currency = "USD";
  }

  console.log('[DEBUG] createServicePlan called with:', JSON.stringify(plan, null, 2));

  const { data, error } = await supabase
    .from("service_plans")
    .insert(plan)
    .select()
    .single();

  if (error) {
    console.log('[DEBUG] Supabase error:', JSON.stringify(error, null, 2));
    throw new AppError(`Failed to create service plan: ${error.message}`, 500);
  }

  console.log('[DEBUG] Service plan created:', JSON.stringify(data, null, 2));
  return data as unknown as ServicePlan;
};

export const updateServicePlan = async (
  servicePlanId: string,
  updates: Partial<ServicePlan>
): Promise<ServicePlan> => {
  const { data, error } = await supabase
    .from("service_plans")
    .update(updates)
    .eq("service_plan_id", servicePlanId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update service plan: ${error.message}`, 500);
  }

  if (!data) {
    throw new AppError("Service plan not found", 404);
  }

  return data as unknown as ServicePlan;
};

export const getAllSubscriptionTypes = async () => {
  const { data, error } = await supabase.from("subscription_types").select("*");
  if (error) {
    throw new AppError(
      `Failed to fetch subscription types: ${error.message}`,
      500
    );
  }
  return data;
};

export const getAllServicePlans = async () => {
  const { data, error } = await supabase.from("service_plans").select("*");
  if (error) {
    throw new AppError(`Failed to fetch service plans: ${error.message}`, 500);
  }
  return data;
};

/**
 * Create a new membership plan
 */
export const createMembershipPlan = async (plan: any) => {
  const { data, error } = await supabase
    .from("membership_plans")
    .insert(plan)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create membership plan: ${error.message}`, 500);
  }

  return data;
};

/**
 * Update an existing membership plan
 */
export const updateMembershipPlan = async (membershipPlanId: string, updates: any) => {
  const { data, error } = await supabase
    .from("membership_plans")
    .update(updates)
    .eq("membership_plan_id", membershipPlanId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update membership plan: ${error.message}`, 500);
  }

  if (!data) {
    throw new AppError("Membership plan not found", 404);
  }

  return data;
};

/**
 * Get all membership plans
 */
export const getAllMembershipPlans = async () => {
  const { data, error } = await supabase
    .from("membership_plans")
    .select(`
      *,
      membership:memberships(*),
      subscription_type:subscription_types(*)
    `);
    
  if (error) {
    throw new AppError(`Failed to fetch membership plans: ${error.message}`, 500);
  }
  
  return data;
};

/**
 * Create a new service
 */
export const createService = async (service: any) => {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create service: ${error.message}`, 500);
  }

  return data;
};

/**
 * Get all services (Admin)
 */
export const getAllServices = async () => {
  const { data, error } = await supabase.from("services").select("*");
  if (error) {
    throw new AppError(`Failed to fetch services: ${error.message}`, 500);
  }
  return data;
};

/**
 * Create a new membership
 */
export const createMembership = async (membership: any) => {
  const { data, error } = await supabase
    .from("memberships")
    .insert(membership)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create membership: ${error.message}`, 500);
  }

  return data;
};

/**
 * Get all memberships (Admin)
 */
export const getAllMemberships = async () => {
  const { data, error } = await supabase.from("memberships").select("*");
  if (error) {
    throw new AppError(`Failed to fetch memberships: ${error.message}`, 500);
  }
  return data;
};

/**
 * Audit / Search Profiles with Elasticsearch
 */
export const searchProfiles = async (
  query: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const from = (page - 1) * limit;
  return await esSearchProfiles(query, from, limit, sortBy, sortOrder);
};

/**
 * Audit / Search Accounts with Elasticsearch
 */
export const searchAccounts = async (
  query: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const from = (page - 1) * limit;
  return await esSearchAccounts(query, from, limit, sortBy, sortOrder);
};

