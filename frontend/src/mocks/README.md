# Mock Service Worker (MSW) Setup

This directory contains the setup for Mock Service Worker (MSW), which is used to mock API requests during development and testing.

## Overview

MSW intercepts network requests at the network level, allowing you to mock API responses without modifying your application code. This is particularly useful for:

- Testing components that depend on API responses
- Developing UI components without a backend
- Simulating error scenarios

## Files

- `handlers.js`: Contains the request handlers that define how MSW should respond to specific API requests
- `browser.js`: Setup for MSW in the browser environment (used during development)
- `server.js`: Setup for MSW in Node.js environment (used during testing with Vitest)

## Usage in Tests

To use MSW in your Vitest tests:

1. Import the server from `src/mocks/server.js` in your test file
2. Use the server to override handlers for specific tests if needed

Example:

```javascript
import { server } from "../../mocks/server";
import { rest } from "msw";
import { describe, it, expect, beforeEach } from "vitest";

describe("MyComponent", () => {
    it("handles API error", async () => {
        // Override the default handler for a specific test
        server.use(
            rest.get("/api/data", (req, res, ctx) => {
                return res(ctx.status(500), ctx.json({ error: "Server error" }));
            })
        );

        // Your test code here
    });
});
```

## Usage in Development

MSW is **disabled by default** in development environments as of January 2026. The application now connects directly to the backend API during development.

MSW remains enabled for automated testing (see "Usage in Tests" above).

If you need to enable MSW temporarily for development purposes, you can set the environment variable:

```
VITE_ENABLE_MSW=true
```

Note: This is not recommended for regular development workflows.

## Adding New Mock Handlers

To add a new mock handler:

1. Add your handler to the `authHandlers` array in `handlers.js`
2. Follow the pattern of existing handlers, using the appropriate HTTP method and endpoint

Example:

```javascript
rest.get(`${BACKEND_DOMAIN}/api/new-endpoint`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: "Your mock data here" }));
});
```

## Benefits

- **Isolation**: Test components in isolation without depending on actual API endpoints
- **Reliability**: Tests don't fail due to backend issues
- **Speed**: Tests run faster without actual network requests
- **Flexibility**: Easily simulate different API responses, including error scenarios
