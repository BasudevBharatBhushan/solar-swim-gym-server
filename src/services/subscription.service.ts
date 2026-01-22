import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import { Subscription, ServicePlan, SubscriptionType } from '../types/billing.types';

export const createSubscription = async (
  accountId: string, 
  profileId: string, 
  servicePlanId: string
): Promise<Subscription> => {
  // 1. Fetch Service Plan details to calculate dates
  const { data: plan, error: planError } = await supabase
    .from('service_plans')
    .select(`
      *,
      subscription_type:subscription_types(*)
    `)
    .eq('service_plan_id', servicePlanId)
    .single();

  if (planError || !plan) {
    throw new AppError('Service Plan not found', 404);
  }

  const subscriptionType = plan.subscription_type as any as SubscriptionType;

  // 2. Calculate initial period
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  if (subscriptionType.billing_interval_unit === 'month') {
    endDate.setMonth(endDate.getMonth() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'year') {
    endDate.setFullYear(endDate.getFullYear() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'day') {
    endDate.setDate(endDate.getDate() + subscriptionType.billing_interval_count);
  }

  // 3. Create Subscription Record
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      account_id: accountId,
      profile_id: profileId,
      service_plan_id: servicePlanId,
      status: 'active', // Default to active for now, could be 'trialing'
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: false
    })
    .select()
    .single();

  if (subError) {
    throw new AppError(`Failed to create subscription: ${subError.message}`, 500);
  }

  return subscription;
};

export const cancelSubscription = async (subscriptionId: string, immediately: boolean = false) => {
  const updates: Partial<Subscription> = {
    cancel_at_period_end: !immediately,
  };

  if (immediately) {
    updates.status = 'canceled';
    updates.canceled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('subscription_id', subscriptionId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to update subscription', 500);
  }

  return data;
};

export const getAccountSubscriptions = async (accountId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      service_plan:service_plans(
        plan_name,
        price,
        currency,
        service:services(service_name)
      )
    `)
    .eq('account_id', accountId);

  if (error) {
    throw new AppError('Failed to fetch subscriptions', 500);
  }

  return data;
};
