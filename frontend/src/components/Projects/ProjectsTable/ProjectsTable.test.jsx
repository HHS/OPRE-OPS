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
        expect(screen.getAllByRole("columnheader").length).toBe(6);
    });

    it("renders column headers with correct labels", () => {
        renderTable();
        expect(screen.getByRole("columnheader", { name: /^Project$/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Type/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Start/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /End/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Project Total/ })).toBeInTheDocument();
    });

    it("shows 'FY26 Total' label when a specific fiscal year is selected", () => {
        renderTable({ selectedFiscalYear: "2026" });
        expect(screen.getByRole("columnheader", { name: /FY26 Total/ })).toBeInTheDocument();
    });

    it("shows 'FY Total' label when 'All' is selected", () => {
        renderTable({ selectedFiscalYear: "All" });
        expect(screen.getByRole("columnheader", { name: /^FY Total$/ })).toBeInTheDocument();
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

    it("displays 'TBD' for FY total when 'All' is selected", () => {
        renderTable({ selectedFiscalYear: "All" });
        // When selectedFiscalYear is "All", fyTotal is always null → NO_DATA
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("displays the project total as currency", () => {
        renderTable();
        expect(screen.getByText("$800,000.00")).toBeInTheDocument();
    });

    it("displays 'TBD' for a zero project total", () => {
        renderTable({ projects: [MOCK_PROJECT_2] });
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(1);
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
