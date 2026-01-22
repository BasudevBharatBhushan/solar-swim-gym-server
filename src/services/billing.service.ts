import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import { Invoice, Subscription, ServicePlan } from '../types/billing.types';

export const generateInvoice = async (subscriptionId: string): Promise<Invoice> => {
  // 1. Fetch Subscription details
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      *,
      service_plan:service_plans(*)
    `)
    .eq('subscription_id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new AppError('Subscription not found', 404);
  }

  const servicePlan = subscription.service_plan as any as ServicePlan;

  // 2. Check for existing open invoices for this period
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('billing_period_start', subscription.current_period_start)
    .eq('status', 'open');

  if (existingInvoices && existingInvoices.length > 0) {
    return existingInvoices[0] as unknown as Invoice;
  }

  // 3. Create new Invoice
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days by default

  // Generate a human-readable Invoice Number (simple timestamp based for now)
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      subscription_id: subscriptionId,
      account_id: subscription.account_id,
      billing_period_start: subscription.current_period_start,
      billing_period_end: subscription.current_period_end,
      amount_due: servicePlan.price,
      amount_paid: 0,
      due_date: dueDate.toISOString(),
      status: 'open',
      invoice_number: invoiceNumber
    })
    .select()
    .single();

  if (invError) {
    throw new AppError(`Failed to create invoice: ${invError.message}`, 500);
  }

  return invoice as unknown as Invoice;
};

export const getPendingInvoices = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      subscription:subscriptions(
        service_plan:service_plans(plan_name)
      )
    `)
    .eq('account_id', accountId)
    .eq('status', 'open');

  if (error) {
    throw new AppError('Failed to fetch pending invoices', 500);
  }

  return (data || []) as unknown as Invoice[];
};
