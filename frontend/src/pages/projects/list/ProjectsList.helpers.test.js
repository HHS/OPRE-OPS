import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatProjectDate, handleProjectsExport } from "./ProjectsList.helpers";

describe("formatProjectDate", () => {
    it("returns formatted date for valid ISO date", () => {
        expect(formatProjectDate("2021-06-13")).toBe("6/13/2021");
    });

    it("returns TBD for null", () => {
        expect(formatProjectDate(null)).toBe("TBD");
    });

    it("returns TBD for undefined", () => {
        expect(formatProjectDate(undefined)).toBe("TBD");
    });
});

describe("handleProjectsExport", () => {
    let mockExportTableToXlsx;
    let mockSetIsExporting;
    let mockSetAlert;
    let mockTrigger;

    const mockProjects = [
        {
            id: 10,
            title: "Project Alpha",
            project_type: "RESEARCH",
            start_date: "2021-06-13",
            end_date: "2025-09-30",
            fiscal_year_totals: { 2026: "500000.00" },
            project_total: "800000.00",
            agreement_name_list: [
                { id: 1, name: "Agreement One" },
                { id: 2, name: "Agreement Two" }
            ]
        },
        {
            id: 11,
            title: "Support Beta",
            project_type: "ADMINISTRATIVE_AND_SUPPORT",
            start_date: null,
            end_date: null,
            fiscal_year_totals: {},
            project_total: "0",
            agreement_name_list: []
        }
    ];

    beforeEach(() => {
        mockExportTableToXlsx = vi.fn().mockResolvedValue(undefined);
        mockSetIsExporting = vi.fn();
        mockSetAlert = vi.fn();
        mockTrigger = vi.fn().mockReturnValue({
            unwrap: () => Promise.resolve({ projects: mockProjects })
        });
    });

    it("should set isExporting to true then false", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        expect(mockSetIsExporting).toHaveBeenCalledWith(true);
        expect(mockSetIsExporting).toHaveBeenCalledWith(false);
    });

    it("should batch-fetch all projects with correct params", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            120
        );

        // 120 / 50 = 3 pages
        expect(mockTrigger).toHaveBeenCalledTimes(3);
        expect(mockTrigger).toHaveBeenCalledWith({
            sortConditions: "TITLE",
            sortDescending: false,
            page: 0,
            limit: 50,
            fiscalYear: 2026
        });
        expect(mockTrigger).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
        expect(mockTrigger).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    it("should call exportTableToXlsx with FY-specific header for a selected year", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        expect(mockExportTableToXlsx).toHaveBeenCalledWith({
            data: mockProjects,
            headers: [
                "Project",
                "Type",
                "Start Date",
                "End Date",
                "FY 26 Total",
                "Project Total",
                "Total Agreements",
                "Agreements"
            ],
            rowMapper: expect.any(Function),
            filename: "projects_FY2026",
            currencyColumns: [4, 5]
        });
    });

    it("should call exportTableToXlsx with generic FY Total header when All is selected", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            "All",
            "TITLE",
            false,
            2
        );

        expect(mockExportTableToXlsx).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: [
                    "Project",
                    "Type",
                    "Start Date",
                    "End Date",
                    "FY Total",
                    "Project Total",
                    "Total Agreements",
                    "Agreements"
                ],
                filename: "projects_all"
            })
        );
    });

    it("should map project data correctly in rowMapper for a specific FY", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;

        const result = rowMapper(mockProjects[0]);
        expect(result).toEqual([
            "Project Alpha",
            "Research",
            "6/13/2021",
            "9/30/2025",
            500000,
            800000,
            2,
            "Agreement One, Agreement Two"
        ]);
    });

    it("should map empty FY total when FY is All", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            "All",
            "TITLE",
            false,
            2
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;

        const result = rowMapper(mockProjects[0]);
        expect(result[4]).toBe("");
    });

    it("should map empty FY total when project has no data for selected FY", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2025,
            "TITLE",
            false,
            2
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;

        // mockProjects[0] only has fiscal_year_totals for 2026, not 2025
        const result = rowMapper(mockProjects[0]);
        expect(result[4]).toBe("");
    });

    it("should handle null dates as TBD", async () => {
        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        const callArgs = mockExportTableToXlsx.mock.calls[0][0];
        const rowMapper = callArgs.rowMapper;

        const result = rowMapper(mockProjects[1]);
        expect(result[2]).toBe("TBD");
        expect(result[3]).toBe("TBD");
    });

    it("should display error alert when export fails", async () => {
        mockExportTableToXlsx.mockRejectedValue(new Error("Export failed"));

        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        expect(mockSetAlert).toHaveBeenCalledWith({
            type: "error",
            heading: "Export Failed",
            message: "An error occurred while exporting project data. Please try again.",
            redirectUrl: "/error"
        });
        expect(mockSetIsExporting).toHaveBeenCalledWith(false);
    });

    it("should log error to console when export fails", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exportError = new Error("Export failed");
        mockExportTableToXlsx.mockRejectedValue(exportError);

        await handleProjectsExport(
            mockExportTableToXlsx,
            mockSetIsExporting,
            mockSetAlert,
            mockTrigger,
            2026,
            "TITLE",
            false,
            2
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to export project data:", exportError);
        consoleErrorSpy.mockRestore();
    });
});
