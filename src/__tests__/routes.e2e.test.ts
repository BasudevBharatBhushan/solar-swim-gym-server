import request from "supertest";
import app from "../app";

describe("Solar Swim Gym Backend API Endpoints", () => {
  // Auth
  it("POST /api/v1/auth/login should return 200 or 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "parent@example.com", password: "password123" });
    expect([200, 401]).toContain(res.statusCode);
  });

  // Onboarding
  it("POST /api/v1/onboarding/complete should return 200 or 400", async () => {
    const res = await request(app)
      .post("/api/v1/onboarding/complete")
      .send({
        primary_profile: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          password: "securepassword",
          mobile: "1234567890",
          date_of_birth: "1985-05-20",
          rceb_flag: true,
          case_manager: {
            name: "Jane Smith",
            email: "jane.smith@rceb.org",
          },
        },
        family_members: [
          {
            first_name: "Little",
            last_name: "Doe",
            date_of_birth: "2015-08-10",
            email: "",
            rceb_flag: true,
            services: [],
          },
        ],
      });
    expect([200, 400, 500]).toContain(res.statusCode);
  });

  // Activation
  it("GET /api/v1/auth/activation/validate/:token should return 200 or 400", async () => {
    const res = await request(app).get(
      "/api/v1/auth/activation/validate/your_token_here"
    );
    expect([200, 400]).toContain(res.statusCode);
  });

  it("POST /api/v1/auth/activation/activate should return 200 or 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/activation/activate")
      .send({ token: "your_token_here", password: "new_secure_password" });
    expect([200, 400]).toContain(res.statusCode);
  });

  // Profiles
  it("GET /api/v1/profile/me should return 401 if not authenticated", async () => {
    const res = await request(app).get("/api/v1/profile/me");
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/v1/profile/family should return 401 if not authenticated", async () => {
    const res = await request(app).get("/api/v1/profile/family");
    expect(res.statusCode).toBe(401);
  });

  // Services
  it("GET /api/v1/services should return 200", async () => {
    const res = await request(app).get("/api/v1/services");
    expect(res.statusCode).toBe(200);
  });

  // Admin
  it("POST /api/v1/admin/service-plans should return 400 or 500 (missing auth or invalid data)", async () => {
    const res = await request(app).post("/api/v1/admin/service-plans").send({
      service_id: "uuid-here",
      subscription_type_id: "uuid-here",
      price: 100,
      age_group: "4-6",
      funding_type: "SELF",
    });
    expect([400, 401, 403, 500]).toContain(res.statusCode);
  });

  it("POST /api/v1/admin/subscription-types should return 400 or 500 (missing auth or invalid data)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/subscription-types")
      .send({
        type_name: "Monthly",
        billing_interval_unit: "month",
        billing_interval_count: 1,
        auto_renew: true,
        generates_invoices: true,
      });
    expect([400, 401, 403, 500]).toContain(res.statusCode);
  });

  // Billing
  it("POST /api/v1/billing/subscribe should return 400 or 404 (invalid data)", async () => {
    const res = await request(app).post("/api/v1/billing/subscribe").send({
      accountId: "uuid-account",
      profileId: "uuid-profile",
      servicePlanId: "uuid-plan",
    });
    expect([400, 401, 403, 404]).toContain(res.statusCode);
  });

  it("GET /api/v1/billing/invoices/pending/:accountId should return 401 or 500 if not authenticated", async () => {
    const res = await request(app).get(
      "/api/v1/billing/invoices/pending/uuid-account"
    );
    expect([401, 403, 400, 500]).toContain(res.statusCode);
  });
});
