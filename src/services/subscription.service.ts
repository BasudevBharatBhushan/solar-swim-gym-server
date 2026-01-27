import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import { Subscription, ServicePlan, SubscriptionType } from '../types/billing.types';
import * as billingService from './billing.service';

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
  const price = plan.price;

  // 2. Get or Create Open Invoice for the account
  const invoice = await billingService.getOrCreateOpenInvoice(accountId, price);

  // 3. Calculate initial period
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  if (subscriptionType.billing_interval_unit === 'month') {
    endDate.setMonth(endDate.getMonth() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'year') {
    endDate.setFullYear(endDate.getFullYear() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'day') {
    endDate.setDate(endDate.getDate() + subscriptionType.billing_interval_count);
  }

  // 4. Create Subscription Record
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      account_id: accountId,
      profile_id: profileId,
      subscription_kind: 'ADDON',
      service_plan_id: servicePlanId,
      status: 'active', // Default to active for now, could be 'trialing'
      current_period_start: startDate.toISOString().split('T')[0],
      current_period_end: endDate.toISOString().split('T')[0],
      invoice_id: invoice.invoice_id
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
        price,
        currency,
        service:services(service_name)
      ),
      membership_plan:membership_plans(
        price,
        currency,
        membership:memberships(membership_name)
      )
    `)
    .eq('account_id', accountId);

  if (error) {
    throw new AppError(`Failed to fetch subscriptions: ${error.message}`, 500);
  }

  return data;
};

export const createMembershipSubscription = async (
  accountId: string,
  profileId: string,
  membershipPlanId: string
): Promise<Subscription> => {
  // 1. Fetch Membership Plan details to calculate dates
  const { data: plan, error: planError } = await supabase
    .from('membership_plans')
    .select(`
      *,
      subscription_type:subscription_types(*)
    `)
    .eq('membership_plan_id', membershipPlanId)
    .single();

  if (planError || !plan) {
    throw new AppError('Membership Plan not found', 404);
  }

  const subscriptionType = plan.subscription_type as any as SubscriptionType;
  const price = plan.price;

  // 2. Get or Create Open Invoice for the account
  const invoice = await billingService.getOrCreateOpenInvoice(accountId, price);

  // 3. Calculate initial period
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  if (subscriptionType.billing_interval_unit === 'month') {
    endDate.setMonth(endDate.getMonth() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'year') {
    endDate.setFullYear(endDate.getFullYear() + subscriptionType.billing_interval_count);
  } else if (subscriptionType.billing_interval_unit === 'day') {
    endDate.setDate(endDate.getDate() + subscriptionType.billing_interval_count);
  }

  // 4. Create Subscription Record
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      account_id: accountId,
      profile_id: profileId,
      subscription_kind: 'MEMBERSHIP',
      membership_plan_id: membershipPlanId,
      status: 'active',
      current_period_start: startDate.toISOString().split('T')[0],
      current_period_end: endDate.toISOString().split('T')[0],
      invoice_id: invoice.invoice_id
    })
    .select()
    .single();

  if (subError) {
    throw new AppError(`Failed to create membership subscription: ${subError.message}`, 500);
  }

  return subscription;
};

export const getSubscriptionById = async (subscriptionId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      service_plan:service_plans(
        *,
        service:services(*)
      ),
      membership_plan:membership_plans(
        *,
        membership:memberships(*)
      )
    `)
    .eq('subscription_id', subscriptionId)
    .single();

  if (error) {
    throw new AppError('Subscription not found', 404);
  }

  return data;
};

