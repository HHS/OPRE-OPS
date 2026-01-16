import { describe, it, expect, vi } from "vitest";
import {
    calculateTotalBudget,
    sortPortfoliosByStaticOrder,
    transformPortfoliosToChartData
} from "./PortfolioSummaryCards.helpers";

describe("PortfolioSummaryCards.helpers", () => {
    describe("calculateTotalBudget", () => {
        it("should calculate total budget correctly", () => {
            const portfolios = [
                {
                    fundingSummary: {
                        total_funding: { amount: 1000000 }
                    }
                },
                {
                    fundingSummary: {
                        total_funding: { amount: 2000000 }
                    }
                },
                {
                    fundingSummary: {
                        total_funding: { amount: 3000000 }
                    }
                }
            ];

            const result = calculateTotalBudget(portfolios);
            expect(result).toBe(6000000);
        });

        it("should handle null or undefined funding amounts", () => {
            const portfolios = [
                {
                    fundingSummary: {
                        total_funding: { amount: 1000000 }
                    }
                },
                {
                    fundingSummary: {
                        total_funding: null
                    }
                },
                {
                    fundingSummary: null
                },
                {}
            ];

            const result = calculateTotalBudget(portfolios);
            expect(result).toBe(1000000);
        });

        it("should return 0 for empty array", () => {
            const result = calculateTotalBudget([]);
            expect(result).toBe(0);
        });

        it("should return 0 for null input", () => {
            const result = calculateTotalBudget(null);
            expect(result).toBe(0);
        });

        it("should return 0 for undefined input", () => {
            const result = calculateTotalBudget(undefined);
            expect(result).toBe(0);
        });
    });

    describe("sortPortfoliosByStaticOrder", () => {
        it("should sort portfolios according to PORTFOLIO_ORDER", () => {
            const portfolios = [
                { abbreviation: "OD", name: "OD Portfolio" },
                { abbreviation: "CC", name: "CC Portfolio" },
                { abbreviation: "WR", name: "WR Portfolio" },
                { abbreviation: "CW", name: "CW Portfolio" }
            ];

            const result = sortPortfoliosByStaticOrder(portfolios);

            expect(result[0].abbreviation).toBe("CC"); // DCFD first
            expect(result[1].abbreviation).toBe("CW"); // DCFD second
            expect(result[2].abbreviation).toBe("WR"); // DEI
            expect(result[3].abbreviation).toBe("OD"); // OD
        });

        it("should handle ADR alias for AD", () => {
            const portfolios = [
                { abbreviation: "ADR", name: "ADR Portfolio" },
                { abbreviation: "CC", name: "CC Portfolio" }
            ];

            const result = sortPortfoliosByStaticOrder(portfolios);

            expect(result[0].abbreviation).toBe("CC"); // DCFD first
            expect(result[1].abbreviation).toBe("ADR"); // DFS AD/ADR
        });

        it("should append unknown portfolios to the end", () => {
            const portfolios = [
                { abbreviation: "UNKNOWN", name: "Unknown Portfolio" },
                { abbreviation: "CC", name: "CC Portfolio" },
                { abbreviation: "ANOTHER", name: "Another Unknown" }
            ];

            const result = sortPortfoliosByStaticOrder(portfolios);

            expect(result[0].abbreviation).toBe("CC"); // Known portfolio first
            expect(result[1].abbreviation).toBe("UNKNOWN"); // Unknown portfolios at end
            expect(result[2].abbreviation).toBe("ANOTHER");
        });

        it("should return empty array for null input", () => {
            const result = sortPortfoliosByStaticOrder(null);
            expect(result).toEqual([]);
        });

        it("should return empty array for undefined input", () => {
            const result = sortPortfoliosByStaticOrder(undefined);
            expect(result).toEqual([]);
        });

        it("should not mutate original array", () => {
            const portfolios = [
                { abbreviation: "OD", name: "OD Portfolio" },
                { abbreviation: "CC", name: "CC Portfolio" }
            ];

            const original = [...portfolios];
            sortPortfoliosByStaticOrder(portfolios);

            expect(portfolios).toEqual(original);
        });

        it("should log warning in development for unknown portfolios", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const portfolios = [{ abbreviation: "UNKNOWN", name: "Unknown Portfolio" }];

            sortPortfoliosByStaticOrder(portfolios);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Portfolio "UNKNOWN" (Unknown Portfolio) not found in PORTFOLIO_ORDER')
            );

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("transformPortfoliosToChartData", () => {
        it("should transform portfolios to chart data format", () => {
            const portfolios = [
                {
                    id: 1,
                    name: "CC Portfolio",
                    abbreviation: "CC",
                    fundingSummary: {
                        total_funding: { amount: 3000000 }
                    }
                },
                {
                    id: 2,
                    name: "CW Portfolio",
                    abbreviation: "CW",
                    fundingSummary: {
                        total_funding: { amount: 2000000 }
                    }
                }
            ];
            const totalBudget = 5000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                id: 1,
                label: "CC Portfolio",
                abbreviation: "CC",
                value: 3000000,
                percent: 60 // 3M out of 5M
            });
            expect(result[0].color).toBe("var(--portfolio-bar-graph-cc)"); // CC portfolio color from PORTFOLIO_ORDER
        });

        it("should handle portfolios with zero funding", () => {
            const portfolios = [
                {
                    id: 1,
                    name: "CC Portfolio",
                    abbreviation: "CC",
                    fundingSummary: {
                        total_funding: { amount: 0 }
                    }
                }
            ];
            const totalBudget = 1000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            expect(result[0].value).toBe(0);
            expect(result[0].percent).toBe(0);
        });

        it("should use fallback color for unknown portfolios", () => {
            const portfolios = [
                {
                    id: 1,
                    name: "Unknown Portfolio",
                    abbreviation: "UNKNOWN",
                    fundingSummary: {
                        total_funding: { amount: 1000000 }
                    }
                }
            ];
            const totalBudget = 1000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            expect(result[0].color).toBe("var(--data-viz-bl-by-status-1)");
        });

        it("should return empty array for null portfolios", () => {
            const result = transformPortfoliosToChartData(null, 1000000);
            expect(result).toEqual([]);
        });

        it("should return empty array for undefined portfolios", () => {
            const result = transformPortfoliosToChartData(undefined, 1000000);
            expect(result).toEqual([]);
        });

        it("should handle portfolios with missing fundingSummary", () => {
            const portfolios = [
                {
                    id: 1,
                    name: "Test Portfolio",
                    abbreviation: "TEST"
                }
            ];
            const totalBudget = 1000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            expect(result[0].value).toBe(0);
            expect(result[0].percent).toBe(0);
        });

        it("should use index as fallback id", () => {
            const portfolios = [
                {
                    name: "Test Portfolio",
                    abbreviation: "TEST",
                    fundingSummary: {
                        total_funding: { amount: 1000000 }
                    }
                }
            ];
            const totalBudget = 1000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            expect(result[0].id).toBe(0); // Should use index
        });
    });
});
