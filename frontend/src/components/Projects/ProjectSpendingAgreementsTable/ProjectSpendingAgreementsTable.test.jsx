import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectSpendingAgreementsTable from "./ProjectSpendingAgreementsTable";

vi.mock("../ProjectSpendingAgreementRow", () => ({
    default: ({ agreement }) => <tr data-testid={`row-${agreement.id}`} />
}));

const mockAgreements = [
    { id: 1, display_name: "Contract A" },
    { id: 2, display_name: "Contract B" }
];

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
                fyTotals={{}}            />
        );
        expect(screen.getByRole("table")).toBeInTheDocument();
    });
});
