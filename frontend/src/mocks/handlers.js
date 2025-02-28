import { http, HttpResponse } from "msw";

const BACKEND_DOMAIN = import.meta.env.VITE_BACKEND_DOMAIN || "https://localhost:8000";

/**
 * Mock handlers for authentication endpoints
 */
export const authHandlers = [
    // Login endpoint
    http.post(`${BACKEND_DOMAIN}/auth/login/`, async ({ request }) => {
        const body = await request.json();
        const { provider } = body;

        // Mock different responses based on provider and code
        if (provider === "fakeauth") {
            return HttpResponse.json({
                access_token: "mock-access-token",
                refresh_token: "mock-refresh-token",
                token_type: "Bearer",
                expires_in: 3600
            });
        }

        if (provider === "logingov" || provider === "hhsams") {
            return HttpResponse.json({
                access_token: "mock-access-token",
                refresh_token: "mock-refresh-token",
                token_type: "Bearer",
                expires_in: 3600
            });
        }

        // Return error for unknown providers
        return new HttpResponse(JSON.stringify({ error: "Invalid provider" }), { status: 400 });
    }),

    // Refresh token endpoint
    http.post(`${BACKEND_DOMAIN}/auth/refresh/`, () => {
        return HttpResponse.json({
            access_token: "mock-refreshed-access-token",
            refresh_token: "mock-refreshed-refresh-token",
            token_type: "Bearer",
            expires_in: 3600
        });
    }),

    // Logout endpoint
    http.post(`${BACKEND_DOMAIN}/auth/logout/`, () => {
        return HttpResponse.json({ message: "Successfully logged out" });
    }),

    // User profile endpoint
    http.get(`${BACKEND_DOMAIN}/auth/profile/`, () => {
        return HttpResponse.json({
            id: "00000000-0000-1111-a111-000000000018",
            name: "Test User",
            email: "test.user@example.com",
            roles: ["admin"]
        });
    }),

    // Roles endpoint
    http.get(`${BACKEND_DOMAIN}/auth/roles/`, () => {
        return HttpResponse.json([
            { id: 1, name: "admin", description: "Administrator" },
            { id: 2, name: "user", description: "Regular User" },
            { id: 3, name: "system_owner", description: "System Owner" },
            { id: 4, name: "budget_team", description: "Budget Team Member" },
            { id: 5, name: "procurement_team", description: "Procurement Team Member" },
            { id: 6, name: "division_director", description: "Division Director" }
        ]);
    })
];

export const handlers = [...authHandlers];
