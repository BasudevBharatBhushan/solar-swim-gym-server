export type SubscriptionIntervalUnit = 'day' | 'month' | 'year';

export type SubscriptionStatus = 'trialing' | 'active' | 'paused' | 'canceled' | 'expired' | 'past_due';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export type PaymentAttemptStatus = 'created' | 'pending' | 'succeeded' | 'failed';

export interface SubscriptionType {
  subscription_type_id: string;
  type_name: string;
  billing_interval_unit: SubscriptionIntervalUnit;
  billing_interval_count: number;
  auto_renew: boolean;
  allows_pause: boolean;
  allows_cancel: boolean;
  generates_invoices: boolean;
  created_at?: string;
}

export interface ServicePlan {
  service_plan_id: string;
  service_id: string;
  subscription_type_id: string;
  price: number;
  currency: string;
  is_active: boolean;
  age_group?: string;
  funding_type?: string;
  created_at?: string;
  // Joins
  subscription_type?: SubscriptionType;
}

export interface Subscription {
  subscription_id: string;
  account_id: string;
  profile_id: string;
  service_plan_id?: string;
  membership_plan_id?: string;
  subscription_kind: 'MEMBERSHIP' | 'ADDON';
  invoice_id: string;
  status: SubscriptionStatus;
  current_period_start: string; // ISO Date string
  current_period_end: string;   // ISO Date string
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  invoice_id: string;
  account_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: InvoiceStatus;
  invoice_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentAttempt {
  payment_attempt_id: string;
  invoice_id: string;
  provider: string;
  provider_payment_id?: string;
  amount_attempted: number;
  status: PaymentAttemptStatus;
  failure_reason?: string;
  created_at?: string;
}

export interface Payment {
  payment_id: string;
  invoice_id: string;
  account_id: string;
  payment_attempt_id?: string;
  amount: number;
  payment_method?: string;
  payment_date?: string;
  reference_id?: string;
}
