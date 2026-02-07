import service from './src/services/base-price.service';
import supabase from './src/config/db';

async function verifyLegacyIssue() {
    console.log("Starting Legacy Code Verification...");
    
    // 1. Fetch a Base Price to use for testing
    const { data: basePrice, error: bpError } = await supabase
        .from('base_price')
        .select('*')
        .limit(1)
        .single();
        
    if (bpError || !basePrice) {
        console.error("No Base Price found to test with.");
        return;
    }
    
    // 2. Fetch a Service to add
    const { data: serviceData, error: sError } = await supabase
        .from('service')
        .select('*')
        .limit(1)
        .single();
        
    const service_id = serviceData.service_id;
    const location_id = basePrice.location_id;
    
    console.log(`Testing with BasePrice: ${basePrice.base_price_id} and Service: ${service_id}`);

    // 2.5 Clean up any previous zombies
    const { error: delError } = await supabase
        .from('membership_service')
        .delete()
        .eq('service_id', service_id)
        .is('membership_program_id', null)
        .is('location_id', null);
        
    if (!delError) console.log("Cleaned up previous zombies.");

    // 3. Construct Payload with `membership_services`
    // This mimics the structure the legacy code expects
    const payload = {
        location_id: location_id,
        prices: [basePrice], // Just reaffirm the price
        membership_services: [
            {
                service_id: service_id,
                is_included: true,
                // Intentionally omit new fields to see if legacy code populates them as NULL or default
            }
        ]
    };

    // 4. Call upsertBasePrice (which contains the legacy code)
    console.log("Calling upsertBasePrice with legacy payload...");
    try {
        await service.upsertBasePrice(payload);
    } catch (e: any) {
        console.error("Upsert failed:", e.message);
    }

    // 5. Check what was created
    console.log("Fetching ALL services for this service_id:", service_id);
    const { data: allServices } = await supabase
        .from('membership_service')
        .select('*')
        .eq('service_id', service_id);
        
    console.log("Found Services:", allServices);

    const zombie = allServices?.find(s => 
        s.membership_program_id === null && 
        s.location_id === null && 
        s.baseprice_role === null
    );

    if (zombie) {
        console.error("FAILURE: Found a Zombie Service created by legacy code!", zombie);
    } else {
        console.log("SUCCESS: No Zombie Service found (or code already fixed).");
    }
}

verifyLegacyIssue();
