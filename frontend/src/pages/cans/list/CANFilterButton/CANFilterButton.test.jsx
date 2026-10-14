import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CANFilterButton from "./CANFilterButton";

// Mock react-modal so open/closed state is trivial to assert, following the
// ProjectFilterButton.test.jsx pattern.
vi.mock("react-modal", () => {
    const Modal = ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
    Modal.setAppElement = vi.fn();
    return {
        default: Modal
    };
});

describe("CANFilterButton", () => {
    const fyBudgetRange = [0, 1000];
    const filtersWithSelections = {
        activePeriod: [{ id: 1, title: "1 Year" }],
        transfer: [{ id: 1, title: "Direct" }],
        portfolio: [{ id: 1, title: "Portfolio A" }],
        can: [{ id: 1, title: "CAN 1" }],
        budget: [100, 500]
    };
    const portfolioOptions = [{ id: 1, title: "Portfolio A" }];
    const canOptions = [{ id: 1, title: "CAN 1" }];

    const renderFilterButton = (filters, setFilters) =>
        render(
            <CANFilterButton
                filters={filters}
                setFilters={setFilters}
                portfolioOptions={portfolioOptions}
                canOptions={canOptions}
                fyBudgetRange={fyBudgetRange}
                disabled={false}
            />
        );

    it("Reset does not call setFilters, the modal stays open, and the fields visibly clear", async () => {
        const user = userEvent.setup();
        const setFilters = vi.fn();
        renderFilterButton(filtersWithSelections, setFilters);

        await user.click(screen.getByText("Filters"));
        expect(screen.getByTestId("modal")).toBeInTheDocument();
        expect(screen.getByText("1 Year")).toBeInTheDocument();
        expect(screen.getByText("Direct")).toBeInTheDocument();
        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("CAN 1")).toBeInTheDocument();
        expect(screen.getByText(/\$\s*100\b/)).toBeInTheDocument();
        expect(screen.getByText(/\$\s*500\b/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /reset/i }));

        expect(setFilters).not.toHaveBeenCalled();
        expect(screen.getByTestId("modal")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();

        expect(screen.queryByText("1 Year")).not.toBeInTheDocument();
        expect(screen.queryByText("Direct")).not.toBeInTheDocument();
        expect(screen.queryByText("Portfolio A")).not.toBeInTheDocument();
        expect(screen.queryByText("CAN 1")).not.toBeInTheDocument();
        // Slider snaps back to the full FY range, not [] — [] would render "$ NaN".
        expect(screen.getByText(/\$\s*0\b/)).toBeInTheDocument();
        expect(screen.getByText(/\$\s*1,000\b/)).toBeInTheDocument();
    });

    it("Reset then close then reopen reseeds from the still-active parent filters", async () => {
        const user = userEvent.setup();
        const setFilters = vi.fn();
        const { container } = renderFilterButton(filtersWithSelections, setFilters);

        await user.click(screen.getByText("Filters"));
        await user.click(screen.getByRole("button", { name: /reset/i }));

        // Cleared intermediate state, before reopening — pins that resetFilter really
        // cleared the local buffers rather than the parent filters trivially holding
        // (a vi.fn() setFilters never actually clears anything on `main`).
        expect(screen.queryByText("1 Year")).not.toBeInTheDocument();
        expect(screen.queryByText("Portfolio A")).not.toBeInTheDocument();
        expect(screen.getByText(/\$\s*0\b/)).toBeInTheDocument();
        expect(screen.getByText(/\$\s*1,000\b/)).toBeInTheDocument();

        // FilterButton.jsx renders a bare `<svg id="filter-close">` with no accessible name.
        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        await user.click(container.querySelector("#filter-close"));
        expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

        await user.click(screen.getByText("Filters"));

        expect(screen.getByText("1 Year")).toBeInTheDocument();
        expect(screen.getByText("Direct")).toBeInTheDocument();
        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("CAN 1")).toBeInTheDocument();
        expect(screen.getByText(/\$\s*100\b/)).toBeInTheDocument();
        expect(screen.getByText(/\$\s*500\b/)).toBeInTheDocument();
        expect(setFilters).not.toHaveBeenCalled();
    });
});
