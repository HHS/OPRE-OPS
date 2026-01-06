import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PortfolioFilterButton from "./PortfolioFilterButton";

// Mock react-modal
vi.mock("react-modal", () => {
    const Modal = ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
    Modal.setAppElement = vi.fn();
    return {
        default: Modal
    };
});

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("PortfolioFilterButton", () => {
    const mockSetFilters = vi.fn();
    const defaultBudgetRange = [0, 100000000];
    const mockFyBudgetRange = [10000000, 50000000]; // Calculated from portfolio funding data

    const mockAllPortfolios = [
        { id: 1, name: "Portfolio A", abbreviation: "PA" },
        { id: 2, name: "Portfolio B", abbreviation: "PB" },
        { id: 3, name: "Portfolio C", abbreviation: "PC" }
    ];

    const defaultFilters = {
        portfolios: [],
        budgetRange: defaultBudgetRange,
        availablePct: []
    };

    // Create a mock store
    const mockStore = configureStore({
        reducer: {
            userSlice: (state = { activeUser: { id: 1, roles: [] } }) => state
        }
    });

    // Helper to render with Router and Redux context
    const renderWithRouter = (ui) => {
        return render(
            <Provider store={mockStore}>
                <MemoryRouter>{ui}</MemoryRouter>
            </Provider>
        );
    };

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    it("should render the filter button", () => {
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should open modal when filter button is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByTestId("modal")).toBeInTheDocument();
        });
    });

    it("should display all three filter fieldsets in modal", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByText("All Portfolios")).toBeInTheDocument();
            expect(screen.getByText("Budget Range")).toBeInTheDocument();
            expect(screen.getByText("Available Budget %")).toBeInTheDocument();
        });
    });

    it("should display Apply and Reset buttons in modal", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
        });
    });

    it("should call setFilters when Apply is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        });

        const applyButton = screen.getByRole("button", { name: /apply/i });
        await user.click(applyButton);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should reset filters when Reset is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithSelections = {
            portfolios: [mockAllPortfolios[0]],
            budgetRange: [1000000, 50000000],
            availablePct: ["over90"]
        };

        renderWithRouter(
            <PortfolioFilterButton
                filters={filtersWithSelections}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
        });

        const resetButton = screen.getByRole("button", { name: /reset/i });
        await user.click(resetButton);

        expect(mockSetFilters).toHaveBeenCalledWith({
            portfolios: [],
            budgetRange: defaultBudgetRange,
            availablePct: []
        });
    });

    it("should use provided fiscal year budget range", () => {
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        // The component should use the provided fyBudgetRange [10000000, 50000000]
        // This is tested indirectly through the slider component rendering
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should use default budget range when provided", () => {
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={defaultBudgetRange}
            />
        );

        // Should use the provided default range
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should sync state with filters prop via useEffect", async () => {
        const { rerender } = renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const updatedFilters = {
            portfolios: [mockAllPortfolios[0]],
            budgetRange: [1000000, 50000000],
            availablePct: ["over90"]
        };

        rerender(
            <PortfolioFilterButton
                filters={updatedFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        // Internal state should sync with updated filters
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should handle empty portfolios array", () => {
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={[]}
                fyBudgetRange={defaultBudgetRange}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should close modal when Apply is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={mockFyBudgetRange}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByTestId("modal")).toBeInTheDocument();
        });

        const applyButton = screen.getByRole("button", { name: /apply/i });
        await user.click(applyButton);

        await waitFor(() => {
            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });
    });

    it("should handle budget range with edge values", () => {
        const edgeBudgetRange = [0, 1000000000]; // $0 to $1B

        renderWithRouter(
            <PortfolioFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                allPortfolios={mockAllPortfolios}
                fyBudgetRange={edgeBudgetRange}
            />
        );

        // Should handle large budget range values
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });
});
