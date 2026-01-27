
import { supabase } from '../config/supabase';
import { createSubscription, getAccountSubscriptions } from '../services/subscription.service';
import { generateInvoice, getPendingInvoices } from '../services/billing.service';
import { recordPaymentAttempt, finalizePayment } from '../services/payment.service';
import { createSubscriptionType, createServicePlan } from '../services/admin.service';

const runVerification = async () => {
  console.log('🚀 Starting Payment & Subscription Architecture Verification');

  try {
    // 1. Setup Base Data (Account & Profile)
    console.log('1. Setting up Base Data...');
    const { data: account, error: accError } = await supabase
        .from('accounts')
        .insert({ status: 'active' })
        .select()
        .single();
    if (accError) throw accError;
    console.log(`   - Account Created: ${account.account_id}`);

    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .insert({
            account_id: account.account_id,
            first_name: 'Test',
            last_name: 'Parent',
            role: 'PARENT',
            email: `test-${Date.now()}@example.com`,
            date_of_birth: '1980-01-01'
        })
        .select()
        .single();
    if (profError) throw profError;
    console.log(`   - Profile Created: ${profile.profile_id}`);

    // 2. Setup Service & Plan
    console.log('2. Setting up Service & Plan...');
    // Create a dummy service directly (no service yet)
    const { data: service, error: servError } = await supabase
        .from('services')
        .insert({ service_name: 'Test Service', service_type: 'CLASS' })
        .select()
        .single();
    if (servError) throw servError;
    console.log(`   - Service Created: ${service.service_id}`);

    const subType = await createSubscriptionType({
        type_name: `Monthly Test ${Date.now()}`,
        billing_interval_unit: 'month',
        billing_interval_count: 1,
        auto_renew: true
    });
    console.log(`   - Subscription Type Created: ${subType.type_name}`);

    const servicePlan = await createServicePlan({
        service_id: service.service_id,
        subscription_type_id: subType.subscription_type_id,
        age_group: 'adult',
        funding_type: 'private',
        price: 99.99,
        currency: 'USD'
    });
    console.log(`   - Service Plan Created: ${servicePlan.service_plan_id} ($${servicePlan.price});`);

    // 3. Create Subscription
    console.log('3. Creating Subscription...');
    const subscription = await createSubscription(account.account_id, profile.profile_id, servicePlan.service_plan_id);
    console.log(`   - Subscription Created: ${subscription.subscription_id} (Status: ${subscription.status})`);

    // 4. Generate Invoice
    console.log('4. Generating Invoice...');
    const invoice = await generateInvoice(subscription.subscription_id);
    console.log(`   - Invoice Generated: ${invoice.invoice_number} (Amount: $${invoice.amount_due})`);

    // 5. Verify Pending Invoices
    const pending = await getPendingInvoices(account.account_id);
    console.log(`   - Pending Invoices for Account: ${pending.length} (Expected >= 1)`);
    if (pending.length === 0) throw new Error('No pending invoices found!');

    // 6. Process Payment
    console.log('6. Processing Payment...');
    const attempt = await recordPaymentAttempt(invoice.invoice_id, 'stripe', invoice.amount_due, 'pi_fake_123');
    console.log(`   - Payment Attempt Recorded: ${attempt.payment_attempt_id} (Status: ${attempt.status})`);

    const result = await finalizePayment(attempt.payment_attempt_id, 'succeeded');
    if (!result.success) throw new Error('Payment finalization failed');
    console.log(`   - Payment Finalized. Invoice Status Updated.`);

    // 7. Verify Final State
    const { data: finalInvoice } = await supabase.from('invoices').select('*').eq('invoice_id', invoice.invoice_id).single();
    console.log(`   - Final Invoice Status: ${finalInvoice.status} (Expected: paid)`);
    
    if (finalInvoice.status !== 'paid') throw new Error(`Invoice status mismatch: ${finalInvoice.status}`);

    console.log('✅ Verification Successful!');
  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  }
};

runVerification();
