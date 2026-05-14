import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BudgetTeamRequisitionReviewCard from "./BudgetTeamRequisitionReviewCard";

// Mock hooks
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
        executingBliCount: 3,
        executingTotal: 250000,
        obligateByDate: "2026-05-15",
        agreementTotal: 500000,
        isCondensed: false,
        forceHover: false
    };

    it("renders review card component", () => {
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...defaultProps} />
            </MemoryRouter>
        );

        const card = screen.getByTestId("budget-team-requisition-review-card");
        expect(card).toBeInTheDocument();
    });

    it("renders review button with correct label", () => {
        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...defaultProps} />
            </MemoryRouter>
        );

        const reviewButton = screen.getByRole("button", { name: /Review agreement Test Agreement/i });
        expect(reviewButton).toBeInTheDocument();
    });

    it("renders without obligateByDate when not provided", () => {
        const propsWithoutDate = {
            ...defaultProps,
            obligateByDate: undefined
        };

        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...propsWithoutDate} />
            </MemoryRouter>
        );

        expect(screen.queryByText("Obligate By")).not.toBeInTheDocument();
    });

    it("renders in condensed mode without button", () => {
        const condensedProps = {
            ...defaultProps,
            isCondensed: true
        };

        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...condensedProps} />
            </MemoryRouter>
        );

        // In condensed mode, review button should not render
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("applies force hover styling", () => {
        const hoverProps = {
            ...defaultProps,
            forceHover: true
        };

        render(
            <MemoryRouter>
                <BudgetTeamRequisitionReviewCard {...hoverProps} />
            </MemoryRouter>
        );

        const card = screen.getByTestId("budget-team-requisition-review-card");
        expect(card).toHaveClass("bg-base-lightest");
        expect(card).toHaveClass("border-base-lighter");
    });
});
