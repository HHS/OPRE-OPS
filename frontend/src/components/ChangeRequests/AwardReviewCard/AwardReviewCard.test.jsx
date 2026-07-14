import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AwardReviewCard from "./AwardReviewCard";

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: () => "Agreement Name B"
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "Sheila Celentano"
}));

const defaultProps = {
    agreementId: 42,
    requestorId: 503,
    requestDate: "2024-01-14",
    awardAmount: 1500000,
    awardDate: "2024-09-30"
};

describe("AwardReviewCard", () => {
    it("renders the card", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByTestId("award-review-card")).toBeInTheDocument();
    });

    it("shows the heading 'Award'", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText("Award")).toBeInTheDocument();
    });

    it("shows the agreement name", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText("Agreement Name B")).toBeInTheDocument();
    });

    it("shows 'Requested by' with the requestor name", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText("Sheila Celentano")).toBeInTheDocument();
    });

    it("shows the Award Amount", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText("Award Amount")).toBeInTheDocument();
    });

    it("shows the Award Date", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByText("Award Date")).toBeInTheDocument();
    });

    it("renders a Review Agreement button that navigates to review-award", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        expect(screen.getByRole("button", { name: /Review agreement Agreement Name B/i })).toBeInTheDocument();
    });

    it("shows the request date", () => {
        render(
            <MemoryRouter>
                <AwardReviewCard {...defaultProps} />
            </MemoryRouter>
        );
        // formatDateToMonthDayYear("2024-01-14") → "January 14, 2024"
        expect(screen.getByText("January 14, 2024")).toBeInTheDocument();
    });
});
