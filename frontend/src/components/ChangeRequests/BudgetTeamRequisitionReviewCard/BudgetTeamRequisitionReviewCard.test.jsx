import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BudgetTeamRequisitionReviewCard from "./BudgetTeamRequisitionReviewCard";

// Mock the hooks
vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: () => "Test Agreement"
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "John Doe"
}));

describe("BudgetTeamRequisitionReviewCard", () => {
    const defaultProps = {
        agreementId: 1,
        requestorId: 500,
        requestDate: "2026-04-15",
        executingBliCount: 5,
        executingTotal: 100000,
        obligateByDate: "2026-09-30",
        agreementTotal: 250000,
        isCondensed: false,
        forceHover: false
    };

    it("renders all required data fields", () => {
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByRole("heading", { name: /Pre-Award Requisition/i })).toBeInTheDocument();
        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("$100,000.00")).toBeInTheDocument();
        expect(screen.getByText("$250,000.00")).toBeInTheDocument();
    });

    it("renders the review button", () => {
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...defaultProps} />
            </MemoryRouter>
        );

        const button = screen.getByRole("button", { name: /review agreement test agreement/i });
        expect(button).toBeInTheDocument();
    });

    it("button displays but has no onClick handler", () => {
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...defaultProps} />
            </MemoryRouter>
        );

        const button = screen.getByRole("button", { name: /review agreement test agreement/i });
        expect(button).toBeInTheDocument();
        // Verify button exists but doesn't have click behavior (PR4 will add navigation)
        expect(button.onclick).toBeNull();
    });

    it("renders without obligateByDate when not provided", () => {
        const propsWithoutObligateBy = { ...defaultProps, obligateByDate: undefined };
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...propsWithoutObligateBy} />
            </MemoryRouter>
        );

        expect(screen.queryByText("Obligate By")).not.toBeInTheDocument();
    });

    it("renders in condensed mode without header and button", () => {
        const condensedProps = { ...defaultProps, isCondensed: true };
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...condensedProps} />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Pre-Award Requisition/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
