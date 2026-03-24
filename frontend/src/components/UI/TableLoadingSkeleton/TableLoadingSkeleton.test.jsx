import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TableLoadingSkeleton from "./TableLoadingSkeleton";
import { ITEMS_PER_PAGE } from "../../../constants";

const HEADINGS = ["Project", "Type", "Start", "End", "Total"];

const renderSkeleton = (props = {}) =>
    render(
        <TableLoadingSkeleton
            headings={HEADINGS}
            {...props}
        />
    );

describe("TableLoadingSkeleton", () => {
    it("renders a table with the supplied aria-label", () => {
        renderSkeleton({ ariaLabel: "Loading projects" });
        expect(screen.getByRole("table", { name: "Loading projects" })).toBeInTheDocument();
    });

    it("defaults aria-label to 'Loading data' when not supplied", () => {
        renderSkeleton();
        expect(screen.getByRole("table", { name: "Loading data" })).toBeInTheDocument();
    });

    it("sets aria-busy='true' on the table", () => {
        renderSkeleton();
        expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    });

    it("renders all supplied column headings", () => {
        renderSkeleton();
        HEADINGS.forEach((heading) => {
            expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
        });
    });

    it("renders ITEMS_PER_PAGE rows by default", () => {
        renderSkeleton();
        // +1 for the thead row
        expect(screen.getAllByRole("row")).toHaveLength(ITEMS_PER_PAGE + 1);
    });

    it("renders the requested rowCount", () => {
        renderSkeleton({ rowCount: 5 });
        expect(screen.getAllByRole("row")).toHaveLength(5 + 1);
    });

    it("renders one cell per heading in each body row", () => {
        renderSkeleton({ rowCount: 3 });
        const bodyRows = screen.getAllByRole("row").slice(1);
        bodyRows.forEach((row) => {
            expect(within(row).getAllByRole("cell")).toHaveLength(HEADINGS.length);
        });
    });

    it("does not render a chevron cell when hasExpandableRows is false", () => {
        renderSkeleton({ rowCount: 1, hasExpandableRows: false });
        const bodyRow = screen.getAllByRole("row")[1];
        expect(within(bodyRow).getAllByRole("cell")).toHaveLength(HEADINGS.length);
    });

    it("renders a chevron cell when hasExpandableRows is true", () => {
        renderSkeleton({ rowCount: 1, hasExpandableRows: true });
        const bodyRow = screen.getAllByRole("row")[1];
        // HEADINGS.length data cells + 1 chevron cell
        expect(within(bodyRow).getAllByRole("cell")).toHaveLength(HEADINGS.length + 1);
    });

    it("renders an accessible expand-row header when hasExpandableRows is true", () => {
        renderSkeleton({ hasExpandableRows: true });
        expect(screen.getAllByRole("columnheader")).toHaveLength(HEADINGS.length + 1);
        expect(screen.getByRole("columnheader", { name: "Expand row" })).toBeInTheDocument();
    });

    it("uses 80% width for all cells when columnWidths is not supplied", () => {
        renderSkeleton({ rowCount: 1 });
        const bodyRow = screen.getAllByRole("row")[1];
        const pills = within(bodyRow).getAllByTestId("skeleton-cell-pill");
        pills.forEach((pill) => {
            expect(pill).toHaveStyle({ width: "80%" });
        });
    });

    it("uses supplied columnWidths for cell pill sizes", () => {
        const widths = ["70%", "50%", "45%", "45%", "60%"];
        renderSkeleton({ rowCount: 1, columnWidths: widths });
        const bodyRow = screen.getAllByRole("row")[1];
        const pills = within(bodyRow).getAllByTestId("skeleton-cell-pill");
        pills.forEach((pill, i) => {
            expect(pill).toHaveStyle({ width: widths[i] });
        });
    });
});
