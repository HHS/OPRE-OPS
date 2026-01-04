import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PortfolioFilterTags from "./PortfolioFilterTags";

describe("PortfolioFilterTags", () => {
    const mockSetFilters = vi.fn();
    const defaultBudgetRange = [0, 100000000];

    const mockPortfolios = [
        { id: 1, name: "Portfolio A" },
        { id: 2, name: "Portfolio B" }
    ];

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    it("should not render when no filters are active", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: defaultBudgetRange,
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        // Should render nothing when no filters are active
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render portfolio filter tags", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: mockPortfolios,
                    budgetRange: defaultBudgetRange,
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("Portfolio B")).toBeInTheDocument();
    });

    it("should render budget range filter tag when not default", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: [1000000, 50000000],
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("$1,000,000 - $50,000,000")).toBeInTheDocument();
    });

    it("should not render budget range tag when equal to default", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: defaultBudgetRange,
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render available percentage filter tags", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: defaultBudgetRange,
                    availablePct: ["over90", "75-90"]
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();
    });

    it("should render all filter types together", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [mockPortfolios[0]],
                    budgetRange: [1000000, 50000000],
                    availablePct: ["over90"]
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("$1,000,000 - $50,000,000")).toBeInTheDocument();
        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
    });

    it("should remove portfolio filter when tag is clicked", async () => {
        const user = userEvent.setup();
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: mockPortfolios,
                    budgetRange: defaultBudgetRange,
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        // Find all buttons and click the one associated with Portfolio A
        const buttons = screen.getAllByRole("button");
        const portfolioAButton = buttons.find((button) =>
            within(button).queryByText("Portfolio A")
        );

        if (portfolioAButton) {
            await user.click(portfolioAButton);
        }

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should reset budget range to default when budget tag is removed", async () => {
        const user = userEvent.setup();
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: [1000000, 50000000],
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        // Find all buttons and click the one associated with the budget range
        const buttons = screen.getAllByRole("button");
        const budgetButton = buttons.find((button) =>
            within(button).queryByText("$1,000,000 - $50,000,000")
        );

        if (budgetButton) {
            await user.click(budgetButton);
        }

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should remove percentage range when tag is clicked", async () => {
        const user = userEvent.setup();
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: defaultBudgetRange,
                    availablePct: ["over90", "75-90"]
                }}
                setFilters={mockSetFilters}
            />
        );

        // Find all buttons and click the one associated with the percentage range
        const buttons = screen.getAllByRole("button");
        const pctButton = buttons.find((button) =>
            within(button).queryByText("Over 90% available")
        );

        if (pctButton) {
            await user.click(pctButton);
        }

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should handle all percentage range labels correctly", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: defaultBudgetRange,
                    availablePct: ["over90", "75-90", "50-75", "25-50", "under25"]
                }}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Over 90% available")).toBeInTheDocument();
        expect(screen.getByText("75% - 90% available")).toBeInTheDocument();
        expect(screen.getByText("50% - 75% available")).toBeInTheDocument();
        expect(screen.getByText("25% - 50% available")).toBeInTheDocument();
        expect(screen.getByText("Less than 25% available")).toBeInTheDocument();
    });

    it("should show budget tag when budget differs from default", () => {
        render(
            <PortfolioFilterTags
                filters={{
                    portfolios: [],
                    budgetRange: [10000000, 50000000],
                    availablePct: []
                }}
                setFilters={mockSetFilters}
            />
        );

        // Should show tag since it differs from DEFAULT_BUDGET_RANGE [0, 100000000]
        expect(screen.getByText("$10,000,000 - $50,000,000")).toBeInTheDocument();
    });
});
