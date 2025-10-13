# Troubleshooting Guide

## 400 Bad Request Error

If you're seeing `HTTPError('400 Client Error: BAD REQUEST')` when running Locust tests, here are the most common causes and solutions:

### 1. Expired JWT Token (Most Common)

**Symptoms:**
- 400 errors on all endpoints
- Tests were working before but stopped

**Solution:**
JWT tokens expire after 30 minutes. Get a fresh token:

```bash
# 1. Log into http://localhost:3000
# 2. Open Browser DevTools (F12)
# 3. Go to Application → Local Storage → http://localhost:3000
# 4. Copy the value of 'access_token'
# 5. Update your environment:

export JWT_TOKEN="your-new-token-here"
```

### 2. Invalid JWT Token Format

**Symptoms:**
- 422 errors with "Bad Authorization header" message
- 400 errors immediately on test start

**Solution:**
Ensure your JWT token is set correctly without extra quotes or spaces:

```bash
# CORRECT
export JWT_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# WRONG - has extra quotes
export JWT_TOKEN="'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'"

# WRONG - missing quotes
export JWT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. API Server Not Running

**Symptoms:**
- Connection refused errors
- No response from server

**Solution:**
```bash
# Check if Docker containers are running
docker compose ps

# If not running, start them
docker compose up --build
```

### 4. Wrong API Host

**Symptoms:**
- Connection errors
- Timeout errors

**Solution:**
Verify the API host is correct:

```bash
# For local Docker setup
locust -f locustfile.py --host=http://localhost:8080

# Check that the backend is accessible
curl http://localhost:8080/api/health-check
```

### 5. Missing Query Parameters

**Symptoms:**
- 400 errors only on specific endpoints (e.g., `/api/v1/agreements/`)
- Works with curl but not with Locust

**Issue:**
Some endpoints may have required query parameters or expect parameters in a specific format.

**Debugging:**
1. Check the backend logs for more details:
```bash
docker compose logs backend | grep -A 5 "400"
```

2. Compare working curl request vs Locust request:
```bash
# Working curl example
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8080/api/v1/agreements/

# Enable verbose logging in Locust
locust -f locustfile.py --host=http://localhost:8080 --loglevel DEBUG
```

### 6. Content-Type Header on GET Requests (ACTUAL ROOT CAUSE)

**Symptoms:**
- 400 Bad Request on `/api/v1/agreements/` specifically
- Other endpoints work fine
- Empty response body: `{}`
- HTTPie and curl work, but your code doesn't

**Cause:**
The `/api/v1/agreements/` endpoint **rejects GET requests that include `Content-Type: application/json`** header. This is unusual behavior but confirmed through testing.

**Solution:**
**DO NOT** set `Content-Type` header globally for all requests. Only set it for POST/PUT/PATCH requests with a body.

```python
# ❌ WRONG - causes 400 on GET /api/v1/agreements/
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'  # Don't set this globally!
}

# ✓ CORRECT - omit Content-Type for GET requests
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'  # This is fine
}

# ✓ CORRECT - only set Content-Type for requests with body
headers = {'Authorization': f'Bearer {token}'}
response = requests.post(url, json=data, headers=headers)  # requests adds Content-Type automatically
```

### 7. User Session Validation

**Symptoms:**
- 400 errors after successful authentication
- Errors about invalid user session

**Cause:**
The backend validates user sessions (see `backend/ops_api/ops/__init__.py:199`)

**Solution:**
Ensure you're using a token from a real login session, not a manually crafted token.

## Debugging Steps

### Step 1: Test with curl

First, verify the endpoint works with curl:

```bash
export JWT_TOKEN="your-token-here"

# Test simple endpoint
curl -v -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/v1/users/me

# Test agreements endpoint
curl -v -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/v1/agreements/
```

If curl returns 400, the problem is with your token or the API server, not Locust.

### Step 2: Run Debug Script

Use the provided debug script to isolate the issue:

```bash
cd backend/performance_tests
pip install -r requirements.txt
export JWT_TOKEN="your-token-here"
python3 debug_test.py
```

This will test both the `requests` library and Locust's HTTP client.

### Step 3: Check Backend Logs

Look at the backend API logs for detailed error messages:

```bash
# View real-time logs
docker compose logs -f backend

# Search for errors
docker compose logs backend | grep -i "error\|400\|exception"
```

### Step 4: Enable Locust Debug Logging

Run Locust with detailed logging:

```bash
export JWT_TOKEN="your-token-here"
locust -f locustfile.py \
  --host=http://localhost:8080 \
  --loglevel DEBUG \
  --users 1 \
  --spawn-rate 1
```

Watch for error messages in the Locust output and web UI.

### Step 5: Test Individual Endpoints

Create a minimal test to isolate the problem:

```python
# minimal_test.py
import os
from locust import HttpUser, task, between

class MinimalTest(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        jwt_token = os.getenv('JWT_TOKEN')
        self.client.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json',
        }

    @task
    def test_users_me(self):
        response = self.client.get('/api/v1/users/me', catch_response=True)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        if response.status_code != 200:
            response.failure(f"Got {response.status_code}")
        else:
            response.success()
```

Run it:
```bash
locust -f minimal_test.py --host=http://localhost:8080 --users 1
```

## Common Error Messages

### "Bad Authorization header. Expected 'Authorization: Bearer <JWT>'"

**Cause:** JWT token not properly formatted or missing

**Fix:**
```bash
# Verify token is set
echo $JWT_TOKEN | wc -c  # Should be ~800 characters

# Reset it properly
export JWT_TOKEN="your-fresh-token-from-browser"
```

### "{'detail': 'Signature verification failed'}"

**Cause:** JWT token is invalid or was signed with different keys

**Fix:** Get a fresh token from the running application (not from old sessions)

### "Expecting value: line 1 column 1 (char 0)"

**Cause:** Response is not valid JSON (usually an HTML error page)

**Fix:** Check backend logs to see the actual error. The backend is returning an HTML error page instead of JSON.

## Still Having Issues?

1. **Verify Docker setup:**
```bash
docker compose down -v
docker compose up --build
```

2. **Check authentication:**
   - Log out and log back in
   - Get a fresh JWT token
   - Verify you can access the frontend at http://localhost:3000

3. **Review backend configuration:**
   - Check `backend/ops_api/ops/environment/default_settings.py`
   - Verify JWT keys are properly configured

4. **Test with simple Python script:**
```python
import os
import requests

token = os.getenv('JWT_TOKEN')
headers = {'Authorization': f'Bearer {token}'}

response = requests.get('http://localhost:8080/api/v1/users/me', headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

If this works but Locust doesn't, there may be a Locust-specific issue with how it's sending requests.
