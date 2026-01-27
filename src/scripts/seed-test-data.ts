import { supabase } from '../config/supabase';

async function seed() {
  console.log('🌱 Seeding test data...');

  try {
    // 1. Create a dummy service
    const { data: service, error: sError } = await supabase
      .from('services')
      .insert({
        service_name: 'Test Swim Lessons',
        is_active: true
      })
      .select()
      .single();
    if (sError) throw sError;
    console.log('✅ Created Service:', service.service_name);

    // 2. Create a dummy membership
    const { data: membership, error: mError } = await supabase
      .from('memberships')
      .insert({
        membership_name: 'Test Membership',
        description: 'Base membership for testing',
        is_active: true
      })
      .select()
      .single();
    if (mError) throw mError;
    console.log('✅ Created Membership:', membership.membership_name);

    // 3. Create subscription type (Monthly)
    const { data: subType, error: stError } = await supabase
      .from('subscription_types')
      .insert({
        type_name: 'Test Monthly',
        billing_interval_unit: 'month',
        billing_interval_count: 1,
        auto_renew: true
      })
      .select()
      .single();
    if (stError) throw stError;
    console.log('✅ Created Subscription Type:', subType.type_name);

    // 4. Create service plan
    const { data: servicePlan, error: spError } = await supabase
      .from('service_plans')
      .insert({
        service_id: service.service_id,
        subscription_type_id: subType.subscription_type_id,
        age_group: 'child',
        funding_type: 'private',
        price: 50.00,
        currency: 'USD'
      })
      .select()
      .single();
    if (spError) throw spError;
    console.log('✅ Created Service Plan');

    // 5. Create membership plan
    const { data: membershipPlan, error: mpError } = await supabase
      .from('membership_plans')
      .insert({
        membership_id: membership.membership_id,
        subscription_type_id: subType.subscription_type_id,
        age_group: 'adult',
        funding_type: 'private',
        price: 3000.00,
        currency: 'USD'
      })
      .select()
      .single();
    if (mpError) throw mpError;
    console.log('✅ Created Membership Plan');

    console.log('🚀 Seeding complete!');
    return { servicePlan, membershipPlan };
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

export { seed };
