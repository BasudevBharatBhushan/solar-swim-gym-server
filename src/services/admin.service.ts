import { supabase } from "../config/supabase";
import { AppError } from "../middleware/error";
import { SubscriptionType, ServicePlan } from "../types/billing.types";

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
  // Auto-generate plan_name if not provided
  if (!plan.plan_name && plan.service_id && plan.subscription_type_id) {
    // Fetch service name
    const { data: service } = await supabase
      .from("services")
      .select("service_name")
      .eq("service_id", plan.service_id)
      .single();

    // Fetch subscription type name
    const { data: subscriptionType } = await supabase
      .from("subscription_types")
      .select("type_name")
      .eq("subscription_type_id", plan.subscription_type_id)
      .single();

    if (service && subscriptionType) {
      // Generate plan name: "Service Name - Subscription Type - Age Group - Funding Type"
      const parts = [service.service_name, subscriptionType.type_name];
      if (plan.age_group) parts.push(plan.age_group);
      if (plan.funding_type) parts.push(plan.funding_type);
      plan.plan_name = parts.join(" - ");
    }
  }

  // Set default currency if not provided
  if (!plan.currency) {
    plan.currency = "USD";
  }

  const { data, error } = await supabase
    .from("service_plans")
    .insert(plan)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create service plan: ${error.message}`, 500);
  }

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
