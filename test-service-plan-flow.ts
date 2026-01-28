import request from "supertest";
import app from "./src/app";

async function testServicePlanFlow() {
  console.log("🧪 Testing Service Plan API Flow\n");
  console.log("=".repeat(60));

  // Step 1: Fetch subscription types
  console.log("\n📋 Step 1: Fetching Subscription Types...");
  const subscriptionTypesRes = await request(app).get(
    "/api/v1/admin/subscription-types"
  );
  console.log(`Status: ${subscriptionTypesRes.statusCode}`);

  if (subscriptionTypesRes.statusCode !== 200) {
    console.error("❌ Failed to fetch subscription types");
    return;
  }

  const subscriptionTypes = subscriptionTypesRes.body;
  console.log(`✅ Found ${subscriptionTypes.length} subscription types`);
  subscriptionTypes.forEach((type: any) => {
    console.log(`   - ${type.type_name} (${type.subscription_type_id})`);
  });

  // Step 2: Fetch services
  console.log("\n📋 Step 2: Fetching Services...");
  const servicesRes = await request(app).get("/api/v1/services");
  console.log(`Status: ${servicesRes.statusCode}`);

  if (servicesRes.statusCode !== 200) {
    console.error("❌ Failed to fetch services");
    return;
  }

  const services = servicesRes.body;
  console.log(`✅ Found ${services.length} services`);
  services.forEach((service: any) => {
    console.log(`   - ${service.service_name} (${service.service_id})`);
  });

  // Step 3: Test creating a service plan
  console.log("\n📋 Step 3: Creating a Service Plan (POST)...");
  const servicePlanData = {
    service_id: services[0].service_id,
    subscription_type_id: subscriptionTypes[0].subscription_type_id,
    price: 100,
    age_group: "Child (6–12)",
    funding_type: "private",
  };

  console.log("Request payload:");
  console.log(JSON.stringify(servicePlanData, null, 2));

  const createRes = await request(app)
    .post("/api/v1/admin/service-plans")
    .send(servicePlanData);

  console.log(`Status: ${createRes.statusCode}`);

  if (createRes.statusCode === 201) {
    console.log("✅ Service plan created successfully");
    console.log(JSON.stringify(createRes.body, null, 2));
  } else if (createRes.statusCode === 500 || createRes.statusCode === 400) {
    console.log("⚠️  Creation failed (expected if duplicate or schema issue)");
    console.log(`Error: ${createRes.body.message}`);
  }

  // Step 4: Fetch all service plans
  console.log("\n📋 Step 4: Fetching All Service Plans...");
  const servicePlansRes = await request(app).get("/api/v1/admin/service-plans");
  console.log(`Status: ${servicePlansRes.statusCode}`);

  if (servicePlansRes.statusCode === 200) {
    const servicePlans = servicePlansRes.body;
    console.log(`✅ Found ${servicePlans.length} service plans`);
    servicePlans.forEach((plan: any) => {
      console.log(`   - Plan ID: ${plan.service_plan_id}`);
      console.log(`     Price: $${plan.price}, Age: ${plan.age_group}, Funding: ${plan.funding_type}`);
    });

    // Step 5: Test updating a service plan (if one exists)
    if (servicePlans.length > 0) {
      console.log("\n📋 Step 5: Updating a Service Plan (PATCH)...");
      const planToUpdate = servicePlans[0];
      const updateData = {
        price: 150,
      };

      console.log(`Updating plan: ${planToUpdate.service_plan_id}`);
      console.log("Update payload:");
      console.log(JSON.stringify(updateData, null, 2));

      const updateRes = await request(app)
        .patch(`/api/v1/admin/service-plans/${planToUpdate.service_plan_id}`)
        .send(updateData);

      console.log(`Status: ${updateRes.statusCode}`);

      if (updateRes.statusCode === 200) {
        console.log("✅ Service plan updated successfully");
        console.log(JSON.stringify(updateRes.body, null, 2));
      } else {
        console.log("❌ Update failed");
        console.log(`Error: ${updateRes.body.message}`);
      }
    }
  }

  // Step 6: Test with the exact curl data you provided
  console.log("\n📋 Step 6: Testing with Your Exact CURL Data...");
  const yourData = {
    service_id: "061c0df8-c1b1-4395-9c02-84d394545010",
    subscription_type_id: "02ddccaf-fe0a-48bd-9b43-503220616b59",
    price: 100,
    age_group: "Child (6–12)",
    funding_type: "SELF",
  };

  console.log("Request payload:");
  console.log(JSON.stringify(yourData, null, 2));

  const yourTestRes = await request(app)
    .post("/api/v1/admin/service-plans")
    .send(yourData);

  console.log(`Status: ${yourTestRes.statusCode}`);
  console.log("Response:");
  console.log(JSON.stringify(yourTestRes.body, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Test Flow Complete\n");

  // Summary
  console.log("📊 Summary:");
  console.log(`   - Subscription Types: ${subscriptionTypes.length}`);
  console.log(`   - Services: ${services.length}`);
  console.log(`   - Create Service Plan Status: ${createRes.statusCode}`);
  console.log(`   - Your CURL Test Status: ${yourTestRes.statusCode}`);

  if (yourTestRes.statusCode === 500 && yourTestRes.body.message?.includes("unique or exclusion constraint")) {
    console.log("\n⚠️  ISSUE IDENTIFIED:");
    console.log("   The database is missing the unique index required for upsert.");
    console.log("   Please run the schema_update.sql file in Supabase SQL Editor:");
    console.log("   CREATE UNIQUE INDEX IF NOT EXISTS idx_service_plans_upsert");
    console.log("   ON public.service_plans (service_id, subscription_type_id, funding_type, age_group);");
  }
}

testServicePlanFlow().catch(console.error);
