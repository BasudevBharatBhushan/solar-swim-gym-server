import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import { Invoice, PaymentAttempt, Payment } from '../types/billing.types';

export const recordPaymentAttempt = async (
  invoiceId: string, 
  provider: string, 
  amount: number,
  providerPaymentId?: string
): Promise<PaymentAttempt> => {
  const { data, error } = await supabase
    .from('payment_attempts')
    .insert({
      invoice_id: invoiceId,
      provider,
      provider_payment_id: providerPaymentId,
      amount_attempted: amount,
      status: 'pending' // Initial status
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to record payment attempt', 500);
  }

  return data as unknown as PaymentAttempt;
};

export const finalizePayment = async (
  paymentAttemptId: string, 
  status: 'succeeded' | 'failed', 
  failureReason?: string
) => {
  // 1. Update Attempt Status
  const { data: attempt, error: attemptError } = await supabase
    .from('payment_attempts')
    .update({
      status,
      failure_reason: failureReason
    })
    .eq('payment_attempt_id', paymentAttemptId)
    .select('*, invoice:invoices(*)')
    .single();

  if (attemptError || !attempt) {
    throw new AppError('Payment attempt not found', 404);
  }

  if (status === 'failed') {
    return { success: false, attempt };
  }

  // 2. If Succeeded, Create Payment Record and Close Invoice
  const invoice = attempt.invoice as any as Invoice;

  // Transaction block? Supabase JS client doesn't support complex transactions easily in one go.
  // We will do it sequentially for now. Ideally use an RPC function for atomicity.
  
  // A. Create Payment
  const { error: payError } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoice.invoice_id,
      account_id: invoice.account_id,
      payment_attempt_id: paymentAttemptId,
      amount: attempt.amount_attempted,
      payment_method: 'external', // Placeholder
      payment_date: new Date().toISOString()
    });

  if (payError) {
    console.error('CRITICAL: Failed to create payment record after successful attempt', payError);
    // Ideally revert attempt status or flag for manual review
  }

  // B. Update Invoice
  const { error: invError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid: attempt.amount_attempted
    })
    .eq('invoice_id', invoice.invoice_id);

  if (invError) {
     console.error('CRITICAL: Failed to update invoice status', invError);
  }

  return { success: true, attempt };
};
