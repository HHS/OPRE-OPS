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
        it("should transform portfolios to chart data format with column-based layout", () => {
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

            // Result includes actual portfolios + placeholders for grid alignment (4 rows per column x 4 columns = 16 total)
            expect(result).toHaveLength(16);

            // Filter out placeholders to check actual portfolios
            const actualPortfolios = result.filter((item) => !item.isPlaceholder);
            expect(actualPortfolios).toHaveLength(2);

            expect(actualPortfolios[0]).toMatchObject({
                id: 1,
                label: "CC Portfolio",
                abbreviation: "CC",
                value: 3000000,
                percent: 60 // 3M out of 5M
            });
            expect(actualPortfolios[0].color).toBe("var(--portfolio-bar-graph-cc)"); // CC portfolio color from PORTFOLIO_ORDER

            expect(actualPortfolios[1]).toMatchObject({
                id: 2,
                label: "CW Portfolio",
                abbreviation: "CW",
                value: 2000000,
                percent: 40 // 2M out of 5M
            });
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

            // Result includes placeholders for grid alignment
            expect(result).toHaveLength(16);

            const actualPortfolios = result.filter((item) => !item.isPlaceholder);
            expect(actualPortfolios).toHaveLength(1);
            expect(actualPortfolios[0].value).toBe(0);
            expect(actualPortfolios[0].percent).toBe(0);
        });

        it("should use fallback color for unknown portfolios and append them at the end", () => {
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

            // Result has 16 placeholders + 1 unknown portfolio = 17 items
            expect(result).toHaveLength(17);

            // Unknown portfolio is appended at the end (after all placeholders)
            const lastItem = result[result.length - 1];
            expect(lastItem.abbreviation).toBe("UNKNOWN");
            expect(lastItem.color).toBe("var(--data-viz-bl-by-status-1)");
            expect(lastItem.isPlaceholder).toBeUndefined();
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

            // Result has 16 placeholders + 1 unknown portfolio = 17 items
            expect(result).toHaveLength(17);

            // Unknown portfolio is at the end with value 0
            const lastItem = result[result.length - 1];
            expect(lastItem.value).toBe(0);
            expect(lastItem.percent).toBe(0);
        });

        it("should use index as fallback id for unknown portfolios", () => {
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

            // Result has 16 placeholders + 1 unknown portfolio = 17 items
            expect(result).toHaveLength(17);

            // Unknown portfolio is at the end
            const lastItem = result[result.length - 1];
            expect(lastItem.id).toBe("unknown-0"); // Should use unknown-index format
        });

        it("should maintain column positions and compact each column when portfolios are missing", () => {
            // Only include portfolios from different columns with gaps
            const portfolios = [
                {
                    id: 1,
                    name: "CC Portfolio",
                    abbreviation: "CC", // Column 1, position 0
                    fundingSummary: {
                        total_funding: { amount: 1000000 }
                    }
                },
                {
                    id: 2,
                    name: "HS Portfolio",
                    abbreviation: "HS", // Column 1, position 2 (CWR is missing)
                    fundingSummary: {
                        total_funding: { amount: 2000000 }
                    }
                },
                {
                    id: 3,
                    name: "ADR Portfolio",
                    abbreviation: "ADR", // Column 2, position 0
                    fundingSummary: {
                        total_funding: { amount: 3000000 }
                    }
                }
            ];
            const totalBudget = 6000000;

            const result = transformPortfoliosToChartData(portfolios, totalBudget);

            // Result has 4 columns * 4 rows = 16 items
            expect(result).toHaveLength(16);

            const actualPortfolios = result.filter((item) => !item.isPlaceholder);
            expect(actualPortfolios).toHaveLength(3);

            // Column 1: CC and HS should be compacted (no gap between them)
            expect(result[0].abbreviation).toBe("CC"); // First in column 1
            expect(result[1].abbreviation).toBe("HS"); // Second in column 1 (compacted)
            expect(result[2].isPlaceholder).toBe(true); // Placeholder at end of column 1
            expect(result[3].isPlaceholder).toBe(true); // Placeholder at end of column 1

            // Column 2: ADR should be first
            expect(result[4].abbreviation).toBe("ADR"); // First in column 2
            expect(result[5].isPlaceholder).toBe(true); // Placeholder at end of column 2
            expect(result[6].isPlaceholder).toBe(true); // Placeholder at end of column 2
            expect(result[7].isPlaceholder).toBe(true); // Placeholder at end of column 2
        });
    });
});
