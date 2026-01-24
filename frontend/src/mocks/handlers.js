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
        display_name: "ProcurementTracker#1",
        status: "ACTIVE",
        tracker_type: "DEFAULT",
        procurement_action: null,
        active_step_number: 5,
        created_on: "2024-01-15T10:00:00.000Z",
        updated_on: "2024-01-20T14:30:00.000Z"
    },
    {
        id: 2,
        agreement_id: 12,
        display_name: "ProcurementTracker#2",
        status: "ACTIVE",
        tracker_type: "DEFAULT",
        procurement_action: null,
        active_step_number: 1,
        created_on: "2024-01-10T09:00:00.000Z",
        updated_on: "2024-01-10T09:00:00.000Z"
    },
    {
        id: 3,
        agreement_id: 14,
        display_name: "ProcurementTracker#3",
        status: "ACTIVE",
        tracker_type: "DEFAULT",
        procurement_action: null,
        active_step_number: 3,
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-22T16:45:00.000Z"
    },
    {
        id: 4,
        agreement_id: 13,
        display_name: "ProcurementTracker#4",
        status: "ACTIVE",
        tracker_type: "DEFAULT",
        procurement_action: null,
        active_step_number: 4,
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-23T10:30:00.000Z"
    }
];

const procurementTrackerSteps = [
    // Tracker 1 - Agreement 9
    {
        id: 101,
        procurement_tracker_id: 1,
        step_number: 5,
        step_class: "default_step",
        step_type: "PRE_AWARD",
        display_name: "Step 5: PRE_AWARD",
        status: "ACTIVE",
        step_start_date: "2024-01-20",
        step_completed_date: null,
        created_on: "2024-01-15T10:00:00.000Z",
        updated_on: "2024-01-20T14:30:00.000Z"
    },
    {
        id: 102,
        procurement_tracker_id: 1,
        step_number: 1,
        step_class: "default_step",
        step_type: "ACQUISITION_PLANNING",
        display_name: "Step 1: ACQUISITION_PLANNING",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-15T10:00:00.000Z",
        updated_on: "2024-01-15T10:00:00.000Z"
    },
    // Tracker 2 - Agreement 12
    {
        id: 201,
        procurement_tracker_id: 2,
        step_number: 5,
        step_class: "default_step",
        step_type: "PRE_AWARD",
        display_name: "Step 5: PRE_AWARD",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-10T09:00:00.000Z",
        updated_on: "2024-01-10T09:00:00.000Z"
    },
    // Tracker 3 - Agreement 14
    {
        id: 301,
        procurement_tracker_id: 3,
        step_number: 1,
        step_class: "default_step",
        step_type: "ACQUISITION_PLANNING",
        display_name: "Step 1: ACQUISITION_PLANNING",
        status: "COMPLETED",
        step_start_date: "2024-01-12",
        step_completed_date: "2024-01-15",
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-15T16:00:00.000Z"
    },
    {
        id: 302,
        procurement_tracker_id: 3,
        step_number: 2,
        step_class: "default_step",
        step_type: "PRE_SOLICITATION",
        display_name: "Step 2: PRE_SOLICITATION",
        status: "COMPLETED",
        step_start_date: "2024-01-16",
        step_completed_date: "2024-01-19",
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-19T14:00:00.000Z"
    },
    {
        id: 303,
        procurement_tracker_id: 3,
        step_number: 3,
        step_class: "default_step",
        step_type: "SOLICITATION",
        display_name: "Step 3: SOLICITATION",
        status: "ACTIVE",
        step_start_date: "2024-01-20",
        step_completed_date: null,
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-22T16:45:00.000Z"
    },
    {
        id: 304,
        procurement_tracker_id: 3,
        step_number: 4,
        step_class: "default_step",
        step_type: "EVALUATION",
        display_name: "Step 4: EVALUATION",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-12T11:00:00.000Z"
    },
    {
        id: 305,
        procurement_tracker_id: 3,
        step_number: 5,
        step_class: "default_step",
        step_type: "PRE_AWARD",
        display_name: "Step 5: PRE_AWARD",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-12T11:00:00.000Z"
    },
    {
        id: 306,
        procurement_tracker_id: 3,
        step_number: 6,
        step_class: "default_step",
        step_type: "AWARD",
        display_name: "Step 6: AWARD",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-12T11:00:00.000Z",
        updated_on: "2024-01-12T11:00:00.000Z"
    },
    // Tracker 4 - Agreement 13
    {
        id: 401,
        procurement_tracker_id: 4,
        step_number: 1,
        step_class: "default_step",
        step_type: "ACQUISITION_PLANNING",
        display_name: "Step 1: ACQUISITION_PLANNING",
        status: "COMPLETED",
        step_start_date: "2024-01-18",
        step_completed_date: "2024-01-19",
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-19T17:00:00.000Z"
    },
    {
        id: 402,
        procurement_tracker_id: 4,
        step_number: 2,
        step_class: "default_step",
        step_type: "PRE_SOLICITATION",
        display_name: "Step 2: PRE_SOLICITATION",
        status: "COMPLETED",
        step_start_date: "2024-01-20",
        step_completed_date: "2024-01-21",
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-21T15:00:00.000Z"
    },
    {
        id: 403,
        procurement_tracker_id: 4,
        step_number: 3,
        step_class: "default_step",
        step_type: "SOLICITATION",
        display_name: "Step 3: SOLICITATION",
        status: "COMPLETED",
        step_start_date: "2024-01-22",
        step_completed_date: "2024-01-22",
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-22T18:00:00.000Z"
    },
    {
        id: 404,
        procurement_tracker_id: 4,
        step_number: 4,
        step_class: "default_step",
        step_type: "EVALUATION",
        display_name: "Step 4: EVALUATION",
        status: "ACTIVE",
        step_start_date: "2024-01-23",
        step_completed_date: null,
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-23T10:30:00.000Z"
    },
    {
        id: 405,
        procurement_tracker_id: 4,
        step_number: 5,
        step_class: "default_step",
        step_type: "PRE_AWARD",
        display_name: "Step 5: PRE_AWARD",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-18T08:00:00.000Z"
    },
    {
        id: 406,
        procurement_tracker_id: 4,
        step_number: 6,
        step_class: "default_step",
        step_type: "AWARD",
        display_name: "Step 6: AWARD",
        status: "PENDING",
        step_start_date: null,
        step_completed_date: null,
        created_on: "2024-01-18T08:00:00.000Z",
        updated_on: "2024-01-18T08:00:00.000Z"
    }
];

export const procurementHandlers = [
    // RTK Query endpoints (with /api/v1/ prefix)
    // Handler for requests with trailing slash
    http.get(`${BACKEND_DOMAIN}/api/v1/procurement-trackers/`, ({ request }) => {
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
    // Handler for requests without trailing slash (RTK Query pattern)
    http.get(`${BACKEND_DOMAIN}/api/v1/procurement-trackers`, ({ request }) => {
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
    http.get(`${BACKEND_DOMAIN}/api/v1/procurement-trackers/:id`, ({ params }) => {
        const id = Number(params.id);
        const tracker = procurementTrackers.find((item) => item.id === id);
        if (!tracker) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(tracker);
    }),
    http.get(`${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps`, ({ request }) => {
        const url = new URL(request.url);
        const agreementId = url.searchParams.get("agreement_id");
        const limit = Number(url.searchParams.get("limit") || 10);
        const offset = Number(url.searchParams.get("offset") || 0);

        const filtered = agreementId
            ? (() => {
                  // Find trackers for this agreement
                  const trackerIds = procurementTrackers
                      .filter((tracker) => tracker.agreement_id === Number(agreementId))
                      .map((tracker) => tracker.id);
                  // Filter steps belonging to those trackers
                  return procurementTrackerSteps.filter((step) => trackerIds.includes(step.procurement_tracker_id));
              })()
            : procurementTrackerSteps;
        const data = filtered.slice(offset, offset + limit);

        return HttpResponse.json({
            data,
            count: filtered.length,
            limit,
            offset
        });
    }),
    http.get(`${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps/:id`, ({ params }) => {
        const id = Number(params.id);
        const step = procurementTrackerSteps.find((item) => item.id === id);
        if (!step) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(step);
    }),
    http.patch(`${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps/:id`, async ({ params, request }) => {
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
