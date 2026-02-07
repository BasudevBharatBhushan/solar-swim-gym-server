import service from './src/services/membership-service.service';
import supabase from './src/config/db';

async function verify() {
    console.log("Starting Verification...");
    
    // 1. Fetch a Base Price to use for testing
    const { data: basePrice, error: bpError } = await supabase
        .from('base_price')
        .select('base_price_id, location_id, role, age_group_id')
        .limit(1)
        .single();
        
    if (bpError || !basePrice) {
        console.error("No Base Price found to test with.");
        return;
    }
    
    const { base_price_id, location_id, role, age_group_id } = basePrice;
    console.log(`Using Base Price ID: ${base_price_id} (Location: ${location_id}, Role: ${role})`);

    // 2. Fetch a Service to add
    const { data: serviceData, error: sError } = await supabase
        .from('service')
        .select('service_id')
        .limit(1)
        .single();
        
    if (sError || !serviceData) {
        console.error("No Service found to test with.");
        return;
    }
    const service_id = serviceData.service_id;
    console.log(`Using Service ID: ${service_id}`);

    // 3. Upsert Service using the Base Price ID
    console.log("Upserting service via Base Price ID...");
    try {
        await service.upsertMembershipService([{
            service_id: service_id,
            membership_program_id: base_price_id,
            is_included: true
        }]);
        console.log("Upsert successful.");
    } catch (e: any) {
        console.error("Upsert failed:", e.message);
        return;
    }
    
    // 4. Verify Database Entry
    console.log("Verifying service stored with components...");
    const { data: storedService } = await supabase
        .from('membership_service')
        .select('*')
        .eq('location_id', location_id)
        .eq('baseprice_role', role)
        .eq('baseprice_age_group_id', age_group_id)
        .eq('service_id', service_id)
        .single();
        
    if (storedService) {
        console.log("SUCCESS: Service found linked via components!");
        console.log(storedService);
    } else {
        console.error("FAILURE: Service not found via component lookup.");
    }
    
    // 5. Test Fetch via ID
    console.log("Testing fetch via ID...");
    const fetched = await service.getServicesByOwner(base_price_id);
    const found = fetched.find((s: any) => s.service_id === service_id);
    if (found) {
        console.log("SUCCESS: getServicesByOwner returned the service.");
    } else {
        console.error("FAILURE: getServicesByOwner did not return the service.");
    }
}

verify();
