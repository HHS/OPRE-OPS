import { http, HttpResponse } from "msw";

const BACKEND_DOMAIN =
    (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN) ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "https://localhost:8000";

/**
 * Mock handlers for authentication endpoints
 */
const base64UrlEncode = (value) => {
    const json = typeof value === "string" ? value : JSON.stringify(value);
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const buildMockJwt = (payloadOverrides = {}) => {
    const header = { alg: "HS256", typ: "JWT" };
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload = {
        sub: "00000000-0000-1111-a111-000000000018",
        iss: "https://opre-ops-backend-dev",
        exp: nowSeconds + 60 * 60,
        ...payloadOverrides
    };
    return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.signature`;
};

const mockUser = {
    id: 18,
    oidc_id: "00000000-0000-1111-a111-000000000018",
    first_name: "Test",
    last_name: "User",
    full_name: "Test User",
    email: "test.user@example.com",
    roles: [{ id: 3, name: "system_owner", is_superuser: false }],
    is_superuser: false
};

export const authHandlers = [
    // Login endpoint
    http.post(`${BACKEND_DOMAIN}/auth/login/`, async ({ request }) => {
        const body = await request.json();
        const { provider } = body;
        const accessToken = buildMockJwt();
        const refreshToken = buildMockJwt({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 });

        // Mock different responses based on provider and code
        if (provider === "fakeauth") {
            return HttpResponse.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
                expires_in: 3600
            });
        }

        if (provider === "logingov" || provider === "hhsams") {
            return HttpResponse.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
                expires_in: 3600
            });
        }

        // Return error for unknown providers
        return new HttpResponse(JSON.stringify({ error: "Invalid provider" }), { status: 400 });
    }),

    // Refresh token endpoint
    http.post(`${BACKEND_DOMAIN}/auth/refresh/`, () => {
        const accessToken = buildMockJwt();
        const refreshToken = buildMockJwt({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 });
        return HttpResponse.json({
            access_token: accessToken,
            refresh_token: refreshToken,
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
        return HttpResponse.json(mockUser);
    }),

    // Roles endpoint
    http.get(`${BACKEND_DOMAIN}/auth/roles/`, () => {
        return HttpResponse.json([
            { id: 1, name: "admin", is_superuser: false, description: "Administrator" },
            { id: 2, name: "user", is_superuser: false, description: "Regular User" },
            { id: 3, name: "system_owner", is_superuser: false, description: "System Owner" },
            { id: 4, name: "budget_team", is_superuser: false, description: "Budget Team Member" },
            { id: 5, name: "procurement_team", is_superuser: false, description: "Procurement Team Member" },
            { id: 6, name: "division_director", is_superuser: false, description: "Division Director" },
            { id: 7, name: "super_user", is_superuser: true, description: "Power User" }
        ]);
    })
];

const procurementTrackers = [
    {
        id: 1,
        agreement_id: 9,
        name: "Tracker for Agreement 9",
        status: "IN_PROGRESS"
    },
    {
        id: 2,
        agreement_id: 12,
        name: "Tracker for Agreement 12",
        status: "NOT_STARTED"
    }
];

const procurementTrackerSteps = [
    {
        id: 101,
        procurement_tracker_id: 1,
        agreement_id: 9,
        step_type: "PRE_AWARD",
        title: "Initial review",
        status: "IN_PROGRESS"
    },
    {
        id: 102,
        procurement_tracker_id: 1,
        agreement_id: 9,
        step_type: "ACQUISITION_PLANNING",
        title: "Acquisition planning",
        status: "NOT_STARTED",
        task_completed_by: null,
        date_completed: null,
        notes: ""
    },
    {
        id: 201,
        procurement_tracker_id: 2,
        agreement_id: 12,
        step_type: "PRE_AWARD",
        title: "Initial review",
        status: "NOT_STARTED"
    }
];

export const procurementHandlers = [
    http.get(`${BACKEND_DOMAIN}/procurement-trackers/`, ({ request }) => {
        const url = new URL(request.url);
        const agreementIds = url.searchParams.getAll("agreement_id").map((value) => Number(value));
        const limit = Number(url.searchParams.get("limit") || 10);
        const offset = Number(url.searchParams.get("offset") || 0);

        const filtered = agreementIds.length
            ? procurementTrackers.filter((tracker) => agreementIds.includes(tracker.agreement_id))
            : procurementTrackers;
        const data = filtered.slice(offset, offset + limit);

        return HttpResponse.json({
            data,
            count: filtered.length,
            limit,
            offset
        });
    }),
    http.get(`${BACKEND_DOMAIN}/procurement-trackers/:id`, ({ params }) => {
        const id = Number(params.id);
        const tracker = procurementTrackers.find((item) => item.id === id);
        if (!tracker) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(tracker);
    }),
    http.get(`${BACKEND_DOMAIN}/procurement-tracker-steps`, ({ request }) => {
        const url = new URL(request.url);
        const agreementId = url.searchParams.get("agreement_id");
        const limit = Number(url.searchParams.get("limit") || 10);
        const offset = Number(url.searchParams.get("offset") || 0);

        const filtered = agreementId
            ? procurementTrackerSteps.filter((step) => step.agreement_id === Number(agreementId))
            : procurementTrackerSteps;
        const data = filtered.slice(offset, offset + limit);

        return HttpResponse.json({
            data,
            count: filtered.length,
            limit,
            offset
        });
    }),
    http.get(`${BACKEND_DOMAIN}/procurement-tracker-steps/:id`, ({ params }) => {
        const id = Number(params.id);
        const step = procurementTrackerSteps.find((item) => item.id === id);
        if (!step) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(step);
    }),
    http.patch(`${BACKEND_DOMAIN}/procurement-tracker-steps/:id`, async ({ params, request }) => {
        const id = Number(params.id);
        const payload = await request.json();
        const stepIndex = procurementTrackerSteps.findIndex((item) => item.id === id);
        if (stepIndex === -1) {
            return new HttpResponse(null, { status: 404 });
        }

        procurementTrackerSteps[stepIndex] = {
            ...procurementTrackerSteps[stepIndex],
            ...payload
        };
        return HttpResponse.json(procurementTrackerSteps[stepIndex]);
    })
];

export const userHandlers = [
    http.get(`${BACKEND_DOMAIN}/api/v1/users/`, ({ request }) => {
        const url = new URL(request.url);
        const oidcId = url.searchParams.get("oidc_id");
        if (oidcId && oidcId !== mockUser.oidc_id) {
            return HttpResponse.json([]);
        }
        return HttpResponse.json([mockUser]);
    }),
    http.get(`${BACKEND_DOMAIN}/api/v1/users/:id`, ({ params }) => {
        if (String(params.id) !== String(mockUser.id)) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(mockUser);
    })
];

export const handlers = [...authHandlers, ...procurementHandlers, ...userHandlers];
