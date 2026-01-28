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

/**
 * Assign a service to a membership (Bundled/Core or Addon)
 */
export const assignServiceToMembership = async (
  membershipId: string,
  serviceId: string,
  accessType: 'CORE' | 'ADDON'
) => {
  // Check if trying to assign as duplicate, or just let DB handle generic error?
  // Postgres will throw uniquely constraint error, supabase returns it.

  const { data, error } = await supabase
    .from("membership_services")
    .insert({
      membership_id: membershipId,
      service_id: serviceId,
      access_type: accessType,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to assign service to membership: ${error.message}`, 500);
  }

  return data;
};

/**
 * Get all services assigned to a membership
 */
export const getMembershipServices = async (membershipId: string) => {
  const { data, error } = await supabase
    .from("membership_services")
    .select(`
      *,
      service:services(*)
    `)
    .eq("membership_id", membershipId);

  if (error) {
    throw new AppError(`Failed to fetch membership services: ${error.message}`, 500);
  }

  return data;
};


/**
 * Sync all profiles from Supabase to Elasticsearch
 */
export const syncAllProfilesToElasticsearch = async () => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw new AppError(`Failed to fetch profiles for sync: ${error.message}`, 500);
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, count: 0 };
    }

    // Initialize indices
    const { indexProfile, initializeIndices } = require('../config/elasticsearch');
    await initializeIndices();

    // Index all profiles in parallel
    await Promise.all(profiles.map(profile => indexProfile(profile)));

    return { success: true, count: profiles.length };
  } catch (error) {
    console.error('Failed to sync profiles to Elasticsearch:', error);
    throw error;
  }
};

/**
 * Sync all accounts from Supabase to Elasticsearch
 */
export const syncAllAccountsToElasticsearch = async () => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*');

    if (error) {
      throw new AppError(`Failed to fetch accounts for sync: ${error.message}`, 500);
    }

    if (!accounts || accounts.length === 0) {
      return { success: true, count: 0 };
    }

    // Fetch profiles for each account and join them
    const accountsWithProfiles = await Promise.all(
      accounts.map(async (account) => {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('profile_id, first_name, last_name, email, parent_profile_id')
          .eq('account_id', account.account_id);

        const mappedProfiles = (profiles || []).map(p => ({
          ...p,
          headmember: !p.parent_profile_id
        }));

        if (account.email === 'family9@demo.com') {
          console.log('[DEBUG] Mapped profiles for family9:', JSON.stringify(mappedProfiles.slice(0, 1), null, 2));
        }

        return { ...account, profiles: mappedProfiles };
      })
    );

    // Initialize indices
    const { indexAccount, initializeIndices } = require('../config/elasticsearch');
    await initializeIndices();

    // Index all accounts in parallel
    await Promise.all(accountsWithProfiles.map(account => indexAccount(account)));

    return { success: true, count: accounts.length };
  } catch (error) {
    console.error('Failed to sync accounts to Elasticsearch:', error);
    throw error;
  }
};
