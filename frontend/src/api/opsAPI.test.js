import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                offset: 0
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                offset: 0
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                offset: 0
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                offset: 0
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
            await storeRef.store.dispatch(
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
            );

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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
                    filters: { fiscalYear: [], portfolio: [], projectTitle: [], agreementType: [], agreementName: [], contractNumber: [] },
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
});
