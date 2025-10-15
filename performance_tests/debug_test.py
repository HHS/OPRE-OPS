"""
Debug script to test API endpoints and identify issues.
"""
import os
import sys

# Add check for JWT token
jwt_token = os.getenv('JWT_TOKEN')
if not jwt_token:
    print("ERROR: JWT_TOKEN environment variable not set")
    sys.exit(1)

print(f"JWT Token length: {len(jwt_token)}")
print(f"JWT Token (first 50 chars): {jwt_token[:50]}...")

# Try importing locust
try:
    import requests
    from locust import HttpUser
    print("\n✓ Locust and requests imported successfully")
except ImportError as e:
    print(f"\n✗ Import error: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Test with requests library first
print("\n" + "="*70)
print("Testing with requests library")
print("="*70)

headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test /api/v1/users/me first (simpler endpoint)
print("\n1. Testing /api/v1/users/me...")
try:
    response = requests.get('http://localhost:8080/api/v1/users/me', headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
    else:
        print(f"   Error: {response.text[:200]}")
except Exception as e:
    print(f"   Exception: {e}")

# Test /api/v1/agreements/
print("\n2. Testing /api/v1/agreements/...")
try:
    response = requests.get('http://localhost:8080/api/v1/agreements/', headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Success! Got {len(data)} agreements")
        if data:
            print(f"   First agreement ID: {data[0].get('id')}")
    else:
        print(f"   Error: {response.text[:500]}")
except Exception as e:
    print(f"   Exception: {e}")

# Test /api/v1/cans/
print("\n3. Testing /api/v1/cans/...")
try:
    response = requests.get('http://localhost:8080/api/v1/cans/', headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Success! Got {len(data)} CANs")
    else:
        print(f"   Error: {response.text[:500]}")
except Exception as e:
    print(f"   Exception: {e}")

# Now test with Locust's client
print("\n" + "="*70)
print("Testing with Locust HttpUser")
print("="*70)

from locust import HttpUser, between
from locust.clients import HttpSession

print("\n4. Testing with Locust client...")
try:
    # Create a Locust HTTP session
    session = HttpSession(base_url='http://localhost:8080', request_event=None, user=None)

    # Test agreements endpoint
    response = session.get('/api/v1/agreements/', headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Success! Locust client works correctly")
    else:
        print(f"   Error: {response.text[:500]}")
        print(f"   Request URL: {response.request.url}")
        print(f"   Request headers: {dict(response.request.headers)}")
except Exception as e:
    print(f"   Exception: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*70)
print("Debug complete")
print("="*70)
