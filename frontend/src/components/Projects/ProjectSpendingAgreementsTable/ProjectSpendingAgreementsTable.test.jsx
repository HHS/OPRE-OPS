import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ITEMS_PER_PAGE } from "../../../constants";
import ProjectSpendingAgreementsTable from "./ProjectSpendingAgreementsTable";

vi.mock("../ProjectSpendingAgreementRow", () => ({
    default: ({ agreement }) => <tr data-testid={`row-${agreement.id}`} />
}));

const mockAgreements = [
    { id: 1, display_name: "Contract A" },
    { id: 2, display_name: "Contract B" }
];

// Derived from ITEMS_PER_PAGE rather than hard-coded, so these tests keep describing
// "one page plus one" if the page size ever changes.
const LAST_ON_PAGE_ONE = ITEMS_PER_PAGE;
const FIRST_ON_PAGE_TWO = ITEMS_PER_PAGE + 1;

const manyAgreements = Array.from({ length: FIRST_ON_PAGE_TWO }, (_, index) => ({
    id: index + 1,
    display_name: `Contract ${index + 1}`
}));

describe("ProjectSpendingAgreementsTable", () => {
    it("renders column headings with dynamic FY label", () => {
        render(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.getByText("Agreement")).toBeInTheDocument();
        expect(screen.getByText("Type")).toBeInTheDocument();
        expect(screen.getByText("FY 2043 Total")).toBeInTheDocument();
        expect(screen.getByText("Agreement Total")).toBeInTheDocument();
    });

    it("renders a row for each agreement", () => {
        render(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.getByTestId("row-1")).toBeInTheDocument();
        expect(screen.getByTestId("row-2")).toBeInTheDocument();
    });

    it("shows empty message when no agreements", () => {
        render(
            <ProjectSpendingAgreementsTable
                agreements={[]}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.getByText("No agreements found for FY 2043.")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("updates FY label when fiscalYear changes", () => {
        const { rerender } = render(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.getByText("FY 2043 Total")).toBeInTheDocument();

        rerender(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2044}
                fyTotals={{}}
            />
        );
        expect(screen.getByText("FY 2044 Total")).toBeInTheDocument();
    });

    it("passes fyTotal to rows", () => {
        const fyTotals = { 1: 151217218 };
        render(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2045}
                fyTotals={fyTotals}
            />
        );
        // Both rows render — fyTotal resolution is tested in the row component
        expect(screen.getByTestId("row-1")).toBeInTheDocument();
        expect(screen.getByTestId("row-2")).toBeInTheDocument();
    });

    it("renders a table element", () => {
        render(
            <ProjectSpendingAgreementsTable
                agreements={mockAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("does not paginate when the agreements exactly fill one page", () => {
        // The boundary case: the gate must be `> ITEMS_PER_PAGE`, not `>=`, or a list that
        // fits on one page renders a pointless single-page nav.
        render(
            <ProjectSpendingAgreementsTable
                agreements={manyAgreements.slice(0, ITEMS_PER_PAGE)}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );
        expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    });

    it("paginates when there are more agreements than fit on one page", async () => {
        const user = userEvent.setup();
        render(
            <ProjectSpendingAgreementsTable
                agreements={manyAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );

        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
        expect(screen.getByTestId(`row-${LAST_ON_PAGE_ONE}`)).toBeInTheDocument();
        expect(screen.queryByTestId(`row-${FIRST_ON_PAGE_TWO}`)).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Page 2" }));

        expect(screen.getByTestId(`row-${FIRST_ON_PAGE_TWO}`)).toBeInTheDocument();
        // Page 2 must hold ONLY the overflow row. Asserting row-1 is gone is not enough —
        // a slice whose start index is merely too small still drops row-1 while wrongly
        // repeating everything else from page 1.
        expect(screen.queryByTestId(`row-${LAST_ON_PAGE_ONE}`)).not.toBeInTheDocument();
        expect(screen.queryByTestId("row-1")).not.toBeInTheDocument();
    });

    it("returns to the first page when the fiscal year changes", async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <ProjectSpendingAgreementsTable
                agreements={manyAgreements}
                fiscalYear={2043}
                fyTotals={{}}
            />
        );

        await user.click(screen.getByRole("button", { name: "Page 2" }));
        expect(screen.getByTestId(`row-${FIRST_ON_PAGE_TWO}`)).toBeInTheDocument();

        rerender(
            <ProjectSpendingAgreementsTable
                agreements={manyAgreements}
                fiscalYear={2044}
                fyTotals={{}}
            />
        );

        expect(screen.getByTestId("row-1")).toBeInTheDocument();
        expect(screen.queryByTestId(`row-${FIRST_ON_PAGE_TWO}`)).not.toBeInTheDocument();
    });
});
