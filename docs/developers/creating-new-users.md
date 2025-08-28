# Creating a New User with Role in OPS

This guide documents the complete process for creating a new user with a specific role in the OPRE OPS system, based on the implementation in PR #4256 which added the SUPER_USER role.

## Overview

Creating a new user in OPS involves multiple components across both backend and frontend systems. The process includes defining roles with permissions, creating user data, updating authentication systems, and ensuring proper UI integration.

## Backend Changes Required

### 1. Role Definition with Permissions (`backend/data_tools/data/user_data.json5`)

**Location:** Lines 325-388 (role definition), Lines 653-661 (user creation)

Add a new role object to the `role` array with:
- `name`: Role identifier (e.g., "SUPER_USER")
- `permissions`: Array of permission strings defining what the role can access

Example role definition:
```json5
{
  name: "SUPER_USER",
  permissions: [
    "GET_AGREEMENT",
    "PUT_AGREEMENT",
    "PATCH_AGREEMENT",
    "POST_AGREEMENT",
    "DELETE_AGREEMENT",
    // ... additional permissions
  ]
}
```

Add user entry to the `ops_user` array:
```json5
{
  first_name: "Power",
  last_name: "User",
  division: 1,
  email: "power.user@email.com",
  oidc_id: "00000000-0000-1111-a111-000000000028",
  roles: [{"tablename": "role", "id": 7}],
  status: "ACTIVE"
}
```

### 2. User Disable Protection (`backend/data_tools/src/disable_users/queries.py`)

**Location:** Line 14

Add the new user's OIDC ID to the `OIDC_IDS_TO_PRESERVE` list to prevent accidental deactivation:
```python
"00000000-0000-1111-a111-000000000028",  # Super User
```

### 3. Authentication Provider (`backend/ops_api/ops/auth/authentication_provider/fake_auth_provider.py`)

**Location:** Lines 46-52

Add user details to the `fakeUsers` dictionary for development/testing:
```python
"power_user": {
    "given_name": "Power",
    "family_name": "User",
    "email": "power.user@email.com",
    "sub": "00000000-0000-1111-a111-000000000028",
},
```

### 4. Environment Configuration (`backend/ops_api/ops/environment/default_settings.py`)

**Location:** Line 71, 82

Add OIDC ID to the preserved list and define role constant:
```python
# In OIDC_IDS_TO_PRESERVE array
"00000000-0000-1111-a111-000000000028",

# Role constant
SUPER_USER = "SUPER_USER"
```

### 5. Authorization Logic (`backend/ops_api/ops/utils/agreements_helpers.py`)

**Location:** Lines 64-66

Add role-based access checks where needed:
```python
if current_app.config.get("SUPER_USER", "SUPER_USER") in (role.name for role in user.roles):
    return True
```

## Frontend Changes Required

### 1. Authentication UI (`frontend/src/components/Auth/MultiAuthSection.jsx`)

**Location:** Lines 250-259

Add login button for the new user type:
```jsx
<button
    className="usa-button usa-button--outline width-full"
    onClick={() => handleFakeAuthLogin("power_user")}
    disabled={isAuthenticating}
>
    Power User
</button>
```

### 2. User Role Constants (`frontend/src/components/Users/User.constants.js`)

**Location:** Lines 20-21

Add role constant to the `USER_ROLES` object:
```javascript
SUPER_USER: "SUPER_USER"
```

### 3. Application Constants (`frontend/src/constants.js`)

**Location:** Line 42

Add role to the roles array for UI display:
```javascript
{ name: "SUPER_USER", label: "Super User" }
```

### 4. Mock Data Handlers (`frontend/src/mocks/handlers.js`)

**Location:** Line 70

Add role to mock API responses:
```javascript
{ id: 7, name: "super_user", description: "Power User" }
```

### 5. Test Data (`frontend/src/tests/data.js`)

**Location:** Lines 590-593

Add role to test data:
```javascript
{
    id: 7,
    name: "SUPER_USER"
}
```

## Testing Integration

### 1. Cypress E2E Support (`frontend/cypress/support/e2e.js`)

**Location:** Lines 45-47

Add case for new user in the `FakeAuth` command:
```javascript
case "power-user":
    cy.contains("Power User").click();
    break;
```

### 2. Test Configuration (`frontend/cypress.config.js` and `frontend/cypress.config.ci.js`)

**Location:** Line 38

Add new E2E test files to the spec pattern:
```javascript
"cypress/e2e/editBudgetLineByPowerUser.cy.js"
```

### 3. Create E2E Test (`frontend/cypress/e2e/editBudgetLineByPowerUser.cy.js`)

Create test file to verify the new user can login and access appropriate features.

## Step-by-Step Implementation Process

1. **Define Role Permissions**: Start by determining what permissions the new role needs
2. **Backend Data**: Update `user_data.json5` with role definition and user entry
3. **Backend Auth**: Update authentication provider and environment settings
4. **Backend Logic**: Add authorization checks in relevant helper functions
5. **Frontend Constants**: Update role constants and application constants
6. **Frontend UI**: Add authentication UI components
7. **Frontend Mocks**: Update mock handlers and test data
8. **Testing**: Create Cypress tests and update test configurations
9. **Verification**: Test login flow and permission-based access

## Important Notes

- **OIDC ID Format**: Use the pattern `00000000-0000-1111-a111-000000000XXX` where XXX is incremental
- **Role ID**: Ensure role ID in user data matches the role array index + 1
- **Permissions**: Copy permission patterns from similar roles (e.g., BUDGET_TEAM for admin-level access)
- **Status**: New users should have `"ACTIVE"` status unless specifically needed otherwise
- **Division**: Assign appropriate division ID (1-9 based on existing divisions)

## Files Modified Summary

**Backend (5 files):**
- `backend/data_tools/data/user_data.json5`
- `backend/data_tools/src/disable_users/queries.py`
- `backend/ops_api/ops/auth/authentication_provider/fake_auth_provider.py`
- `backend/ops_api/ops/environment/default_settings.py`
- `backend/ops_api/ops/utils/agreements_helpers.py`

**Frontend (8 files):**
- `frontend/src/components/Auth/MultiAuthSection.jsx`
- `frontend/src/components/Users/User.constants.js`
- `frontend/src/constants.js`
- `frontend/src/mocks/handlers.js`
- `frontend/src/tests/data.js`
- `frontend/cypress/support/e2e.js`
- `frontend/cypress.config.js`
- `frontend/cypress.config.ci.js`

**New Files:**
- `frontend/cypress/e2e/editBudgetLineByPowerUser.cy.js` (or similar test file)

This comprehensive approach ensures the new user role is properly integrated across all system components with appropriate permissions, authentication, and testing coverage.
