import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupByDivision, filterMyPortfolios, handlePortfolioExport } from "./PortfolioList.helpers";

const mockPortfolios = [
    {
        id: 1,
        name: "Portfolio A",
        abbreviation: "PA",
        division_id: 1,
        division: {
            id: 1,
            name: "Division 1",
            abbreviation: "D1",
            division_director_id: 1,
            deputy_division_director_id: 2
        }
    },
    {
        id: 2,
        name: "Portfolio B",
        abbreviation: "PB",
        division_id: 1,
        division: {
            id: 1,
            name: "Division 1",
            abbreviation: "D1",
            division_director_id: 1,
            deputy_division_director_id: 2
        }
    },
    {
        id: 3,
        name: "Portfolio C",
        abbreviation: "PC",
        division_id: 2,
        division: {
            id: 2,
            name: "Division 2",
            abbreviation: "D2",
            division_director_id: 3,
            deputy_division_director_id: 4
        }
    }
];

describe("groupByDivision", () => {
    it("should group portfolios by division name", () => {
        const result = groupByDivision(mockPortfolios);

        expect(result["Division 1"]).toHaveLength(2);
        expect(result["Division 2"]).toHaveLength(1);
        expect(result["Division 1"][0].name).toBe("Portfolio A");
        expect(result["Division 1"][1].name).toBe("Portfolio B");
        expect(result["Division 2"][0].name).toBe("Portfolio C");
    });

    it("should return empty object when portfolios is null", () => {
        const result = groupByDivision(null);
        expect(result).toEqual({});
    });

    it("should return empty object when portfolios is undefined", () => {
        const result = groupByDivision(undefined);
        expect(result).toEqual({});
    });

    it("should handle empty array", () => {
        const result = groupByDivision([]);
        expect(result).toEqual({});
    });

    it("should skip portfolios without division name", () => {
        const portfoliosWithMissingDivision = [
            mockPortfolios[0],
            {
                ...mockPortfolios[1],
                division: {
                    id: 1,
                    abbreviation: "D1",
                    division_director_id: 1,
                    deputy_division_director_id: 2
                }
            },
            mockPortfolios[2]
        ];

        const result = groupByDivision(portfoliosWithMissingDivision);

        expect(Object.keys(result)).toEqual(["Division 1", "Division 2"]);
        expect(result["Division 1"]).toHaveLength(1);
        expect(result["Division 2"]).toHaveLength(1);
    });
});

describe("filterMyPortfolios", () => {
    const mockPortfoliosWithLeaders = [
        {
            id: 1,
            name: "Portfolio A",
            team_leaders: [{ id: 1, name: "User 1" }, { id: 2, name: "User 2" }]
        },
        {
            id: 2,
            name: "Portfolio B",
            team_leaders: [{ id: 3, name: "User 3" }]
        },
        {
            id: 3,
            name: "Portfolio C",
            team_leaders: [{ id: 1, name: "User 1" }]
        }
    ];

    it("should filter portfolios where user is a team leader", () => {
        const result = filterMyPortfolios(mockPortfoliosWithLeaders, 1);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(3);
    });

    it("should return empty array when user is not a team leader", () => {
        const result = filterMyPortfolios(mockPortfoliosWithLeaders, 999);

        expect(result).toEqual([]);
    });

    it("should return empty array when portfolios is null", () => {
        const result = filterMyPortfolios(null, 1);
        expect(result).toEqual([]);
    });

    it("should return empty array when userId is null", () => {
        const result = filterMyPortfolios(mockPortfoliosWithLeaders, null);
        expect(result).toEqual([]);
    });

    it("should handle portfolios without team_leaders property", () => {
        const portfoliosWithoutLeaders = [
            { id: 1, name: "Portfolio A" },
            { id: 2, name: "Portfolio B", team_leaders: null }
        ];

        const result = filterMyPortfolios(portfoliosWithoutLeaders, 1);
        expect(result).toEqual([]);
    });
});

describe("handlePortfolioExport", () => {
    let mockExportTableToXlsx;
    let mockSetIsExporting;
    let mockSetAlert;

    const mockPortfoliosWithFunding = [
        {
            id: 1,
            name: "Portfolio A",
            fundingSummary: {
                total_funding: { amount: 10000000 },
                available_funding: { amount: 5000000 },
                planned_funding: { amount: 1000000 },
                obligated_funding: { amount: 2000000 },
                in_execution_funding: { amount: 2000000 }
            }
        },
        {
            id: 2,
            name: "Portfolio B",
            fundingSummary: {
                total_funding: { amount: 20000000 },
                available_funding: { amount: 10000000 },
                planned_funding: { amount: 2000000 },
                obligated_funding: { amount: 4000000 },
                in_execution_funding: { amount: 4000000 }
            }
        }
    ];

    beforeEach(() => {
        mockExportTableToXlsx = vi.fn().mockResolvedValue(undefined);
        mockSetIsExporting = vi.fn();
        mockSetAlert = vi.fn();
    });

    it("should successfully export portfolio data", async () => {
        await handlePortfolioExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            2025,
            mockPortfoliosWithFunding
        );

        // Should set exporting to true at start
        expect(mockSetIsExporting).toHaveBeenCalledWith(true);

        // Should call export function with correct parameters
        expect(mockExportTableToXlsx).toHaveBeenCalledWith({
            data: mockPortfoliosWithFunding,
            headers: ["Portfolio Name", "FY Total Budget", "FY Available Budget", "FY Spending"],
            rowMapper: expect.any(Function),
            filename: "portfolios_FY2025",
            currencyColumns: [1, 2, 3]
        });

        // Should set exporting to false at end
        expect(mockSetIsExporting).toHaveBeenCalledWith(false);

        // Should not show error alert on success
        expect(mockSetAlert).not.toHaveBeenCalled();
    });

    it("should map portfolio data correctly in rowMapper", async () => {
        await handlePortfolioExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            2025,
            mockPortfoliosWithFunding
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;

        const result = rowMapper(mockPortfoliosWithFunding[0]);

        // Portfolio Name, Total Budget, Available Budget, Spending (planned + obligated + in_execution)
        expect(result).toEqual([
            "Portfolio A",
            10000000, // total_funding
            5000000, // available_funding
            5000000 // spending: 1M + 2M + 2M = 5M
        ]);
    });

    it("should handle portfolios with missing funding data", async () => {
        const portfoliosWithMissingData = [
            {
                id: 1,
                name: "Portfolio A",
                fundingSummary: {
                    total_funding: null,
                    available_funding: null,
                    planned_funding: null,
                    obligated_funding: null,
                    in_execution_funding: null
                }
            }
        ];

        await handlePortfolioExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            2025,
            portfoliosWithMissingData
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;
        const result = rowMapper(portfoliosWithMissingData[0]);

        expect(result).toEqual(["Portfolio A", 0, 0, 0]);
    });

    it("should display error alert when export fails", async () => {
        const exportError = new Error("Export failed");
        mockExportTableToXlsx.mockRejectedValue(exportError);

        await handlePortfolioExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            2025,
            mockPortfoliosWithFunding
        );

        // Should still set exporting to true at start
        expect(mockSetIsExporting).toHaveBeenCalledWith(true);

        // Should display error alert to user
        expect(mockSetAlert).toHaveBeenCalledWith({
            type: "error",
            heading: "Export Failed",
            message: "An error occurred while exporting portfolio data. Please try again.",
            redirectUrl: "/error"
        });

        // Should set exporting to false even on error
        expect(mockSetIsExporting).toHaveBeenCalledWith(false);
    });

    it("should log error to console when export fails", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exportError = new Error("Export failed");
        mockExportTableToXlsx.mockRejectedValue(exportError);

        await handlePortfolioExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            2025,
            mockPortfoliosWithFunding
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to export portfolio data:", exportError);

        consoleErrorSpy.mockRestore();
    });
});
