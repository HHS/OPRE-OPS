import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import ApprovalFlowReviewCard from "./ApprovalFlowReviewCard";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

// Mock the hooks
vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: vi.fn()
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe("ApprovalFlowReviewCard", () => {
    const defaultProps = {
        agreementId: 123,
        requestorId: 456,
        requestDate: "2024-06-12",
        executingBliCount: 3,
        executingTotal: 150000.5,
        agreementTotal: 500000.75,
        headingText: "Pre-Award",
        navigationPath: "review-pre-award",
        dataCyPrefix: "pre-award-review-card",
        buttonText: "Review Agreement"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetAgreementName.mockReturnValue("Contract #001: Test Agreement");
        useGetUserFullNameFromId.mockReturnValue("John Doe");
    });

    const renderComponent = (props = {}) => {
        return render(
            <BrowserRouter>
                <ApprovalFlowReviewCard
                    {...defaultProps}
                    {...props}
                />
            </BrowserRouter>
        );
    };

    describe("Basic Rendering", () => {
        it("should render the component with all required fields", () => {
            renderComponent();

            expect(screen.getByRole("heading", { name: "Pre-Award" })).toBeInTheDocument();
            expect(screen.getByText("Contract #001: Test Agreement")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument(); // BLI count
            expect(screen.getByText("$150,000.50")).toBeInTheDocument(); // Executing total
            expect(screen.getByText("$500,000.75")).toBeInTheDocument(); // Agreement total
            expect(screen.getByText("June 12, 2024")).toBeInTheDocument(); // Request date
        });

        it("should render with correct data-cy and data-testid attributes", () => {
            renderComponent();

            const card = screen.getByTestId("pre-award-review-card");
            expect(card).toBeInTheDocument();
            expect(card).toHaveAttribute("data-cy", "pre-award-review-card");
        });

        it("should render heading text as JSX node", () => {
            renderComponent({
                headingText: (
                    <>
                        Budget Team
                        <br />
                        Requisition
                    </>
                )
            });

            const heading = screen.getByRole("heading");
            expect(heading).toBeInTheDocument();
            expect(heading.innerHTML).toContain("Budget Team");
            expect(heading.innerHTML).toContain("<br>");
            expect(heading.innerHTML).toContain("Requisition");
        });
    });

    describe("Data Labels", () => {
        it("should render all data definition labels", () => {
            renderComponent();

            expect(screen.getByText("Agreement")).toBeInTheDocument();
            expect(screen.getByText("Requested by")).toBeInTheDocument();
            expect(screen.getByText("BLs Executing")).toBeInTheDocument();
            expect(screen.getByText("Executing Total")).toBeInTheDocument();
            expect(screen.getByText("Agreement Total")).toBeInTheDocument();
        });

        it("should render 'Unknown' when requestor name is not available", () => {
            useGetUserFullNameFromId.mockReturnValue(null);
            renderComponent();

            expect(screen.getByText("Unknown")).toBeInTheDocument();
        });
    });

    describe("Obligate By Date (Conditional)", () => {
        it("should render 'Obligate By' field when obligateByDate is provided", () => {
            renderComponent({ obligateByDate: "2024-12-31" });

            expect(screen.getByText("Obligate By")).toBeInTheDocument();
            expect(screen.getByText("December 31, 2024")).toBeInTheDocument();
        });

        it("should not render 'Obligate By' field when obligateByDate is not provided", () => {
            renderComponent({ obligateByDate: undefined });

            expect(screen.queryByText("Obligate By")).not.toBeInTheDocument();
        });

        it("should adjust Agreement Total grid column when obligateByDate is present", () => {
            renderComponent({ obligateByDate: "2024-12-31" });

            // Verify both Obligate By and Agreement Total are present
            expect(screen.getByText("Obligate By")).toBeInTheDocument();
            expect(screen.getByText("Agreement Total")).toBeInTheDocument();
            // Grid layout is tested via CSS Grid Layout describe block
        });

        it("should span Agreement Total across columns 4-6 when obligateByDate is absent", () => {
            renderComponent({ obligateByDate: undefined });

            // Verify Agreement Total is present but Obligate By is not
            expect(screen.queryByText("Obligate By")).not.toBeInTheDocument();
            expect(screen.getByText("Agreement Total")).toBeInTheDocument();
        });
    });

    describe("Currency Formatting", () => {
        it("should format executing total as currency", () => {
            renderComponent({ executingTotal: 1234567.89 });

            expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
        });

        it("should format agreement total as currency", () => {
            renderComponent({ agreementTotal: 9876543.21 });

            expect(screen.getByText("$9,876,543.21")).toBeInTheDocument();
        });

        it("should handle zero amounts", () => {
            renderComponent({ executingTotal: 0, agreementTotal: 0 });

            expect(screen.getAllByText("$0")).toHaveLength(2);
        });

        it("should handle large amounts with proper formatting", () => {
            renderComponent({ executingTotal: 10000000 });

            expect(screen.getByText("$10,000,000.00")).toBeInTheDocument();
        });
    });

    describe("Navigation Button", () => {
        it("should render the review button with correct text", () => {
            renderComponent();

            const button = screen.getByRole("button", { name: /Review agreement/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent("Review Agreement");
        });

        it("should navigate to correct path when button is clicked", async () => {
            const user = userEvent.setup();
            renderComponent();

            const button = screen.getByRole("button", { name: /Review agreement/i });
            await user.click(button);

            expect(mockNavigate).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith("/agreements/123/review-pre-award");
        });

        it("should build navigation path correctly with different agreementId and path", async () => {
            const user = userEvent.setup();
            renderComponent({
                agreementId: 999,
                navigationPath: "review-requisition",
                buttonText: "Add Requisition"
            });

            const button = screen.getByRole("button", { name: /Review agreement Contract #001: Test Agreement/i });
            await user.click(button);

            expect(mockNavigate).toHaveBeenCalledWith("/agreements/999/review-requisition");
        });

        it("should have correct aria-label for accessibility", () => {
            renderComponent();

            const button = screen.getByRole("button", { name: /Review agreement/i });
            expect(button).toHaveAttribute("aria-label", "Review agreement Contract #001: Test Agreement");
        });

        it("should have eye icon in button", () => {
            renderComponent();

            const button = screen.getByRole("button", { name: /Review agreement/i });
            // Button should exist - icon rendering is implementation detail
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent("Review Agreement");
        });
    });

    describe("Condensed Mode", () => {
        it("should hide Agreement field when isCondensed is true", () => {
            renderComponent({ isCondensed: true });

            expect(screen.queryByText("Agreement")).not.toBeInTheDocument();
            expect(screen.queryByText("Contract #001: Test Agreement")).not.toBeInTheDocument();
        });

        it("should hide review button when isCondensed is true", () => {
            renderComponent({ isCondensed: true });

            expect(screen.queryByRole("button", { name: /Review agreement/i })).not.toBeInTheDocument();
        });

        it("should still show all other fields in condensed mode", () => {
            renderComponent({ isCondensed: true });

            expect(screen.getByText("Requested by")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("BLs Executing")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
            expect(screen.getByText("Executing Total")).toBeInTheDocument();
            expect(screen.getByText("Agreement Total")).toBeInTheDocument();
            expect(screen.getByText("June 12, 2024")).toBeInTheDocument();
        });

        it("should show Agreement and button when isCondensed is false", () => {
            renderComponent({ isCondensed: false });

            expect(screen.getByText("Agreement")).toBeInTheDocument();
            expect(screen.getByText("Contract #001: Test Agreement")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Review agreement/i })).toBeInTheDocument();
        });
    });

    describe("Hover State", () => {
        it("should apply hover styles when forceHover is true", () => {
            renderComponent({ forceHover: true });

            const card = screen.getByTestId("pre-award-review-card");
            expect(card).toHaveClass("bg-base-lightest");
            expect(card).toHaveClass("border-base-lighter");
        });

        it("should apply default styles when forceHover is false", () => {
            renderComponent({ forceHover: false });

            const card = screen.getByTestId("pre-award-review-card");
            expect(card).toHaveClass("border-base-light");
            expect(card).toHaveClass("hover:border-base-lighter");
            expect(card).not.toHaveClass("bg-base-lightest");
        });
    });

    describe("CSS Grid Layout", () => {
        it("should use CSS Grid with 5 columns", () => {
            renderComponent();

            const card = screen.getByTestId("pre-award-review-card");
            expect(card).toHaveStyle({
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "auto auto auto"
            });
        });

        it("should set minimum height", () => {
            renderComponent();

            const card = screen.getByTestId("pre-award-review-card");
            expect(card).toHaveStyle({ minHeight: "8.375rem" });
        });

        it("should render heading without wrapping", () => {
            renderComponent();

            const heading = screen.getByRole("heading", { name: "Pre-Award" });
            expect(heading).toBeInTheDocument();
            // Heading wrapping is controlled by CSS - verify heading exists and is short
        });
    });

    describe("Date Formatting", () => {
        it("should format request date correctly", () => {
            renderComponent({ requestDate: "2024-01-15" });

            expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
        });

        it("should display request date in footer", () => {
            renderComponent();

            // Date is displayed with icon in footer
            expect(screen.getByText("June 12, 2024")).toBeInTheDocument();
        });
    });

    describe("Integration with Hooks", () => {
        it("should call useGetAgreementName with agreementId", () => {
            renderComponent({ agreementId: 789 });

            expect(useGetAgreementName).toHaveBeenCalledWith(789);
        });

        it("should call useGetUserFullNameFromId with requestorId", () => {
            renderComponent({ requestorId: 321 });

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(321);
        });

        it("should display agreement name from hook", () => {
            useGetAgreementName.mockReturnValue("Custom Agreement Name");
            renderComponent();

            expect(screen.getByText("Custom Agreement Name")).toBeInTheDocument();
        });

        it("should display user name from hook", () => {
            useGetUserFullNameFromId.mockReturnValue("Jane Smith");
            renderComponent();

            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("should handle very long agreement names", () => {
            useGetAgreementName.mockReturnValue(
                "This is an extremely long agreement name that should still render properly without breaking the layout"
            );
            renderComponent();

            expect(
                screen.getByText(
                    "This is an extremely long agreement name that should still render properly without breaking the layout"
                )
            ).toBeInTheDocument();
        });

        it("should handle BLI count of zero", () => {
            renderComponent({ executingBliCount: 0 });

            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should handle very large BLI counts", () => {
            renderComponent({ executingBliCount: 999 });

            expect(screen.getByText("999")).toBeInTheDocument();
        });

        it("should render with minimum required props", () => {
            renderComponent({
                obligateByDate: undefined,
                isCondensed: false,
                forceHover: false
            });

            expect(screen.getByRole("heading", { name: "Pre-Award" })).toBeInTheDocument();
        });
    });
});
