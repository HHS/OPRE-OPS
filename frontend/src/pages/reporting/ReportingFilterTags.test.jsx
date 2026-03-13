import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReportingFilterTags from "./ReportingFilterTags";

describe("ReportingFilterTags", () => {
    it("should render nothing when no portfolios are selected", () => {
        render(
            <ReportingFilterTags
                filters={{ portfolios: [] }}
                setFilters={vi.fn()}
            />
        );
        expect(screen.queryByText("Filters Applied:")).not.toBeInTheDocument();
    });

    it("should render filter tags when portfolios are selected", () => {
        render(
            <ReportingFilterTags
                filters={{ portfolios: [{ id: 1, name: "Child Care" }] }}
                setFilters={vi.fn()}
            />
        );
        expect(screen.getByText("Filters Applied:")).toBeInTheDocument();
        expect(screen.getByText("Child Care")).toBeInTheDocument();
    });

    it("should render multiple portfolio tags", () => {
        render(
            <ReportingFilterTags
                filters={{
                    portfolios: [
                        { id: 1, name: "Child Care" },
                        { id: 2, name: "Youth Services" }
                    ]
                }}
                setFilters={vi.fn()}
            />
        );
        expect(screen.getByText("Child Care")).toBeInTheDocument();
        expect(screen.getByText("Youth Services")).toBeInTheDocument();
    });

    it("should remove a portfolio tag when clicked", () => {
        const mockSetFilters = vi.fn();
        render(
            <ReportingFilterTags
                filters={{
                    portfolios: [
                        { id: 1, name: "Child Care" },
                        { id: 2, name: "Youth Services" }
                    ]
                }}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByLabelText("Remove Child Care filter");
        fireEvent.click(removeButton);

        expect(mockSetFilters).toHaveBeenCalled();
        // Verify the updater function removes the correct portfolio
        const updaterFn = mockSetFilters.mock.calls[0][0];
        const newState = updaterFn({
            portfolios: [
                { id: 1, name: "Child Care" },
                { id: 2, name: "Youth Services" }
            ]
        });
        expect(newState.portfolios).toEqual([{ id: 2, name: "Youth Services" }]);
    });
});
