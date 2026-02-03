import supabase from '../config/db';

interface CreateSubscriptionData {
  account_id: string;
  location_id: string;
  subscription_type: 'BASE' | 'MEMBERSHIP_FEE' | 'ADDON_SERVICE';
  reference_id: string; // FK to service_price_id, base_price_id, etc.
  subscription_term_id: string;
  unit_price_snapshot: number;
  total_amount: number;
  billing_period_start: string;
  billing_period_end: string;
  status?: 'ACTIVE' | 'PAID' | 'CANCELLED';
  coverage?: {
    profile_id: string;
    role: 'PRIMARY' | 'ADD_ON';
    exempt?: boolean;
    exempt_reason?: string;
  }[];
}

export const createSubscription = async (data: CreateSubscriptionData) => {
  const { coverage, ...subData } = data;

  // 1. Create Subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscription')
    .insert({
      ...subData,
      status: subData.status || 'ACTIVE'
    })
    .select()
    .single();

  if (subError) throw new Error(subError.message);

  // 2. Create Coverage linkings
  if (coverage && coverage.length > 0) {
    const coveragePayload = coverage.map(c => ({
      subscription_id: subscription.subscription_id,
      profile_id: c.profile_id,
      role: c.role,
      exempt: c.exempt || false,
      exempt_reason: c.exempt_reason || null
    }));

    const { error: covError } = await supabase
      .from('subscription_coverage')
      .insert(coveragePayload);

    if (covError) throw new Error(covError.message);
  }

  return getSubscriptionWithDetails(subscription.subscription_id);
};

export const getSubscriptionWithDetails = async (id: string) => {
  const { data: subscription, error: subError } = await supabase
    .from('subscription')
    .select('*, subscription_coverage(*, profile(*))')
    .eq('subscription_id', id)
    .single();

  if (subError) throw new Error(subError.message);
  return subscription;
};

export const getSubscriptionsByAccount = async (accountId: string) => {
  const { data, error } = await supabase
    .from('subscription')
    .select('*, subscription_coverage(*, profile(*))')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export default {
  createSubscription,
  getSubscriptionsByAccount,
  getSubscriptionWithDetails
};
