---
description: Activation Workflow after Onboarding
---

# Activation Workflow

This workflow describes how family members (Child profiles) activate their accounts after the primary onboarding is complete.

## 1. Onboarding Completion
When the `POST /onboarding` endpoint is called, the backend creates the account and profiles. If a family member has an email address, an activation token is generated.

### Triggering Event (Internal)
The `complete_onboarding` Postgres function returns activation data:
```json
{
    "activations": [
        {
            "email": "child1@example.com",
            "token": "a1b2c3d4e5f6...",
            "first_name": "Child"
        }
    ]
}
```

## 2. Token Validation
The user clicks a link in their email (e.g., `https://app.solarswim.com/activate?token=a1b2c3d4e5f6...`). The frontend should first validate this token.

### Request
`GET /api/activation/validate/a1b2c3d4e5f6...`

### Response (Success)
```json
{
    "valid": true,
    "profile_id": "child-uuid-here",
    "email": "child1@example.com"
}
```

## 3. Profile Activation
The user provides a password on the activation page.

### Request
`POST /api/activation/activate`
**Body:**
```json
{
    "token": "a1b2c3d4e5f6...",
    "password": "newSecurePassword123"
}
```

### Response (Success)
```json
{
    "success": true
}
```

## 4. Post-Activation
The profile's `password_hash` is updated in the database, `is_active` is set to `true`, and the token is marked as `used`. The user can now log in using their email and password.
