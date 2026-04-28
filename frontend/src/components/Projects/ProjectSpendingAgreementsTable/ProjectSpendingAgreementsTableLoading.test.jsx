import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectSpendingAgreementsTableLoading from "./ProjectSpendingAgreementsTableLoading";
import { ITEMS_PER_PAGE } from "../../../constants";

describe("ProjectSpendingAgreementsTableLoading", () => {
    it("renders a table with aria-label 'Loading agreements'", () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        expect(screen.getByRole("table", { name: "Loading agreements" })).toBeInTheDocument();
    });

    it("renders the table with aria-busy='true'", () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    });

    it("renders all 6 column headings including the dynamic FY label", () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        const expectedHeadings = ["Agreement", "Type", "Start", "End", "FY 2043 Total", "Agreement Total"];
        expectedHeadings.forEach((heading) => {
            expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
        });
    });

    it("updates the FY column heading when fiscalYear prop changes", () => {
        const { rerender } = render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        expect(screen.getByRole("columnheader", { name: "FY 2043 Total" })).toBeInTheDocument();

        rerender(<ProjectSpendingAgreementsTableLoading fiscalYear={2044} />);
        expect(screen.getByRole("columnheader", { name: "FY 2044 Total" })).toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "FY 2043 Total" })).not.toBeInTheDocument();
    });

    it(`renders ${ITEMS_PER_PAGE} skeleton rows`, () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        // getAllByRole("row") includes the thead row
        expect(screen.getAllByRole("row")).toHaveLength(ITEMS_PER_PAGE + 1);
    });

    it("renders 7 cells per body row (6 data + 1 chevron)", () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        const bodyRows = screen.getAllByRole("row").slice(1);
        bodyRows.forEach((row) => {
            expect(within(row).getAllByRole("cell")).toHaveLength(7);
        });
    });

    it("renders an empty chevron header cell alongside the 6 column headers", () => {
        render(<ProjectSpendingAgreementsTableLoading fiscalYear={2043} />);
        // 6 labelled headers + 1 empty header for the chevron column
        expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    });
});
