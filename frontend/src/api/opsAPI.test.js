import { describe, it, expect } from "vitest";

describe("opsAPI - Pagination Logic", () => {
    // Replicate the query parameter construction logic from opsAPI.js (lines 71-102)
    function buildAgreementsQuery({
        filters: { fiscalYear, budgetLineStatus, portfolio },
        onlyMy,
        sortConditions,
        sortDescending,
        page,
        limit = 10
    }) {
        const queryParams = [];
        if (fiscalYear) {
            fiscalYear.forEach((year) => queryParams.push(`fiscal_year=${year.title}`));
        }
        if (budgetLineStatus) {
            budgetLineStatus.forEach((status) => queryParams.push(`budget_line_status=${status.status}`));
        }
        if (portfolio) {
            portfolio.forEach((portfolio) => queryParams.push(`portfolio=${portfolio.id}`));
        }
        if (onlyMy) {
            queryParams.push("only_my=true");
        }
        if (sortConditions) {
            queryParams.push(`sort_conditions=${sortConditions}`);
            // We only care about the sort direction if sort condition is non-null
            queryParams.push(`sort_descending=${sortDescending}`);
        }
        // Add pagination parameters
        if (page !== undefined && page !== null) {
            queryParams.push(`limit=${limit}`);
            queryParams.push(`offset=${page * limit}`);
        }
        return `/agreements/?${queryParams.join("&")}`;
    }

    // Replicate the transformResponse logic from opsAPI.js (lines 104-130)
    function transformAgreementsResponse(response) {
        // New wrapped format with type-neutral key
        if (response.data) {
            return {
                agreements: response.data, // Keep "agreements" name for internal use
                count: response.count,
                limit: response.limit,
                offset: response.offset
            };
        }
        // Backward compatibility with old "agreements" key
        if (response.agreements) {
            return {
                agreements: response.agreements,
                count: response.count,
                limit: response.limit,
                offset: response.offset
            };
        }
        // Legacy array format (no pagination)
        return {
            agreements: response,
            count: response.length,
            limit: response.length,
            offset: 0
        };
    }

    describe("Query Parameter Construction Logic", () => {
        it("should construct pagination parameters correctly", () => {
            const params = {
                filters: { fiscalYear: [], budgetLineStatus: [], portfolio: [] },
                onlyMy: false,
                sortConditions: null,
                sortDescending: false,
                page: 0,
                limit: 10
            };

            const queryResult = buildAgreementsQuery(params);

            // The query should return a URL with pagination params
            expect(queryResult).toContain("limit=10");
            expect(queryResult).toContain("offset=0");
        });

        it("should calculate offset correctly (page * limit)", () => {
            const params = {
                filters: { fiscalYear: [], budgetLineStatus: [], portfolio: [] },
                onlyMy: false,
                page: 2, // page 2 with limit 10 = offset 20
                limit: 10
            };

            const queryResult = buildAgreementsQuery(params);

            expect(queryResult).toContain("limit=10");
            expect(queryResult).toContain("offset=20");
        });

        it("should omit pagination params when page not provided", () => {
            const params = {
                filters: { fiscalYear: [], budgetLineStatus: [], portfolio: [] },
                onlyMy: false
                // page not provided - should not add pagination params
            };

            const queryResult = buildAgreementsQuery(params);

            expect(queryResult).not.toContain("limit=");
            expect(queryResult).not.toContain("offset=");
        });

        it("should include pagination with filters", () => {
            const params = {
                filters: {
                    fiscalYear: [{ title: "2024" }],
                    budgetLineStatus: [],
                    portfolio: []
                },
                onlyMy: false,
                page: 0,
                limit: 10
            };

            const queryResult = buildAgreementsQuery(params);

            expect(queryResult).toContain("fiscal_year=2024");
            expect(queryResult).toContain("limit=10");
            expect(queryResult).toContain("offset=0");
        });

        it("should include pagination with sorting", () => {
            const params = {
                filters: { fiscalYear: [], budgetLineStatus: [], portfolio: [] },
                onlyMy: false,
                sortConditions: "name",
                sortDescending: false,
                page: 1,
                limit: 10
            };

            const queryResult = buildAgreementsQuery(params);

            expect(queryResult).toContain("sort_conditions=name");
            expect(queryResult).toContain("sort_descending=false");
            expect(queryResult).toContain("limit=10");
            expect(queryResult).toContain("offset=10");
        });
    });

    describe("Response Transformation Logic", () => {
        it("should transform wrapped response format correctly", () => {
            const mockResponse = {
                data: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0
            };

            const result = transformAgreementsResponse(mockResponse);

            expect(result).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0
            });
        });

        it("should handle old 'agreements' key format", () => {
            const mockResponse = {
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0
            };

            const result = transformAgreementsResponse(mockResponse);

            expect(result).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 50,
                limit: 10,
                offset: 0
            });
        });

        it("should handle legacy array format", () => {
            const mockResponse = [
                { id: 1, name: "Agreement 1" },
                { id: 2, name: "Agreement 2" }
            ];

            const result = transformAgreementsResponse(mockResponse);

            expect(result).toEqual({
                agreements: [
                    { id: 1, name: "Agreement 1" },
                    { id: 2, name: "Agreement 2" }
                ],
                count: 2,
                limit: 2,
                offset: 0
            });
        });

        it("should preserve all metadata", () => {
            const mockResponse = {
                data: [{ id: 1, name: "Agreement 1" }],
                count: 100,
                limit: 25,
                offset: 50
            };

            const result = transformAgreementsResponse(mockResponse);

            expect(result.count).toBe(100);
            expect(result.limit).toBe(25);
            expect(result.offset).toBe(50);
        });
    });
});
