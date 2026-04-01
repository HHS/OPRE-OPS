// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { server } from "../tests/mocks";
import { http, HttpResponse } from "msw";
import { setupStore } from "../store";
import { opsApi } from "./opsAPI";

// Helper function to create a test store for RTK Query testing
function setupApiStore(api, preloadedState) {
    return {
        store: setupStore(preloadedState)
    };
}

beforeEach(() => {
    global.localStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn()
    };
});

describe("opsAPI - Agreements Pagination", () => {
    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    describe("Query Parameter Construction", () => {
        it("should add pagination parameters when page and limit provided", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 0,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("limit=10");
            expect(capturedUrl).toContain("offset=0");
        });

        it("should calculate offset correctly (offset = page * limit)", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 50,
                        limit: 10,
                        offset: 20
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 2, // page 2 with limit 10 should be offset 20
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("limit=10");
            expect(capturedUrl).toContain("offset=20");
        });

        it("should use default limit of 10 when not specified", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 0,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0
                    // limit not specified, should default to 10
                })
            );

            expect(capturedUrl).toContain("limit=10");
        });

        it("should omit pagination params when page not provided", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json([
                        { id: 1, name: "Agreement 1" },
                        { id: 2, name: "Agreement 2" }
                    ]);
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false
                    // page not provided
                })
            );

            expect(capturedUrl).not.toContain("limit=");
            expect(capturedUrl).not.toContain("offset=");
        });
    });

    describe("transformResponse", () => {
        it("should transform new wrapped format with 'data' key", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json({
                        data: [
                            { id: 1, name: "Agreement 1" },
                            { id: 2, name: "Agreement 2" }
                        ],
                        count: 50,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(result.data).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0,
                totals: null
            });
        });

        it("should handle old 'agreements' key format (backward compatibility)", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json({
                        agreements: [
                            { id: 1, name: "Agreement 1" },
                            { id: 2, name: "Agreement 2" }
                        ],
                        count: 50,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(result.data).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0,
                totals: null
            });
        });

        it("should handle legacy array format (backward compatibility)", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json([
                        { id: 1, name: "Agreement 1" },
                        { id: 2, name: "Agreement 2" }
                    ]);
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false
                })
            );

            expect(result.data).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 2,
                limit: 2,
                offset: 0,
                totals: null
            });
        });

        it("should handle empty wrapped response", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json({
                        data: [],
                        count: 0,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(result.data).toEqual({
                agreements: [],
                count: 0,
                limit: 10,
                offset: 0,
                totals: null
            });
        });

        it("should preserve all metadata (count, limit, offset)", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json({
                        data: [{ id: 1, name: "Agreement 1" }],
                        count: 100,
                        limit: 25,
                        offset: 50
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 2,
                    limit: 25
                })
            );

            expect(result.data.count).toBe(100);
            expect(result.data.limit).toBe(25);
            expect(result.data.offset).toBe(50);
        });
    });

    describe("Filter Query Parameters", () => {
        it("should include project_id params for projectTitle filter", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], count: 0, limit: 10, offset: 0 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [
                            { id: 1, title: "Project A" },
                            { id: 2, title: "Project B" }
                        ],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("project_id=1");
            expect(capturedUrl).toContain("project_id=2");
        });

        it("should include contract_number params for contractNumber filter", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], count: 0, limit: 10, offset: 0 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: [
                            { id: "CT-001", title: "CT-001" },
                            { id: "CT-002", title: "CT-002" }
                        ]
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("contract_number=CT-001");
            expect(capturedUrl).toContain("contract_number=CT-002");
        });
    });

    describe("Pagination with Filters", () => {
        it("should include pagination params with fiscal year filter", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 20,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store
                .dispatch(
                    opsApi.endpoints.getAgreements.initiate({
                        filters: {
                            fiscalYear: [{ title: "2024" }],
                            budgetLineStatus: [],
                            portfolio: []
                        },
                        onlyMy: false,
                        sortConditions: null,
                        sortDescending: false,
                        page: 0,
                        limit: 10
                    })
                )
                .unwrap();

            expect(capturedUrl).toContain("fiscal_year=2024");
            expect(capturedUrl).toContain("limit=10");
            expect(capturedUrl).toContain("offset=0");
        });

        it("should include pagination params with only_my filter", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 5,
                        limit: 10,
                        offset: 0
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: true,
                    sortConditions: null,
                    sortDescending: false,
                    page: 0,
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("only_my=true");
            expect(capturedUrl).toContain("limit=10");
            expect(capturedUrl).toContain("offset=0");
        });
    });

    describe("Pagination with Sorting", () => {
        it("should include pagination params with sort conditions", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({
                        data: [],
                        count: 30,
                        limit: 10,
                        offset: 10
                    });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [],
                        portfolio: [],
                        projectTitle: [],
                        agreementType: [],
                        agreementName: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: "name",
                    sortDescending: false,
                    page: 1,
                    limit: 10
                })
            );

            expect(capturedUrl).toContain("sort_conditions=name");
            expect(capturedUrl).toContain("sort_descending=false");
            expect(capturedUrl).toContain("limit=10");
            expect(capturedUrl).toContain("offset=10");
        });
    });

    describe("Fiscal Year Query Normalization", () => {
        it("normalizes fiscal year values from primitive and object formats", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], count: 0, limit: 10, offset: 0 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [2024, { id: 2025 }, { title: "FY 2026" }, { title: "2027" }],
                        budgetLineStatus: [],
                        portfolio: [],
                        agreementName: [],
                        agreementType: [],
                        projectTitle: [],
                        contractNumber: []
                    },
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false
                })
            );

            expect(capturedUrl).toContain("fiscal_year=2024");
            expect(capturedUrl).toContain("fiscal_year=2025");
            expect(capturedUrl).toContain("fiscal_year=2026");
            expect(capturedUrl).toContain("fiscal_year=2027");
        });
    });

    describe("Query Construction Matrix", () => {
        it("includes all supported query params when provided", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], count: 1, limit: 25, offset: 25 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {
                        fiscalYear: [{ title: "FY 2026" }],
                        budgetLineStatus: [{ status: "IN_REVIEW" }],
                        portfolio: [{ id: 7 }],
                        agreementName: [{ display_name: "Ops Name" }],
                        agreementType: [{ type: "Grant Type" }],
                        projectTitle: [{ id: 123 }],
                        contractNumber: [{ id: "CN-100" }]
                    },
                    onlyMy: true,
                    sortConditions: "name",
                    sortDescending: true,
                    page: 1,
                    limit: 25
                })
            );

            expect(capturedUrl).toContain("fiscal_year=2026");
            expect(capturedUrl).toContain("budget_line_status=IN_REVIEW");
            expect(capturedUrl).toContain("portfolio=7");
            expect(capturedUrl).toContain("name=Ops%20Name");
            expect(capturedUrl).toContain("agreement_type=Grant%20Type");
            expect(capturedUrl).toContain("project_id=123");
            expect(capturedUrl).toContain("contract_number=CN-100");
            expect(capturedUrl).toContain("only_my=true");
            expect(capturedUrl).toContain("sort_conditions=name");
            expect(capturedUrl).toContain("sort_descending=true");
            expect(capturedUrl).toContain("limit=25");
            expect(capturedUrl).toContain("offset=25");
        });

        it("omits optional params and trailing ? when all filters are empty", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], count: 0, limit: 0, offset: 0 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {},
                    onlyMy: false,
                    sortConditions: "",
                    sortDescending: false,
                    page: null
                })
            );

            expect(capturedUrl).toMatch(/\/api\/v1\/agreements\/$/);
            expect(capturedUrl).not.toContain("?");
            expect(capturedUrl).not.toContain("sort_descending=");
            expect(capturedUrl).not.toContain("limit=");
            expect(capturedUrl).not.toContain("offset=");
        });
    });

    describe("Additional transformResponse coverage", () => {
        it("handles a legacy empty array response", async () => {
            server.use(
                http.get("*/api/v1/agreements/", () => {
                    return HttpResponse.json([]);
                })
            );

            const storeRef = setupApiStore(opsApi);
            const result = await storeRef.store.dispatch(
                opsApi.endpoints.getAgreements.initiate({
                    filters: {},
                    onlyMy: false,
                    sortConditions: null,
                    sortDescending: false
                })
            );

            expect(result.data).toEqual({
                agreements: [],
                count: 0,
                limit: 0,
                offset: 0,
                totals: null
            });
        });
    });

    describe("getAgreementById query modes", () => {
        it("builds scalar id endpoint", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/:id", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ id: 42, name: "Agreement 42" });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(opsApi.endpoints.getAgreementById.initiate(42));

            expect(capturedUrl).toContain("/api/v1/agreements/42");
            expect(capturedUrl).not.toContain("fiscal_year=");
        });

        it("builds object endpoint with fiscal year when provided", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/:id", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ id: 42, fiscal_year: 2026 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreementById.initiate({
                    id: 42,
                    fiscal_year: 2026
                })
            );

            expect(capturedUrl).toContain("/api/v1/agreements/42?fiscal_year=2026");
        });

        it("omits fiscal year when object arg has null fiscal year", async () => {
            let capturedUrl = "";
            server.use(
                http.get("*/api/v1/agreements/:id", ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ id: 42 });
                })
            );

            const storeRef = setupApiStore(opsApi);
            await storeRef.store.dispatch(
                opsApi.endpoints.getAgreementById.initiate({
                    id: 42,
                    fiscal_year: null
                })
            );

            expect(capturedUrl).toContain("/api/v1/agreements/42");
            expect(capturedUrl).not.toContain("?");
        });
    });
});

describe("opsAPI - Wave 2 high-yield endpoint coverage", () => {
    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it("normalizes fiscal year values in getAgreements query params", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/agreements/", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({ data: [], count: 0, limit: 10, offset: 0 });
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(
            opsApi.endpoints.getAgreements.initiate({
                filters: {
                    fiscalYear: [{ title: "FY 2026" }, { id: "FY 2025" }],
                    budgetLineStatus: [],
                    portfolio: [],
                    projectTitle: [],
                    agreementType: [],
                    agreementName: [],
                    contractNumber: []
                },
                onlyMy: false,
                sortConditions: null,
                sortDescending: false
            })
        );

        expect(capturedUrl).toContain("fiscal_year=2026");
        expect(capturedUrl).toContain("fiscal_year=2025");
    });

    it("builds getAgreementById query with object arg and fiscal year", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/agreements/123*", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({ id: 123 });
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(
            opsApi.endpoints.getAgreementById.initiate({
                id: 123,
                fiscal_year: 2026
            })
        );

        expect(capturedUrl).toContain("/agreements/123?fiscal_year=2026");
    });

    it("builds getAgreementById query with scalar arg", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/agreements/999", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({ id: 999 });
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(opsApi.endpoints.getAgreementById.initiate(999));

        expect(capturedUrl).toContain("/agreements/999");
    });

    it("builds getAgreementsFilterOptions with only_my", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/agreements-filters/*", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({});
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(opsApi.endpoints.getAgreementsFilterOptions.initiate({ onlyMy: true }));

        expect(capturedUrl).toContain("only_my=true");
    });

    it("builds getCanFilterOptions with fiscal year", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/cans-filters/*", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({});
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(opsApi.endpoints.getCanFilterOptions.initiate({ fiscalYear: 2026 }));

        expect(capturedUrl).toContain("fiscal_year=2026");
    });

    it("builds getBudgetLineItemsFilterOptions with flags", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/budget-line-items-filters/*", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({});
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(
            opsApi.endpoints.getBudgetLineItemsFilterOptions.initiate({ onlyMy: true, enableObe: true })
        );

        expect(capturedUrl).toContain("only_my=true");
        expect(capturedUrl).toContain("enable_obe=true");
    });

    it("builds getBudgetLineItems query with filters, sorting, and pagination", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/budget-line-items/*", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json({ data: [], count: 0, limit: 10, offset: 0 });
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(
            opsApi.endpoints.getBudgetLineItems.initiate({
                filters: {
                    fiscalYears: [{ title: "FY 2026" }],
                    bliStatus: [{ status: "DRAFT" }],
                    portfolios: [{ id: 1 }],
                    agreementIds: [5],
                    budgetLineTotalMin: 100,
                    budgetLineTotalMax: 1000,
                    agreementTypes: [{ type: "CONTRACT" }],
                    agreementTitles: [{ name: "A 1" }],
                    canActivePeriods: [{ title: "FY 2025" }]
                },
                page: 1,
                onlyMy: true,
                includeFees: true,
                sortConditions: "amount",
                sortDescending: true,
                enableObe: true,
                limit: 20
            })
        );

        expect(capturedUrl).toContain("fiscal_year=2026");
        expect(capturedUrl).toContain("budget_line_status=DRAFT");
        expect(capturedUrl).toContain("portfolio=1");
        expect(capturedUrl).toContain("agreement_id=5");
        expect(capturedUrl).toContain("budget_line_total_min=100");
        expect(capturedUrl).toContain("budget_line_total_max=1000");
        expect(capturedUrl).toContain("agreement_type=CONTRACT");
        expect(capturedUrl).toContain("agreement_name=A%201");
        expect(capturedUrl).toContain("can_active_period=FY%202025");
        expect(capturedUrl).toContain("sort_conditions=amount");
        expect(capturedUrl).toContain("sort_descending=true");
        expect(capturedUrl).toContain("limit=20");
        expect(capturedUrl).toContain("offset=20");
        expect(capturedUrl).toContain("only_my=true");
        expect(capturedUrl).toContain("include_fees=true");
        expect(capturedUrl).toContain("enable_obe=true");
    });

    it("sends POST payload for addAgreement mutation", async () => {
        let method = "";
        let payload = null;
        server.use(
            http.post("*/api/v1/agreements/", async ({ request }) => {
                method = request.method;
                payload = await request.json();
                return HttpResponse.json({ id: 501 });
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(
            opsApi.endpoints.addAgreement.initiate({
                name: "New Agreement",
                agreement_type: "CONTRACT"
            })
        );

        expect(method).toBe("POST");
        expect(payload).toEqual({
            name: "New Agreement",
            agreement_type: "CONTRACT"
        });
    });

    it("builds getPortfolios query without project_id when no arg provided", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/portfolios/", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json([]);
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(opsApi.endpoints.getPortfolios.initiate({}));

        expect(capturedUrl).toContain("/api/v1/portfolios/");
        expect(capturedUrl).not.toContain("project_id=");
    });

    it("builds getPortfolios query with project_id when projectId provided", async () => {
        let capturedUrl = "";
        server.use(
            http.get("*/api/v1/portfolios/", ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json([]);
            })
        );

        const storeRef = setupApiStore(opsApi);
        await storeRef.store.dispatch(opsApi.endpoints.getPortfolios.initiate({ projectId: 42 }));

        expect(capturedUrl).toContain("project_id=42");
    });
});
