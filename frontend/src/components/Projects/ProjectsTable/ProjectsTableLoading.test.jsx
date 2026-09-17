import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectsTableLoading from "./ProjectsTableLoading";
import { ITEMS_PER_PAGE } from "../../../constants";

describe("ProjectsTableLoading", () => {
    it("renders a table with aria-label 'Loading projects'", () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        expect(screen.getByRole("table", { name: "Loading projects" })).toBeInTheDocument();
    });

    it("renders the table with aria-busy='true'", () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    });

    it("renders 5 project column headings when All FYs selected (no FY Total)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        const expectedHeadings = ["Project", "Type", "Start", "End", "Project Total"];
        expectedHeadings.forEach((heading) => {
            expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
        });
        expect(screen.queryByRole("columnheader", { name: "FY Total" })).not.toBeInTheDocument();
    });

    it("renders 6 project column headings when a specific FY is selected (includes FY Total)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="2026" />);
        const expectedHeadings = ["Project", "Type", "Start", "End", "FY Total", "Project Total"];
        expectedHeadings.forEach((heading) => {
            expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
        });
    });

    it(`renders ${ITEMS_PER_PAGE} skeleton rows`, () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        // getAllByRole("row") includes the thead row
        expect(screen.getAllByRole("row")).toHaveLength(ITEMS_PER_PAGE + 1);
    });

    it("renders 6 cells per body row when All FYs selected (5 data + 1 chevron)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        const bodyRows = screen.getAllByRole("row").slice(1);
        bodyRows.forEach((row) => {
            expect(within(row).getAllByRole("cell")).toHaveLength(6);
        });
    });

    it("renders 7 cells per body row when a specific FY is selected (6 data + 1 chevron)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="2026" />);
        const bodyRows = screen.getAllByRole("row").slice(1);
        bodyRows.forEach((row) => {
            expect(within(row).getAllByRole("cell")).toHaveLength(7);
        });
    });

    it("renders 6 column headers when All FYs selected (5 labelled + 1 expand)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="All" />);
        expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    });

    it("renders 7 column headers when a specific FY is selected (6 labelled + 1 expand)", () => {
        render(<ProjectsTableLoading selectedFiscalYear="2026" />);
        expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    });
});
