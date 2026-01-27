# Solar Swim Gym Backend

A robust backend system for managing a subscription-based swim gym, featuring automated onboarding, complex billing cycles, and advanced search capabilities powered by Elasticsearch and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Docker (for Elasticsearch)
- Supabase Account

### Setup
1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

3. **Start Elasticsearch**
   ```bash
   docker-compose up -d
   ```

4. **Initialize Database**
   Run the SQL scripts in the `/sql` directory in order (01 to 08) in your Supabase SQL editor.

5. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🛠️ Admin Operations

Administrators manage the catalog, pricing, and system configurations.

### 1. Catalog Management

#### **Services**
- **List All**: `GET /api/v1/admin/services`
- **Create**: `POST /api/v1/admin/services`
  - **Payload**:
    ```json
    {
      "service_name": "Toddler Swim Basics",
      "eligibility_rules": { "min_age": 1, "max_age": 3 },
      "is_active": true
    }
    ```

#### **Memberships**
- **List All**: `GET /api/v1/admin/memberships`
- **Create**: `POST /api/v1/admin/memberships`
  - **Payload**:
    ```json
    {
      "membership_name": "Premium Family Pass",
      "description": "Unlimited access for up to 4 family members",
      "is_active": true
    }
    ```

#### **Subscription Types**
- **List All**: `GET /api/v1/admin/subscription-types`
- **Create**: `POST /api/v1/admin/subscription-types`
  - **Payload**:
    ```json
    {
      "type_name": "Quarterly",
      "billing_interval_unit": "month",
      "billing_interval_count": 3,
      "auto_renew": true
    }
    ```

---

### 2. Pricing & Plans

#### **Service Plans (Individual Service Pricing)**
- **List All**: `GET /api/v1/admin/service-plans`
- **Create**: `POST /api/v1/admin/service-plans`
  - **Payload**:
    ```json
    {
      "service_id": "uuid-of-service",
      "subscription_type_id": "uuid-of-subscription-type",
      "age_group": "child",
      "funding_type": "private",
      "price": 1500.00,
      "currency": "INR"
    }
    ```

#### **Membership Plans (Bundle Pricing)**
- **List All**: `GET /api/v1/admin/membership-plans`
- **Create**: `POST /api/v1/admin/membership-plans`
  - **Payload**:
    ```json
    {
      "membership_id": "uuid-of-membership",
      "subscription_type_id": "uuid-of-subscription-type",
      "age_group": "adult",
      "funding_type": "rceb",
      "price": 5000.00,
      "currency": "INR"
    }
    ```

---

### 3. Advanced Search & Audit (Admin)

Search routes for Profiles and Accounts leverage **Elasticsearch** for high-performance full-text search, filtering, and sorting.

#### **Profile Search**
- **Endpoint**: `GET /api/v1/admin/profiles`
- **Parameters**: `q` (query), `page`, `limit`, `sortBy`, `sortOrder`
- **Example (Pagination & Sort)**:
  `GET /api/v1/admin/profiles?q=John&page=1&limit=5&sortBy=first_name&sortOrder=asc`
  - *Finds profiles matching "John", limited to 5 results per page, sorted alphabetically.*

#### **Account Search**
- **Endpoint**: `GET /api/v1/admin/accounts`
- **Parameters**: `q`, `page`, `limit`, `sortBy`, `sortOrder`
- **Example (Status Filtering)**:
  `GET /api/v1/admin/accounts?q=suspended&page=2&limit=10`
  - *Searches across account emails and statuses, showing the second page of results.*

#### **Lead Search**
- **Endpoint**: `GET /api/v1/leads`
- **Parameters**: `search`, `page`, `limit`, `useElasticsearch`
- **Example (Elasticsearch)**:
  `GET /api/v1/leads?search=Web&page=1&limit=10&useElasticsearch=true`
  - *Performs a full-text search across leads via Elasticsearch.*

---

### 4. System Maintenance
- **Activation Tokens**: `GET /api/v1/debug/activation-tokens`
  - *Utility to retrieve tokens for testing without accessing email.*
- **Clear Database**: `POST /api/v1/debug/db-clear`
  - *Wipes all transactional data (leads, profiles, accounts, subscriptions, invoices, payments).*

---

---

## 🔄 User Flow & API Integration

### 1. Onboarding Flow
- **Endpoint**: `POST /api/v1/onboarding/complete`
- **Payload**:
  ```json
  {
    "primary_profile": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "password": "securepassword",
      "mobile": "1234567890",
      "date_of_birth": "1985-05-20",
      "rceb_flag": false
    },
    "family_members": [
      {
        "first_name": "Little", "last_name": "Doe",
        "date_of_birth": "2015-08-10", "rceb_flag": true
      }
    ]
  }
  ```

### 2. Activation & Login
- **Validate Token**: `GET /api/v1/auth/activation/validate/:token`
- **Activate**: `POST /api/v1/auth/activation/activate`
  - **Payload**:
    ```json
    {
      "token": "activation-token-from-email",
      "password": "SetYourNewPassword123!"
    }
    ```
- **Login**: `POST /api/v1/auth/login`
  - **Payload**:
    ```json
    {
      "email": "john.doe@example.com",
      "password": "SetYourNewPassword123!"
    }
    ```

### 3. Subscriptions
- **Create Subscription**: `POST /api/v1/subscriptions`
  - **Payload (Membership)**:
    ```json
    {
      "accountId": "uuid-of-account",
      "profileId": "uuid-of-profile",
      "membershipPlanId": "uuid-of-membership-plan"
    }
    ```
  - **Payload (Add-on Service)**:
    ```json
    {
      "accountId": "uuid-of-account",
      "profileId": "uuid-of-profile",
      "servicePlanId": "uuid-of-service-plan"
    }
    ```

### 4. Billing & Search
- **Fetch Invoices**: `GET /api/v1/billing/invoices?accountId=uuid`
- **Pay Invoice**: `POST /api/v1/billing/pay`
  - **Payload**:
    ```json
    {
      "invoiceId": "uuid-of-invoice",
      "accountId": "uuid-of-account",
      "paymentMethodId": "pm_card_visa"
    }
    ```
- **Leads Search**: `GET /api/v1/leads?search=Web&page=1&limit=10&useElasticsearch=true`

---

## 🛠️ Testing & Debugging

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Full E2E flow (Onboarding -> Sub -> Pay) |
| `npm run test:search` | Elasticsearch indexing & search utility test |
| `npm run db:clear` | Wipe all transactional data from Supabase |
| `GET /api/v1/debug/activation-tokens` | Utility to retrieve tokens without checking email |

---

## 📊 Database Schema

### Identity & Access
- **accounts**: Login credentials and status.
- **profiles**: Unified Parents/Children table.

### Service Catalog
- **services**: Individual offerings.
- **memberships**: Bundled offerings.

### Pricing & Subscriptions
- **subscription_types**: Billing frequencies.
- **membership_plans / service_plans**: Multi-dimensional pricing.
- **subscriptions**: User enrollments.

### Billing
- **invoices / payments**: Financial records.
