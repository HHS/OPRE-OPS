# OPS API Performance Testing Suite

Performance testing suite for the OPRE OPS API using [Locust](https://locust.io/), an open-source load testing framework.

## Overview

This suite provides comprehensive performance testing capabilities for the OPS API with:

- **JWT Authentication**: Uses manually obtained JWT tokens that expire in 30 minutes
- **Request Throttling**: Configurable wait times between requests (default: 1-3 seconds)
- **Comprehensive Coverage**: Tests all major API endpoints (CANs, Agreements, Projects, Portfolios, Budget Line Items)
- **Realistic Load Patterns**: Weighted task distribution mimicking real user behavior
- **Web UI**: Real-time monitoring and control via browser interface
- **Detailed Reports**: HTML, CSV, and console reporting options

## Prerequisites

- Python 3.9 or higher
- Access to OPS API (default: http://localhost:8080)
- Valid JWT authentication token
- pipenv (for dependency management)

## Installation

The performance tests use the same dependencies as the backend API via pipenv.

1. **Navigate to the backend ops_api directory:**
   ```bash
   cd backend/ops_api
   ```

2. **Install dependencies (including Locust):**
   ```bash
   pipenv install --dev
   ```

3. **Navigate to the performance tests directory:**
   ```bash
   cd ../../performance_tests
   ```

## Getting Your JWT Token

### For Local Testing

1. **Start the OPS application:**
   ```bash
   # From project root
   docker compose up --build
   ```

2. **Log in manually via the web interface:**
   - Navigate to http://localhost:3000
   - Log in with your credentials

3. **Extract the JWT token:**

   **Option A - Browser DevTools:**
   - Open browser Developer Tools (F12)
   - Go to Application/Storage → Local Storage → http://localhost:3000
   - Find the `access_token` key and copy its value

   **Option B - Network Tab:**
   - Open Developer Tools → Network tab
   - Make any API request
   - Check the request headers for `Authorization: Bearer <token>`
   - Copy the token value (without "Bearer ")

4. **Set the token as an environment variable:**
   ```bash
   export JWT_TOKEN="your-jwt-token-here"
   ```

### For Remote Environments (Dev, Staging, etc.)

**IMPORTANT**: JWT tokens are environment-specific. You must obtain a token from the environment you want to test.

1. **Log in to the target environment:**
   - **Dev**: Navigate to https://dev.ops.opre.acf.gov/
   - **Staging**: Navigate to https://staging.ops.opre.acf.gov/
   - Log in with your credentials

2. **Extract the JWT token:**
   - Open browser Developer Tools (F12)
   - Go to Application/Storage → Local Storage
   - Click on the environment URL (e.g., `https://dev.ops.opre.acf.gov`)
   - Find the `access_token` key and copy its value

3. **Set both the token and API host:**
   ```bash
   # For dev environment
   export JWT_TOKEN="your-dev-token-here"
   export API_HOST="https://dev.ops.opre.acf.gov"

   # For staging environment
   export JWT_TOKEN="your-staging-token-here"
   export API_HOST="https://staging.ops.opre.acf.gov"
   ```

4. **Verify the token works:**
   ```bash
   # Test with curl or httpie
   curl -H "Authorization: Bearer $JWT_TOKEN" $API_HOST/api/v1/health/

   # Or with httpie
   http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"
   ```

## Usage

### Basic Usage (Web UI)

Run Locust with the web interface for interactive control.

**For Local Testing:**
```bash
export JWT_TOKEN="your-jwt-token-here"
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --host=http://localhost:8080
```

**For Remote Environments (Dev/Staging):**
```bash
export JWT_TOKEN="your-dev-token-here"
export API_HOST="https://dev.ops.opre.acf.gov"
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --host=$API_HOST
```

Then open your browser to http://localhost:8089 and configure:
- Number of users to simulate
- Spawn rate (users per second)
- Host (if different from command line)

### Headless Mode (No Web UI)

Run tests without the web interface using predefined parameters.

**For Local Testing:**
```bash
export JWT_TOKEN="your-jwt-token-here"
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=http://localhost:8080 \
  --users 10 \
  --spawn-rate 2 \
  --run-time 5m \
  --headless \
  --html ../../performance_tests/report.html
```

**For Remote Environments (Dev/Staging):**
```bash
export JWT_TOKEN="your-dev-token-here"
export API_HOST="https://dev.ops.opre.acf.gov"
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 10 \
  --spawn-rate 2 \
  --run-time 5m \
  --headless \
  --html ../../performance_tests/report.html
```

### Using Configuration File

The included `locust.conf` provides default settings:

```bash
export JWT_TOKEN="your-jwt-token-here"
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --config ../../performance_tests/locust.conf
```

### Environment Variables

Customize behavior via environment variables:

```bash
# Required
export JWT_TOKEN="your-jwt-token-here"

# Optional
export API_HOST="http://localhost:8080"
export MIN_WAIT="1000"  # Minimum wait time between requests (ms)
export MAX_WAIT="3000"  # Maximum wait time between requests (ms)

cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --host=$API_HOST
```

### Using .env File

Create a `.env` file in the `performance_tests` directory (see `.env.example`):

```bash
# Load environment variables from .env file
export $(cat performance_tests/.env | xargs)
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py
```

## Test Scenarios

The test suite includes the following scenarios weighted by frequency:

### High Frequency (10 tasks)
- List CANs
- List Agreements

### Medium-High Frequency (7-8 tasks)
- List Budget Line Items
- List Projects

### Medium Frequency (5-6 tasks)
- Get CAN details
- Get Agreement details
- Search/Filter operations
- List Portfolios

### Low Frequency (2-4 tasks)
- Get Budget Line Item details
- Get Project details
- Get Portfolio details
- History/Audit queries
- Current user profile

### Read-only Operations
All tests are **read-only** by default to avoid modifying production data. For write operation testing, you'll need to customize the test suite.

## Throttling

Request throttling is built-in to avoid overloading the API:

- **Default**: 1-3 seconds between requests per user
- **Configurable**: Set `MIN_WAIT` and `MAX_WAIT` environment variables (in milliseconds)

Example - More aggressive testing:
```bash
export MIN_WAIT="500"   # 0.5 seconds
export MAX_WAIT="1500"  # 1.5 seconds
```

Example - More conservative testing:
```bash
export MIN_WAIT="3000"  # 3 seconds
export MAX_WAIT="5000"  # 5 seconds
```

## Testing Against Remote Environments

### Quick Start for Dev Environment

1. **Get a fresh JWT token from dev:**
   - Navigate to https://dev.ops.opre.acf.gov/
   - Log in with your credentials
   - Open DevTools (F12) → Application → Local Storage → `https://dev.ops.opre.acf.gov`
   - Copy the `access_token` value

2. **Set environment variables:**
   ```bash
   export JWT_TOKEN="your-dev-token-here"
   export API_HOST="https://dev.ops.opre.acf.gov"
   ```

3. **Verify connectivity:**
   ```bash
   # Test the health endpoint
   curl -H "Authorization: Bearer $JWT_TOKEN" $API_HOST/api/v1/health/

   # Or with httpie
   http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"
   ```

4. **Run Locust:**
   ```bash
   cd backend/ops_api
   pipenv run locust -f ../../performance_tests/locustfile.py --host=$API_HOST
   ```

### Important Notes for Remote Testing

- **Token Expiration**: JWT tokens expire after 30 minutes. You'll need to get a fresh token and restart Locust if your tests run longer.
- **Environment Mismatch**: Tokens from one environment (e.g., localhost) will NOT work in another environment (e.g., dev). Always get the token from the environment you're testing.
- **Rate Limiting**: Remote environments may have rate limiting or firewall rules. Start with lower user counts and increase gradually.
- **Network Latency**: Response times will be higher when testing remote environments due to network latency.

### Using .env File for Remote Environments

Create a `.env` file in the `performance_tests` directory:

```bash
# performance_tests/.env
JWT_TOKEN=your-dev-token-here
API_HOST=https://dev.ops.opre.acf.gov
MIN_WAIT=2000
MAX_WAIT=5000
```

Then load it before running tests:

```bash
export $(cat performance_tests/.env | xargs)
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --host=$API_HOST
```

## Recommended Test Parameters

### Light Load (Development)
```bash
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=http://localhost:8080 \
  --users 5 \
  --spawn-rate 1 \
  --run-time 3m
```

### Medium Load
```bash
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=http://localhost:8080 \
  --users 20 \
  --spawn-rate 5 \
  --run-time 10m
```

### Heavy Load (Stress Test)
```bash
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=http://localhost:8080 \
  --users 50 \
  --spawn-rate 10 \
  --run-time 15m
```

## Interpreting Results

### Web UI Metrics

When using the web interface, monitor:

- **RPS (Requests Per Second)**: Total request throughput
- **Failures**: Count and percentage of failed requests
- **Response Times**: 50th, 95th, and 99th percentile latencies
- **Number of Users**: Current simulated user count

### Key Performance Indicators

- **Response Time p50**: Should be < 200ms for list endpoints
- **Response Time p95**: Should be < 500ms for list endpoints
- **Response Time p99**: Should be < 1000ms for list endpoints
- **Error Rate**: Should be < 1% under normal load
- **RPS**: Baseline throughput for comparison

### Generating Reports

**HTML Report:**
```bash
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --headless --html ../../performance_tests/report.html --run-time 5m
```

**CSV Export:**
```bash
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --headless --csv ../../performance_tests/results --run-time 5m
```

This creates (in the `performance_tests` directory):
- `results_stats.csv` - Request statistics
- `results_stats_history.csv` - Time-series data
- `results_failures.csv` - Failure details

## Troubleshooting

**For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

### Quick Fixes

#### "JWT_TOKEN environment variable is required"
- Make sure you've exported the JWT_TOKEN before running Locust
- Check the token hasn't expired (30 minute lifetime)
- Verify the token is valid by testing a manual API request

#### 400 Bad Request errors
- **Most common cause for `/api/v1/agreements/`:** Including `Content-Type: application/json` on GET requests (now fixed in the code)
- **Second cause:** Your JWT token has expired (30 min lifetime) - Get a fresh token from the browser after logging in
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and [SOLUTION.md](SOLUTION.md) for detailed diagnosis

#### High failure rates
- Check if JWT token has expired (get a new one)
- Verify API is running and accessible
- Reduce concurrent users or spawn rate
- Increase throttling (higher MIN_WAIT/MAX_WAIT)

#### Connection errors
- Verify the API host is correct
- Check that Docker containers are running: `docker compose ps`
- Test API manually: `curl http://localhost:8080/api/v1/users/me -H "Authorization: Bearer $JWT_TOKEN"`

#### Debugging with the debug script
```bash
cd backend/ops_api
export JWT_TOKEN="your-token"
pipenv run python ../../performance_tests/debug_test.py
```

## Advanced Usage

### Custom Test Scenarios

Edit `locustfile.py` and modify task weights in the `@task(weight)` decorators:

```python
@task(20)  # Increase weight for more frequent execution
def list_cans(self):
    ...

@task(1)   # Decrease weight for less frequent execution
def get_can_detail(self):
    ...
```

### Testing Specific Endpoints

Comment out unwanted tasks or create a custom locustfile:

```python
from locustfile import OPSAPIUser

class CustomUser(OPSAPIUser):
    @task
    def only_test_cans(self):
        self.list_cans()
```

### Distributed Testing

Run Locust in distributed mode for higher load:

```bash
# Master node
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --master

# Worker nodes (run multiple times in separate terminals)
cd backend/ops_api
pipenv run locust -f ../../performance_tests/locustfile.py --worker --master-host=localhost
```

## Best Practices

1. **Always use throttling** - Don't overwhelm your API
2. **Monitor your API server** - Watch CPU, memory, and database during tests
3. **Start small** - Begin with 5-10 users and scale up
4. **Run multiple iterations** - Single test runs can have anomalies
5. **Test realistic scenarios** - Match your actual user patterns
6. **Document baselines** - Record performance metrics for comparison
7. **Refresh JWT tokens** - Remember they expire in 30 minutes

## Additional Resources

- [Locust Documentation](https://docs.locust.io/)
- [Writing Performance Tests](https://docs.locust.io/en/stable/writing-a-locustfile.html)
- [Distributed Load Testing](https://docs.locust.io/en/stable/running-distributed.html)

## License

This performance testing suite is part of the OPRE OPS project.
