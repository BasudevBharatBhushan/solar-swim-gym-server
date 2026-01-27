import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import { Invoice, Subscription, ServicePlan } from '../types/billing.types';

export const getOrCreateOpenInvoice = async (accountId: string, amountToAdd: number): Promise<Invoice> => {
  // 1. Check for existing open invoices for this account
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingInvoices && existingInvoices.length > 0) {
    const openInvoice = existingInvoices[0];
    
    // Update the existing invoice amount
    const newAmount = Number(openInvoice.amount_due) + amountToAdd;
    
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({ amount_due: newAmount })
      .eq('invoice_id', openInvoice.invoice_id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(`Failed to update invoice: ${updateError.message}`, 500);
    }
    
    return updatedInvoice as unknown as Invoice;
  }

  // 2. Create new Invoice if none exists
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days by default

  // Generate a human-readable Invoice Number
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      account_id: accountId,
      billing_period_start: new Date().toISOString(),
      billing_period_end: new Date().toISOString(), // Initial period, maybe update later logic
      amount_due: amountToAdd,
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
        service_plan:service_plans(price)
      )
    `)
    .eq('account_id', accountId)
    .eq('status', 'open');

  if (error) {
    throw new AppError('Failed to fetch pending invoices', 500);
  }

  return (data || []) as unknown as Invoice[];
};

/**
 * Get all invoices for an account
 */
export const getAllInvoices = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('Failed to fetch invoices', 500);
  }

  return (data || []) as unknown as Invoice[];
};

/**
 * Get a specific invoice by ID
 */
export const getInvoiceById = async (invoiceId: string, accountId: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('account_id', accountId)
    .single();

  if (error || !data) {
    throw new AppError('Invoice not found', 404);
  }

  return data as unknown as Invoice;
};

/**
 * Process payment for an invoice
 */
export const processPayment = async (
  invoiceId: string,
  accountId: string,
  paymentMethodId: string
) => {
  // 1. Get the invoice
  const invoice = await getInvoiceById(invoiceId, accountId);

  if (invoice.status === 'paid') {
    throw new AppError('Invoice is already paid', 400);
  }

  // 2. Create payment attempt record
  const { data: paymentAttempt, error: attemptError } = await supabase
    .from('payment_attempts')
    .insert({
      invoice_id: invoiceId,
      provider: 'dummy_gateway',
      provider_payment_id: `pay_${Date.now()}`,
      amount_attempted: invoice.amount_due,
      status: 'succeeded'
    })
    .select()
    .single();

  if (attemptError) {
    throw new AppError('Failed to create payment attempt', 500);
  }

  // 3. Simulate payment gateway charge (always succeeds for now)
  const chargeSuccess = true;

  if (chargeSuccess) {
    // 4. Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: invoice.amount_due,
        updated_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId);

    if (updateError) {
      throw new AppError('Failed to update invoice', 500);
    }

    // 5. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        account_id: accountId,
        payment_attempt_id: paymentAttempt.payment_attempt_id,
        amount: invoice.amount_due,
        payment_method: paymentMethodId,
        payment_date: new Date().toISOString(),
        reference_id: `ref_${Date.now()}`
      })
      .select()
      .single();

    if (paymentError) {
      throw new AppError('Failed to create payment record', 500);
    }

    return {
      success: true,
      payment,
      invoice: await getInvoiceById(invoiceId, accountId)
    };
  } else {
    throw new AppError('Payment failed', 400);
  }
};

