# Solar Swim Gym - Backend API

A comprehensive backend system for managing swim gym operations, featuring multi-location support, role-based access control (RBAC), and a structured CRM.

## 🚀 Application Overview

The Solar Swim Gym Backend is designed to handle the complex needs of multi-center gym operations. The system manages everything from initial leads and member onboarding to service pricing and recurring billing.

### Key Modules
- **CRM**: Management of Leads, Accounts, and Profiles (Family/Group structure).
- **Service Catalog**: Dynamic pricing based on **Age Groups** and **Subscription Terms**.
- **Membership Engine**: Hierarchical membership programs with category-specific fees, rules, and bundled services.
- **Billing**: Automated invoice generation and subscription tracking.
- **Multi-Location**: Staff and data are scoped to specific locations, with SuperAdmins having global visibility.

---

## 🔐 Authentication & Security

The system uses **JWT (JSON Web Tokens)** for authentication. Security is enforced through **Role-Based Access Control (RBAC)**.

### User Roles
- **SUPERADMIN**: Global access to all locations, staff management, and system configuration.
- **ADMIN**: Access scoped to a specific `location_id`. Can manage leads, accounts, and services for their center.
- **USER**: End-user access (members). Scoped to their own `account_id` and associated profiles.

### How to Authenticate
To interact with protected routes, you must first obtain a token:

1. **Login**: 
   - **Endpoint**: `POST /api/v1/auth/staff/login`
   - **Credentials** (see Seeding section):
     - Email: `superadmin@solar.com`
     - Password: `password123`
2. **Authorize**:
   - Copy the `token` from the response.
   - Include it in subsequent requests as a Bearer token:
     `Authorization: Bearer <your_jwt_token>`

---

## 🛠️ Getting Started & Testing

Follow these steps to set up the environment and run the test suite.

### 1. Environment Setup
Create a `.env` file in the root directory with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
JWT_SECRET=your-secret-key
```

### 2. Database Preparation
To ensure a clean state for testing, you can clear and re-seed the database.

**Clear Database**: Removes all data from all tables (use with caution).
```bash
npm run cleardb
```

**Seed Staff**: Populates the database with default admin users.
```bash
npm run seed-staff
```
*Note: This creates a SuperAdmin and two Admins for testing (password: `password123`).*

### 3. Running Tests
The project includes a comprehensive end-to-end test suite that validates all API endpoints.

**Run All Tests**:
```bash
npm run test
```

**Run Specific Tests**:
- Authentication Flow: `npm run test:auth`
- RBAC Enforcement: `npm run test:rbac`

---

## 📂 Project Structure
- `/src/routes`: API route definitions.
- `/src/controllers`: Business logic for each route.
- `/src/middleware`: Auth and RBAC enforcement.
- `/src/scripts`: Maintenance and test scripts.
- `/sql`: Database schema and migration files.

## 📄 Documentation
Detailed documentation is available in the following files:
- [API Route Documentation](./API_DOCUMENTATION.md)
- [Authentication & RLS Guide](./AUTHENTICATION_RLS_DOCUMENTATION.md)
