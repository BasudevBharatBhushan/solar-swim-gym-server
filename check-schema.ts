import { supabase } from "./src/config/supabase";

async function checkSchema() {
  console.log("🔍 Checking service_plans schema...\n");

  // Check if the columns exist
  const { data: plans, error } = await supabase
    .from("service_plans")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Error fetching service plans:", error.message);
    return;
  }

  console.log("✅ Service plans table accessible");
  
  if (plans && plans.length > 0) {
    console.log("\n📋 Sample record structure:");
    console.log(JSON.stringify(plans[0], null, 2));
  } else {
    console.log("\n📋 No records found in service_plans table");
  }

  // Try to check the unique index by attempting an insert
  console.log("\n🔍 Testing unique constraint...");
  
  const testPlan = {
    service_id: "061c0df8-c1b1-4395-9c02-84d394545010",
    subscription_type_id: "02ddccaf-fe0a-48bd-9b43-503220616b59",
    price: 100,
    age_group: "4-6",
    funding_type: "SELF"
  };

  // Try upsert
  const { data: upsertData, error: upsertError } = await supabase
    .from("service_plans")
    .upsert(testPlan, {
      onConflict: "service_id,subscription_type_id,funding_type,age_group"
    })
    .select()
    .single();

  if (upsertError) {
    console.error("❌ Upsert failed:", upsertError.message);
    console.log("\n💡 The unique index might not be created yet.");
    console.log("   Please run the schema_update.sql file in Supabase SQL Editor");
  } else {
    console.log("✅ Upsert successful!");
    console.log("   Unique constraint is working correctly");
    console.log("\n📋 Upserted record:");
    console.log(JSON.stringify(upsertData, null, 2));
  }
}

checkSchema().catch(console.error);
