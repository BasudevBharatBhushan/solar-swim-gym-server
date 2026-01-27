import { supabase } from '../config/supabase';

async function testInsert() {
  console.log('🧪 Testing service_plans insert...\n');

  // First, create a service and subscription_type
  console.log('1. Creating test service...');
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .insert({
      service_name: 'Test Service for Schema Check',
      is_active: true
    })
    .select()
    .single();

  if (serviceError) {
    console.error('❌ Service creation failed:', serviceError.message);
    return;
  }
  console.log('✅ Service created:', service.service_id);

  console.log('\n2. Creating test subscription type...');
  const { data: subType, error: subTypeError } = await supabase
    .from('subscription_types')
    .insert({
      type_name: 'Test Monthly ' + Date.now(),
      billing_interval_unit: 'month',
      billing_interval_count: 1,
      auto_renew: true
    })
    .select()
    .single();

  if (subTypeError) {
    console.error('❌ Subscription type creation failed:', subTypeError.message);
    return;
  }
  console.log('✅ Subscription type created:', subType.subscription_type_id);

  console.log('\n3. Creating service plan (WITHOUT plan_name)...');
  const planData = {
    service_id: service.service_id,
    subscription_type_id: subType.subscription_type_id,
    age_group: 'child',
    funding_type: 'private',
    price: 150.00,
    currency: 'INR'
  };

  console.log('Plan data:', JSON.stringify(planData, null, 2));

  const { data: plan, error: planError } = await supabase
    .from('service_plans')
    .insert(planData)
    .select()
    .single();

  if (planError) {
    console.error('❌ Service plan creation failed:', planError.message);
    console.error('Full error:', JSON.stringify(planError, null, 2));
  } else {
    console.log('✅ Service plan created successfully!');
    console.log('Plan:', JSON.stringify(plan, null, 2));
  }

  // Cleanup
  console.log('\n4. Cleaning up...');
  if (plan) {
    await supabase.from('service_plans').delete().eq('service_plan_id', plan.service_plan_id);
  }
  await supabase.from('subscription_types').delete().eq('subscription_type_id', subType.subscription_type_id);
  await supabase.from('services').delete().eq('service_id', service.service_id);
  console.log('✅ Cleanup complete');
}

testInsert().catch(console.error);
