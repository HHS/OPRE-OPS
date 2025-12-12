import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { changeRequests, divisions, roles, cans } from "./data";

export const handlers = [
    http.get(`https://localhost:8000/api/v1/agreements/`, () => {
        return HttpResponse.json([
            { id: 1, name: "Agreement 1" },
            { id: 2, name: "Agreement 2" }
        ]);
    }),
    http.get(`https://localhost:8000/api/v1/agreements/:id`, ({ params }) => {
        const { id } = params;

        return HttpResponse.json({ id, name: `Agreement ${id}` });
    }),

    http.get(`https://localhost:8000/api/v1/research-projects/`, () => {
        return HttpResponse.json([
            { id: 1, name: "Research Project 1" },
            { id: 2, name: "Research Project 2" }
        ]);
    }),

    http.post(`https://localhost:8000/api/v1/research-projects/`, async ({ request }) => {
        const body = await request.json();

        return HttpResponse.json({ id: 3, name: body.name }, { status: 201 });
    }),

    http.get(`https://localhost:8000/api/v1/change-requests/`, () => {
        return HttpResponse.json(changeRequests);
    }),

    http.get(`https://localhost:8000/auth/roles/`, () => {
        return HttpResponse.json(roles);
    }),

    http.get(`https://localhost:8000/api/v1/divisions/`, () => {
        return HttpResponse.json(divisions);
    }),

    http.patch("https://localhost:8000/api/v1/users/:id", async ({ request, params }) => {
        const { id } = params;
        const body = await request.json();

        return HttpResponse.json({ id, ...body }, { status: 200 });
    }),

    http.get("https://localhost:8000/api/v1/cans/", ({ request }) => {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        const offset = parseInt(url.searchParams.get("offset")) || 0;

        // Extract filter parameters
        const activePeriods = url.searchParams.getAll("active_period").map(Number);
        const transfers = url.searchParams.getAll("transfer");
        const portfolios = url.searchParams.getAll("portfolio");
        const budgetMin = url.searchParams.get("budget_min") ? parseFloat(url.searchParams.get("budget_min")) : null;
        const budgetMax = url.searchParams.get("budget_max") ? parseFloat(url.searchParams.get("budget_max")) : null;
        const fiscalYear = url.searchParams.get("fiscal_year") ? parseInt(url.searchParams.get("fiscal_year")) : null;

        // Apply filters
        let filteredCans = cans;

        // Filter by active period
        if (activePeriods.length > 0) {
            filteredCans = filteredCans.filter((can) => activePeriods.includes(can.active_period));
        }

        // Filter by transfer method
        if (transfers.length > 0) {
            filteredCans = filteredCans.filter(
                (can) =>
                    can.funding_details &&
                    can.funding_details.method_of_transfer &&
                    transfers.includes(can.funding_details.method_of_transfer)
            );
        }

        // Filter by portfolio abbreviation
        if (portfolios.length > 0) {
            filteredCans = filteredCans.filter(
                (can) => can.portfolio && portfolios.includes(can.portfolio.abbreviation)
            );
        }

        // Filter by budget range
        if (budgetMin !== null || budgetMax !== null) {
            filteredCans = filteredCans.filter((can) => {
                if (!can.funding_budgets || can.funding_budgets.length === 0) return false;

                const validBudgets = can.funding_budgets.filter(
                    (fb) => fb.budget !== null && (!fiscalYear || fb.fiscal_year === fiscalYear)
                );

                return validBudgets.some((fb) => {
                    if (budgetMin !== null && fb.budget < budgetMin) return false;
                    if (budgetMax !== null && fb.budget > budgetMax) return false;
                    return true;
                });
            });
        }

        // Note: my_cans filtering would require user context, which is not available in MSW mocks
        // For tests that need my_cans filtering, override the handler in the specific test

        const paginatedCans = filteredCans.slice(offset, offset + limit);

        return HttpResponse.json({
            data: paginatedCans,
            count: filteredCans.length,
            limit: limit,
            offset: offset
        });
    })
];

export const server = setupServer(...handlers);
