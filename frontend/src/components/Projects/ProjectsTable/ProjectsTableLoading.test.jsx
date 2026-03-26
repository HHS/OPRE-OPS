import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectsTableLoading from "./ProjectsTableLoading";
import { ITEMS_PER_PAGE } from "../../../constants";

describe("ProjectsTableLoading", () => {
    it("renders a table with aria-label 'Loading projects'", () => {
        render(<ProjectsTableLoading />);
        expect(screen.getByRole("table", { name: "Loading projects" })).toBeInTheDocument();
    });

    it("renders the table with aria-busy='true'", () => {
        render(<ProjectsTableLoading />);
        expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    });

    it("renders all 6 project column headings", () => {
        render(<ProjectsTableLoading />);
        const expectedHeadings = ["Project", "Type", "Start", "End", "FY Total", "Project Total"];
        expectedHeadings.forEach((heading) => {
            expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
        });
    });

    it(`renders ${ITEMS_PER_PAGE} skeleton rows`, () => {
        render(<ProjectsTableLoading />);
        // getAllByRole("row") includes the thead row
        expect(screen.getAllByRole("row")).toHaveLength(ITEMS_PER_PAGE + 1);
    });

    it("renders 7 cells per body row (6 data + 1 chevron)", () => {
        render(<ProjectsTableLoading />);
        const bodyRows = screen.getAllByRole("row").slice(1);
        bodyRows.forEach((row) => {
            expect(within(row).getAllByRole("cell")).toHaveLength(7);
        });
    });

    it("renders an empty chevron header cell alongside the 6 column headers", () => {
        render(<ProjectsTableLoading />);
        // 6 labelled headers + 1 empty header for the chevron column
        expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    });
});
