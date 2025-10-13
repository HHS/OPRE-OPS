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

## Installation

1. **Navigate to the performance tests directory:**
   ```bash
   cd backend/performance_tests
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Getting Your JWT Token

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

## Usage

### Basic Usage (Web UI)

Run Locust with the web interface for interactive control:

```bash
export JWT_TOKEN="your-jwt-token-here"
locust -f locustfile.py --host=http://localhost:8080
```

Then open your browser to http://localhost:8089 and configure:
- Number of users to simulate
- Spawn rate (users per second)
- Host (if different from command line)

### Headless Mode (No Web UI)

Run tests without the web interface using predefined parameters:

```bash
export JWT_TOKEN="your-jwt-token-here"
locust -f locustfile.py \
  --host=http://localhost:8080 \
  --users 10 \
  --spawn-rate 2 \
  --run-time 5m \
  --headless \
  --html report.html
```

### Using Configuration File

The included `locust.conf` provides default settings:

```bash
export JWT_TOKEN="your-jwt-token-here"
locust -f locustfile.py --config locust.conf
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

locust -f locustfile.py --host=$API_HOST
```

### Using .env File

Create a `.env` file (see `.env.example`):

```bash
# Load environment variables from .env file
export $(cat .env | xargs)
locust -f locustfile.py
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

## Recommended Test Parameters

### Light Load (Development)
```bash
locust -f locustfile.py \
  --host=http://localhost:8080 \
  --users 5 \
  --spawn-rate 1 \
  --run-time 3m
```

### Medium Load
```bash
locust -f locustfile.py \
  --host=http://localhost:8080 \
  --users 20 \
  --spawn-rate 5 \
  --run-time 10m
```

### Heavy Load (Stress Test)
```bash
locust -f locustfile.py \
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
locust -f locustfile.py --headless --html report.html --run-time 5m
```

**CSV Export:**
```bash
locust -f locustfile.py --headless --csv results --run-time 5m
```

This creates:
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
cd backend/performance_tests
pip install -r requirements.txt
export JWT_TOKEN="your-token"
python3 debug_test.py
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
locust -f locustfile.py --master

# Worker nodes (run multiple times)
locust -f locustfile.py --worker --master-host=localhost
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
