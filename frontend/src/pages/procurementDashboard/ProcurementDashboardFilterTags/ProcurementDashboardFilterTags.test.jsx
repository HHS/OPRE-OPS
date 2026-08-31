import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProcurementDashboardFilterTags from "./ProcurementDashboardFilterTags";

vi.mock("../../../components/UI/FilterTags/FilterTags", () => ({
    default: ({ tagsList, removeFilter }) => (
        <div data-testid="filter-tags">
            {tagsList.map((tag, index) => (
                <button
                    key={index}
                    onClick={() => removeFilter(tag)}
                    data-testid={`remove-tag-${tag.tagText}`}
                >
                    {tag.tagText} ×
                </button>
            ))}
        </div>
    )
}));

vi.mock("../../../components/UI/FilterTags/FilterTagsWrapper", () => ({
    default: ({ children }) => <div data-testid="filter-tags-wrapper">{children}</div>
}));

describe("ProcurementDashboardFilterTags", () => {
    const mockSetFilters = vi.fn();
    const defaultFilters = { procShop: [], division: [] };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not render when no filters are applied", () => {
        render(
            <ProcurementDashboardFilterTags
                filters={defaultFilters}
                setFilters={mockSetFilters}
            />
        );
        expect(screen.queryByTestId("filter-tags-wrapper")).not.toBeInTheDocument();
    });

    it("renders procurement shop tags by abbr", () => {
        const filters = {
            ...defaultFilters,
            procShop: [
                { id: 1, abbr: "GCS" },
                { id: 2, abbr: "PSC" }
            ]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );
        expect(screen.getByTestId("remove-tag-GCS")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-PSC")).toBeInTheDocument();
    });

    it("renders division tags by name", () => {
        const filters = {
            ...defaultFilters,
            division: [
                { id: 1, name: "Division A" },
                { id: 2, name: "Division B" }
            ]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );
        expect(screen.getByTestId("remove-tag-Division A")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Division B")).toBeInTheDocument();
    });

    it("renders proc shop and division tags together", () => {
        const filters = {
            procShop: [{ id: 1, abbr: "GCS" }],
            division: [{ id: 1, name: "Division A" }]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );
        expect(screen.getByTestId("remove-tag-GCS")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Division A")).toBeInTheDocument();
    });

    it("removes a division tag from the filters", async () => {
        const filters = {
            ...defaultFilters,
            division: [
                { id: 1, name: "Division A" },
                { id: 2, name: "Division B" }
            ]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("remove-tag-Division A"));

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(filters);
        expect(result.division).toHaveLength(1);
        expect(result.division[0].name).toBe("Division B");
    });

    it("removes only the targeted division by id even when two share the same name", async () => {
        const filters = {
            ...defaultFilters,
            division: [
                { id: 1, name: "Shared Name" },
                { id: 2, name: "Shared Name" }
            ]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        // Both tags render with the same text; the remove buttons carry distinct ids.
        const tagButtons = screen.getAllByTestId("remove-tag-Shared Name");
        expect(tagButtons).toHaveLength(2);
        fireEvent.click(tagButtons[0]);

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(filters);
        // Only the id-1 division is removed, not both.
        expect(result.division).toHaveLength(1);
        expect(result.division[0].id).toBe(2);
    });

    it("removes a procurement shop tag from the filters", async () => {
        const filters = {
            ...defaultFilters,
            procShop: [
                { id: 1, abbr: "GCS" },
                { id: 2, abbr: "PSC" }
            ]
        };
        render(
            <ProcurementDashboardFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        fireEvent.click(screen.getByTestId("remove-tag-GCS"));

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback(filters);
        expect(result.procShop).toHaveLength(1);
        expect(result.procShop[0].abbr).toBe("PSC");
    });
});
