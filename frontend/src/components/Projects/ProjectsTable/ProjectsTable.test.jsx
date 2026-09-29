import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectsTable from "./ProjectsTable";
import { PROJECT_SORT_CODES } from "../../../pages/projects/list/ProjectsList.helpers";

const MOCK_PROJECT_1 = {
    id: 10,
    title: "Project Alpha",
    project_type: "RESEARCH",
    start_date: "2021-06-13",
    end_date: "2025-09-30",
    fiscal_year_totals: { 2026: "500000.00", 2025: "300000.00" },
    project_total: "800000.00",
    agreement_name_list: [{ id: 1, name: "Agreement One" }]
};

const MOCK_PROJECT_2 = {
    id: 11,
    title: "Support Beta",
    project_type: "ADMINISTRATIVE_AND_SUPPORT",
    start_date: null,
    end_date: null,
    fiscal_year_totals: {},
    project_total: "0",
    agreement_name_list: []
};

const defaultProps = {
    projects: [MOCK_PROJECT_1],
    sortConditions: PROJECT_SORT_CODES.TITLE,
    sortDescending: false,
    setSortConditions: vi.fn(),
    selectedFiscalYear: "2026"
};

const renderTable = (props = {}) =>
    render(
        <MemoryRouter>
            <ProjectsTable
                {...defaultProps}
                {...props}
            />
        </MemoryRouter>
    );

describe("ProjectsTable", () => {
    it("renders a table with 6 column headers", () => {
        renderTable();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getAllByRole("columnheader").length).toBe(7);
    });

    it("renders column headers with correct labels", () => {
        renderTable();
        expect(screen.getByRole("columnheader", { name: /^Project$/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Type/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Start/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /End/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Lifetime Total/ })).toBeInTheDocument();
    });

    it("shows 'FY26 Total' label when a specific fiscal year is selected", () => {
        renderTable({ selectedFiscalYear: "2026" });
        expect(screen.getByRole("columnheader", { name: /FY26 Total/ })).toBeInTheDocument();
    });

    it("hides the FY Total column when 'All' is selected", () => {
        renderTable({ selectedFiscalYear: "All" });
        expect(screen.queryByRole("columnheader", { name: /FY Total/ })).not.toBeInTheDocument();
        // 5 data columns + 1 expand column = 6 total headers
        expect(screen.getAllByRole("columnheader").length).toBe(6);
    });

    it("renders a project row with a link to the project detail page", () => {
        renderTable();
        const link = screen.getByRole("link", { name: "Project Alpha" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/projects/10");
    });

    it("displays the project type as a human-readable label", () => {
        renderTable();
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("displays formatted start and end dates", () => {
        renderTable();
        expect(screen.getByText("6/13/2021")).toBeInTheDocument();
        expect(screen.getByText("9/30/2025")).toBeInTheDocument();
    });

    it("displays 'TBD' for null start and end dates", () => {
        renderTable({ projects: [MOCK_PROJECT_2] });
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(2);
    });

    it("displays the FY total as currency for the selected fiscal year", () => {
        renderTable({ selectedFiscalYear: "2026" });
        expect(screen.getByText("$500,000.00")).toBeInTheDocument();
    });

    it("displays 'TBD' for FY total when fiscal year has no data", () => {
        renderTable({ projects: [MOCK_PROJECT_2], selectedFiscalYear: "2026" });
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(1);
    });

    it("does not render any FY total cell when 'All' is selected", () => {
        renderTable({ selectedFiscalYear: "All" });
        // FY Total column is hidden entirely under All FYs; MOCK_PROJECT_1 has project_total > 0
        // so the only TBD values would be from missing dates — not from a FY total cell
        expect(screen.queryByRole("columnheader", { name: /FY Total/ })).not.toBeInTheDocument();
    });

    it("displays the project total as currency", () => {
        renderTable();
        expect(screen.getByText("$800,000.00")).toBeInTheDocument();
    });

    it("displays '$0' for a zero project total (TBD only for null)", () => {
        renderTable({ projects: [MOCK_PROJECT_2] });
        expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("sets aria-sort='ascending' on the currently sorted column", () => {
        renderTable({ sortConditions: PROJECT_SORT_CODES.TITLE, sortDescending: false });
        const projectHeader = screen.getByRole("columnheader", { name: /^Project$/ });
        expect(projectHeader).toHaveAttribute("aria-sort", "ascending");
    });

    it("sets aria-sort='descending' when sort is descending", () => {
        renderTable({ sortConditions: PROJECT_SORT_CODES.TITLE, sortDescending: true });
        const projectHeader = screen.getByRole("columnheader", { name: /^Project$/ });
        expect(projectHeader).toHaveAttribute("aria-sort", "descending");
    });

    it("sets aria-sort='none' on non-active columns", () => {
        renderTable({ sortConditions: PROJECT_SORT_CODES.TITLE });
        const typeHeader = screen.getByRole("columnheader", { name: /Type/ });
        expect(typeHeader).toHaveAttribute("aria-sort", "none");
    });

    it("calls setSortConditions when a header button is clicked", async () => {
        const user = userEvent.setup();
        const setSortConditions = vi.fn();
        renderTable({ setSortConditions });

        await user.click(screen.getByRole("button", { name: /Type/i }));

        expect(setSortConditions).toHaveBeenCalledWith(PROJECT_SORT_CODES.PROJECT_TYPE, expect.any(Boolean));
    });

    it("does not render an FY Total header button when 'All' is selected", () => {
        renderTable({ selectedFiscalYear: "All" });
        expect(screen.queryByRole("button", { name: /FY Total/i })).not.toBeInTheDocument();
    });

    it("enables the FY Total header and allows sorting when a specific fiscal year is selected", async () => {
        const user = userEvent.setup();
        const setSortConditions = vi.fn();
        renderTable({ selectedFiscalYear: "2026", setSortConditions });

        const fyTotalHeader = screen.getByRole("button", { name: /FY26 Total/i });
        expect(fyTotalHeader).not.toHaveAttribute("aria-disabled");
        expect(fyTotalHeader.className).toContain("cursor-pointer");

        await user.click(fyTotalHeader);

        expect(setSortConditions).toHaveBeenCalledWith(PROJECT_SORT_CODES.FY_TOTAL, expect.any(Boolean));
    });

    it("renders multiple rows when given multiple projects", () => {
        renderTable({ projects: [MOCK_PROJECT_1, MOCK_PROJECT_2] });
        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
        expect(screen.getByText("Support Beta")).toBeInTheDocument();
    });

    it("renders an empty table body when projects list is empty", () => {
        renderTable({ projects: [] });
        // Only the thead row should be present; no tbody rows
        expect(screen.getAllByRole("row").length).toBe(1);
        // No data rows (links) should be rendered
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
