# JWT Authentication Architecture

## Overview

OPS uses OpenID Connect (OIDC) with HHS AMS (Access Management System) as the identity provider in production. Users authenticate via PIV card through HHS AMS, and the OPS backend exchanges the resulting authorization code for user claims, then issues its own RS256-signed JWTs for session management.

## High-Level Flow

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
│  Browser │──1──▶│   HHS AMS    │──2──▶│  Browser     │──3──▶│  OPS API │
│  (React) │      │  (PIV Login) │      │  /login?code │      │/auth/login│
└──────────┘      └──────────────┘      └──────────────┘      └──────────┘
                                                                     │
                                                                     4
                                                                     ▼
                                                               ┌──────────┐
                                                               │ HHS AMS  │
                                                               │ Token +  │
                                                               │ UserInfo │
                                                               └──────────┘
                                                                     │
                                                                     5
                                                                     ▼
                                                               ┌──────────┐
                                                               │  Issue   │
                                                               │  OPS JWT │
                                                               └──────────┘
```

1. User clicks "Sign in with HHS AMS" → browser redirects to HHS AMS authorization endpoint
2. User authenticates with PIV card → HHS AMS redirects back to OPS with `?code=AUTH_CODE&state=STATE`
3. Frontend sends auth code to OPS API
4. OPS API exchanges auth code with HHS AMS for tokens and user info
5. OPS API creates its own JWT and returns it to the frontend

## Step 1: Login Initiation (Frontend)

**Key files:**
- `frontend/src/components/Auth/MultiAuthSection.jsx`
- `frontend/src/components/Auth/auth.js`
- `frontend/src/helpers/backend.js`

When the user clicks "Sign in with HHS AMS":

1. Provider is stored in localStorage: `localStorage.setItem("activeProvider", "hhsams")`
2. A 64-character cryptographically random `state` token is generated and stored in localStorage as `ops-state-key`
3. The state token is appended with the provider name: `${stateKey}|hhsams`
4. Browser redirects to the HHS AMS authorization URL:

```
<HHS_AMS_AUTH_ENDPOINT>
  ?client_id=<CLIENT_ID>
  &response_type=code
  &scope=openid profile email
  &redirect_uri=<OPS_FRONTEND_URL>/login
  &state=<random_64_chars>|hhsams
  &nonce=<random_64_chars>
```

## Step 2: Callback Handling (Frontend)

After PIV authentication at HHS AMS, the browser is redirected back to:
```
<OPS_FRONTEND_URL>/login?code=AUTH_CODE&state=RETURNED_STATE
```

The `MultiAuthSection` component detects the query parameters and:

1. **Validates state** (CSRF protection): compares returned `state` to stored `ops-state-key`
2. **Extracts provider** from the state parameter (text after the `|`)
3. **Extracts the auth code** from the `code` query parameter
4. **Calls the backend**: POST to `/auth/login/`

```json
{
  "provider": "hhsams",
  "code": "AUTH_CODE_FROM_OAUTH"
}
```

## Step 3: Auth Code Exchange (Backend)

**Key files:**
- `backend/ops_api/ops/auth/api.py` — route handler
- `backend/ops_api/ops/auth/service.py` — business logic
- `backend/ops_api/ops/auth/authentication_gateway.py` — provider routing
- `backend/ops_api/ops/auth/authentication_provider/hhs_ams_provider.py` — HHS AMS specifics

The `/auth/login/` endpoint:

1. Receives `{ "code": "...", "provider": "hhsams" }`
2. Routes to the HHS AMS authentication provider via `AuthenticationGateway`
3. Exchanges the auth code for an OIDC token by calling HHS AMS's token endpoint:

```
POST <HHS_AMS_TOKEN_ENDPOINT>

  grant_type=authorization_code
  &code=AUTH_CODE
  &redirect_uri=<OPS_FRONTEND_URL>/login
  &client_id=<CLIENT_ID>
  &client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  &client_assertion=<signed_jwt>
```

The `client_assertion` is a JWT signed with OPS's RSA private key (RS256) containing:
```json
{
  "iss": "<client_id>",
  "sub": "<client_id>",
  "aud": "<token_endpoint_url>",
  "jti": "<uuid>",
  "exp": "<current_time + expiration>",
  "sso": "hhsams"
}
```

## Step 4: User Info Retrieval (Backend)

After receiving tokens from HHS AMS, the backend calls the userinfo endpoint:

```
GET <HHS_AMS_USERINFO_ENDPOINT>
Authorization: Bearer <access_token_from_hhs_ams>
```

The response is a JWT signed by HHS AMS. OPS verifies it using HHS AMS's public keys (fetched from the JWKS endpoint). The decoded claims include:

| Claim | Description |
|-------|-------------|
| `sub` | Unique user identifier (UUID) from HHS AMS |
| `email` | User's email address |
| `given_name` | First name |
| `family_name` | Last name |
| `hhsid` | HHS employee ID |
| `preferred_username` | Username |
| `name` | Full display name |

**Key file:** `backend/ops_api/ops/auth/auth_types.py` — `UserInfoDict` TypedDict

## Step 5: User Lookup and OPS JWT Issuance (Backend)

**Key file:** `backend/ops_api/ops/auth/utils.py`

### User Lookup

1. Search for user by `oidc_id` (the `sub` claim UUID)
2. If not found, fall back to email lookup (case-insensitive)
3. Update user record with latest claims:
   - `first_name` ← `given_name`
   - `last_name` ← `family_name`
   - `email` ← `email`
   - `oidc_id` ← `sub` (as UUID)
   - `hhs_id` ← `hhsid`

### JWT Creation

OPS creates its own JWT pair using Flask-JWT-Extended:

**Access Token:**
```json
{
  "sub": "<user.oidc_id>",
  "iat": "<issued_at>",
  "exp": "<expiration>",
  "fresh": true,
  "type": "access",
  "roles": ["BUDGET_TEAM", "USER"]
}
```

**Refresh Token:**
```json
{
  "sub": "<user.oidc_id>",
  "iat": "<issued_at>",
  "exp": "<expiration>",
  "type": "refresh",
  "roles": ["BUDGET_TEAM", "USER"]
}
```

**JWT Configuration** (`backend/ops_api/ops/environment/default_settings.py`):
- Algorithm: RS256
- Access token expiration: configurable (see `JWT_ACCESS_TOKEN_EXPIRES`)
- Refresh token expiration: configurable (see `JWT_REFRESH_TOKEN_EXPIRES`)
- Issuer and audience: environment-specific (set via configuration)
- Signing key: RSA private key from `JWT_PRIVATE_KEY` environment variable

### Session Storage

A `UserSession` record is created in the database:
- Deactivates all previous sessions for the user
- Stores: access_token, refresh_token, IP address, last_active_at
- Used for server-side session validation on every request

## Step 6: Frontend Token Storage and Usage

The frontend receives the response:
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG..."
}
```

**Storage:** Both tokens are stored in `localStorage`.

**Attachment to API requests:** Every API call includes:
```
Authorization: Bearer <access_token>
```

This is set automatically by RTK Query's `prepareHeaders` function in `frontend/src/api/opsAPI.js`.

### Frontend Token Validation

Before using a stored token, the frontend validates:
1. Token exists in localStorage
2. Token is not expired (checks `exp` claim)
3. Issuer matches expected value (configured per environment)

If expired but refresh token exists, automatic refresh is triggered.

## JWT Verification on API Requests (Backend)

**Key files:**
- `backend/ops_api/ops/auth/extension_config.py` — JWT manager configuration
- `backend/ops_api/ops/auth/decorators.py` — auth decorators
- `backend/ops_api/ops/__init__.py` — request lifecycle hooks

Every protected API request goes through:

1. **JWT Signature Verification**: Flask-JWT-Extended verifies the RS256 signature using the public key
2. **Expiration Check**: Rejects expired tokens
3. **User Lookup**: Loads the User from the database using the `sub` claim (oidc_id)
4. **Session Validation** (`check_user_session_function`):
   - Confirms user has an active session in the database
   - Validates the Bearer token matches the token stored in the latest session
   - Checks idle timeout (configured per FedRAMP AC-12 requirements)
   - Updates `last_active_at` timestamp
5. **Authorization Check** (if endpoint is protected with `@is_authorized`):
   - Extracts roles from the JWT claims
   - Checks if any role has the required permission (e.g., `PUT_AGREEMENT`)

### Extracting User Info from the JWT

```python
from flask_jwt_extended import current_user

# current_user is populated by the user_lookup_loader callback:
# It queries User by oidc_id (the JWT's "sub" claim)
user_email = current_user.email
user_full_name = f"{current_user.first_name} {current_user.last_name}"
user_roles = [role.name for role in current_user.roles]
```

## Token Refresh

**Endpoint:** POST `/auth/refresh/`
**Required:** Refresh token in Authorization header

Flow:
1. Validates refresh token (JWT with `type: "refresh"`)
2. Checks if the current access token is actually expired
3. If expired: creates a new access token (`fresh=False`), updates the UserSession
4. If not expired: returns the existing access token
5. Frontend stores the new access token and retries the failed request

The frontend triggers refresh automatically when:
- An API call returns 401 Unauthorized
- RTK Query middleware catches the error and calls `postRefresh()`

## Logout

**Endpoint:** POST `/auth/logout/`

Backend:
1. Deactivates all active sessions for the user
2. Logs an `OpsEvent` of type `LOGOUT`

Frontend:
1. Clears `access_token`, `refresh_token`, `activeProvider` from localStorage
2. Resets Redux auth state and RTK Query cache
3. Redirects to `/login`

## Idle Timeout

Per FedRAMP AC-12 requirements, sessions expire after a configurable period of inactivity:
- **Idle threshold:** Configurable via `SESSION_TIMEOUT_THRESHOLD`
- **JWT expiration:** Set slightly longer than idle threshold to provide a buffer
- Checked on every request except login, logout, refresh, and health-check endpoints
- If exceeded, the session is deactivated and an `IDLE_LOGOUT` event is logged

## Security Features

| Feature | Implementation |
|---------|---------------|
| CSRF protection (OAuth) | Random state parameter validated on callback |
| Token signing | RS256 (asymmetric RSA keys) |
| Session binding | Tokens stored in DB; every request validated against active session |
| Idle timeout | Server-side inactivity check per FedRAMP AC-12 |
| Single session | Previous sessions deactivated on new login |
| Safe redirects | `safeRedirectPath()` rejects protocol-relative and absolute URLs |
| CSRF (API) | Host/Referer header validation in production |
| Role-based access | Permissions checked via JWT roles claim + DB role definitions |

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/src/components/Auth/MultiAuthSection.jsx` | Login UI, OAuth redirect, callback handling |
| `frontend/src/components/Auth/auth.js` | Token validation, auth utilities |
| `frontend/src/api/opsAPI.js` | JWT attachment to API requests |
| `frontend/src/api/postRefresh.js` | Token refresh logic |
| `backend/ops_api/ops/auth/api.py` | Auth route handlers |
| `backend/ops_api/ops/auth/service.py` | Login/logout/refresh business logic |
| `backend/ops_api/ops/auth/utils.py` | JWT creation, user lookup, token exchange |
| `backend/ops_api/ops/auth/decorators.py` | `@is_authorized`, session validation |
| `backend/ops_api/ops/auth/extension_config.py` | Flask-JWT-Extended configuration |
| `backend/ops_api/ops/auth/authentication_gateway.py` | Provider routing |
| `backend/ops_api/ops/auth/authentication_provider/hhs_ams_provider.py` | HHS AMS OIDC implementation |
| `backend/ops_api/ops/environment/default_settings.py` | JWT settings (algorithm, expiration, issuer) |
| `backend/models/users.py` | User model with roles |
| `backend/models/auth.py` | UserSession model |
