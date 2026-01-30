import { describe, it, expect, vi, afterEach } from "vitest";
import { sortPortfolios } from "./PortfolioTable.helpers";
import { PORTFOLIO_SORT_CODES } from "./PortfolioTable.constants";
import * as SummaryCardsHelpers from "../PortfolioSummaryCards/PortfolioSummaryCards.helpers";

// Mock the sortPortfoliosByStaticOrder function
vi.mock("../PortfolioSummaryCards/PortfolioSummaryCards.helpers", () => ({
    sortPortfoliosByStaticOrder: vi.fn()
}));

describe("PortfolioTable.helpers", () => {
    describe("sortPortfolios", () => {
        const mockPortfolios = [
            {
                id: 1,
                name: "Child Care",
                abbreviation: "CC",
                division: {
                    abbreviation: "DCFD"
                },
                fundingSummary: {
                    total_funding: { amount: 10000000 },
                    available_funding: { amount: 5000000 },
                    planned_funding: { amount: 2000000 },
                    obligated_funding: { amount: 2000000 },
                    in_execution_funding: { amount: 1000000 }
                }
            },
            {
                id: 2,
                name: "Welfare Research",
                abbreviation: "WR",
                division: {
                    abbreviation: "DEI"
                },
                fundingSummary: {
                    total_funding: { amount: 5000000 },
                    available_funding: { amount: 2000000 },
                    planned_funding: { amount: 1000000 },
                    obligated_funding: { amount: 1500000 },
                    in_execution_funding: { amount: 500000 }
                }
            },
            {
                id: 3,
                name: "Adolescent Development Research",
                abbreviation: "ADR",
                division: {
                    abbreviation: "DFS"
                },
                fundingSummary: {
                    total_funding: { amount: 7500000 },
                    available_funding: { amount: 3000000 },
                    planned_funding: { amount: 1500000 },
                    obligated_funding: { amount: 2500000 },
                    in_execution_funding: { amount: 500000 }
                }
            }
        ];

        afterEach(() => {
            vi.clearAllMocks();
        });

        describe("STATIC_ORDER sorting", () => {
            it("should use sortPortfoliosByStaticOrder when sort condition is STATIC_ORDER", () => {
                const mockSortedResult = [...mockPortfolios].reverse();
                SummaryCardsHelpers.sortPortfoliosByStaticOrder.mockReturnValue(mockSortedResult);

                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.STATIC_ORDER, false);

                expect(SummaryCardsHelpers.sortPortfoliosByStaticOrder).toHaveBeenCalledWith(mockPortfolios);
                expect(result).toEqual(mockSortedResult);
            });

            it("should reverse result when sortDescending is true with STATIC_ORDER", () => {
                const mockSortedResult = [mockPortfolios[0], mockPortfolios[1], mockPortfolios[2]];
                SummaryCardsHelpers.sortPortfoliosByStaticOrder.mockReturnValue(mockSortedResult);

                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.STATIC_ORDER, true);

                expect(result).toEqual([mockPortfolios[2], mockPortfolios[1], mockPortfolios[0]]);
            });

            it("should handle empty array with STATIC_ORDER", () => {
                SummaryCardsHelpers.sortPortfoliosByStaticOrder.mockReturnValue([]);

                const result = sortPortfolios([], PORTFOLIO_SORT_CODES.STATIC_ORDER, false);

                expect(result).toEqual([]);
            });
        });

        describe("PORTFOLIO_NAME sorting", () => {
            it("should sort portfolios by name alphabetically", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(result[0].name).toBe("Adolescent Development Research");
                expect(result[1].name).toBe("Child Care");
                expect(result[2].name).toBe("Welfare Research");
            });

            it("should sort portfolios by name in descending order", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, true);

                expect(result[0].name).toBe("Welfare Research");
                expect(result[1].name).toBe("Child Care");
                expect(result[2].name).toBe("Adolescent Development Research");
            });

            it("should handle portfolios with missing names", () => {
                const portfoliosWithMissing = [
                    { ...mockPortfolios[0], name: "" },
                    mockPortfolios[1],
                    { ...mockPortfolios[2], name: null }
                ];

                const result = sortPortfolios(portfoliosWithMissing, PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(result).toHaveLength(3);
            });
        });

        describe("DIVISION sorting", () => {
            it("should sort portfolios by division order", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.DIVISION, false);

                // DCFD (1) < DFS (2) < DEI (3)
                expect(result[0].division.abbreviation).toBe("DCFD");
                expect(result[1].division.abbreviation).toBe("DFS");
                expect(result[2].division.abbreviation).toBe("DEI");
            });

            it("should sort by portfolio name when divisions are the same", () => {
                const sameDiv = [
                    { ...mockPortfolios[0], name: "Zebra", division: { abbreviation: "DCFD" } },
                    { ...mockPortfolios[1], name: "Apple", division: { abbreviation: "DCFD" } }
                ];

                const result = sortPortfolios(sameDiv, PORTFOLIO_SORT_CODES.DIVISION, false);

                expect(result[0].name).toBe("Apple");
                expect(result[1].name).toBe("Zebra");
            });

            it("should handle portfolios with missing divisions", () => {
                const portfoliosWithMissing = [mockPortfolios[0], { ...mockPortfolios[1], division: null }];

                const result = sortPortfolios(portfoliosWithMissing, PORTFOLIO_SORT_CODES.DIVISION, false);

                expect(result).toHaveLength(2);
            });
        });

        describe("FY_BUDGET sorting", () => {
            it("should sort portfolios by total funding amount", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_BUDGET, false);

                expect(result[0].fundingSummary.total_funding.amount).toBe(5000000);
                expect(result[1].fundingSummary.total_funding.amount).toBe(7500000);
                expect(result[2].fundingSummary.total_funding.amount).toBe(10000000);
            });

            it("should sort portfolios by total funding in descending order", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_BUDGET, true);

                expect(result[0].fundingSummary.total_funding.amount).toBe(10000000);
                expect(result[1].fundingSummary.total_funding.amount).toBe(7500000);
                expect(result[2].fundingSummary.total_funding.amount).toBe(5000000);
            });

            it("should handle portfolios with missing funding data", () => {
                const portfoliosWithMissing = [mockPortfolios[0], { ...mockPortfolios[1], fundingSummary: null }];

                const result = sortPortfolios(portfoliosWithMissing, PORTFOLIO_SORT_CODES.FY_BUDGET, false);

                expect(result[0].fundingSummary).toBe(null);
                expect(result[1].fundingSummary).toBeTruthy();
            });
        });

        describe("FY_SPENDING sorting", () => {
            it("should sort portfolios by spending (planned + obligated + in_execution)", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_SPENDING, false);

                // WR: 1M + 1.5M + 0.5M = 3M
                // ADR: 1.5M + 2.5M + 0.5M = 4.5M
                // CC: 2M + 2M + 1M = 5M
                expect(result[0].abbreviation).toBe("WR");
                expect(result[1].abbreviation).toBe("ADR");
                expect(result[2].abbreviation).toBe("CC");
            });

            it("should sort portfolios by spending in descending order", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_SPENDING, true);

                expect(result[0].abbreviation).toBe("CC");
                expect(result[1].abbreviation).toBe("ADR");
                expect(result[2].abbreviation).toBe("WR");
            });
        });

        describe("FY_AVAILABLE sorting", () => {
            it("should sort portfolios by available funding", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_AVAILABLE, false);

                expect(result[0].fundingSummary.available_funding.amount).toBe(2000000);
                expect(result[1].fundingSummary.available_funding.amount).toBe(3000000);
                expect(result[2].fundingSummary.available_funding.amount).toBe(5000000);
            });

            it("should sort portfolios by available funding in descending order", () => {
                const result = sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.FY_AVAILABLE, true);

                expect(result[0].fundingSummary.available_funding.amount).toBe(5000000);
                expect(result[1].fundingSummary.available_funding.amount).toBe(3000000);
                expect(result[2].fundingSummary.available_funding.amount).toBe(2000000);
            });
        });

        describe("Edge cases", () => {
            it("should return empty array when input is empty", () => {
                const result = sortPortfolios([], PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(result).toEqual([]);
            });

            it("should return empty array when input is null", () => {
                const result = sortPortfolios(null, PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(result).toEqual([]);
            });

            it("should handle single portfolio", () => {
                const result = sortPortfolios([mockPortfolios[0]], PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockPortfolios[0]);
            });

            it("should not mutate the original array", () => {
                const original = [...mockPortfolios];
                sortPortfolios(mockPortfolios, PORTFOLIO_SORT_CODES.PORTFOLIO_NAME, false);

                expect(mockPortfolios).toEqual(original);
            });

            it("should return unsorted array for unknown sort condition", () => {
                const result = sortPortfolios(mockPortfolios, "UNKNOWN_SORT", false);

                expect(result).toEqual(mockPortfolios);
            });
        });
    });
});
