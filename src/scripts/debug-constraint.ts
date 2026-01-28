
import { supabase } from "../config/supabase";

async function inspectConstraint() {
    console.log("🔍 Inspecting check constraints for service_plans...");

    const { data, error } = await supabase.rpc('get_check_constraints', {
        table_name: 'service_plans'
    });

    // Since we might not have a helper RPC, let's try to query via raw sql if possible via some other means or just strict inference.
    // Actually, standard supbase client doesn't support running raw SQL unless we have a RPC for it.
    // However, we can try to guess by inserting values.

    console.log("🧪 Testing allowed values for age_group...");

    const testValues = [
        'child', 'Child', 'CHILD',
        'adult', 'Adult', 'ADULT',
        'senior', 'Senior', 'SENIOR',
        '4-6', '7-9', '10-12', '13-18', '19+',
        'toddler', 'infant', 'teen', 'student'
    ];

    for (const val of testValues) {
        process.stdout.write(`   Testing '${val}'... `);

        // We need valid FKs for this to hit the check constraint
        // We can't easily get valid FKs without creating them.
        // But we can rely on the error message. If it fails with FK violation, it passed the check constraint (usually).
        // If it fails with Check Constraint violation, it failed the check.

        // Let's assume we need to pass a payload. 
        // We will just use dummy UUIDs. 
        // Postgres checks CHECK constraints BEFORE Foreign Key constraints? 
        // Usually CHECK constraints are validated. Foreign keys are also validated. 
        // Let's try inserting with dummy FKs.

        const { error } = await supabase.from('service_plans').insert({
            service_id: '00000000-0000-0000-0000-000000000000', // Dummy
            subscription_type_id: '00000000-0000-0000-0000-000000000000', // Dummy
            age_group: val,
            funding_type: 'private',
            price: 100,
            currency: 'USD'
        });

        if (error) {
            if (error.message.includes('violates check constraint "service_plans_age_group_check"')) {
                console.log('❌ REJECTED (Check Constraint)');
            } else if (error.message.includes('violates foreign key constraint')) {
                console.log('✅ ACCEPTED (FK error confirms check passed)');
            } else {
                console.log(`❓ Other error: ${error.message}`);
            }
        } else {
            console.log('✅ SUCCESS (Unexpectedly inserted)');
        }
    }
}

inspectConstraint().catch(console.error);
