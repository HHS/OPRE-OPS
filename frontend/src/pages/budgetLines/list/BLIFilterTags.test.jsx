import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import BLIFilterTags from "./BLIFilterTags";
import { getFiscalYearHelpers } from "./fiscalYearFilterHelpers";

// Mock child components
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

describe("BLIFilterTags", () => {
    const mockSetFilters = vi.fn();
    // Use Approach A (default) for tests - same behavior as current PR
    const mockFyHelpers = getFiscalYearHelpers(false);

    const defaultFilters = {
        fiscalYears: [],
        portfolios: [],
        bliStatus: [],
        budgetRange: null,
        agreementTypes: [],
        agreementTitles: [],
        canActivePeriods: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not render when no filters are applied", () => {
        render(
            <BLIFilterTags
                filters={defaultFilters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.queryByTestId("filter-tags-wrapper")).not.toBeInTheDocument();
    });

    it("renders fiscal year tags", () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-FY 2024")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-FY 2025")).toBeInTheDocument();
    });

    it("renders no fiscal year tags when fiscalYears is null (All)", () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: null
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        // null fiscalYears means "All" - no fiscal year tags displayed
        expect(screen.queryByTestId("remove-tag-FY 2024")).not.toBeInTheDocument();
        expect(screen.queryByTestId("remove-tag-FY 2025")).not.toBeInTheDocument();
    });

    it("renders no component when fiscalYears is null and no other filters", () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: null
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        // No tags, so filter tags wrapper should not render
        expect(screen.queryByTestId("filter-tags-wrapper")).not.toBeInTheDocument();
    });

    it.each([
        ["fiscalYears", null],
        ["fiscalYears", undefined],
        ["portfolios", null],
        ["bliStatus", null],
        ["agreementTypes", null],
        ["agreementTitles", null],
        ["canActivePeriods", null]
    ])("handles %s as %s gracefully", (filterKey, value) => {
        const filtersWithNullish = {
            ...defaultFilters,
            [filterKey]: value
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filtersWithNullish}
                    setFilters={mockSetFilters}
                    fyHelpers={mockFyHelpers}
                />
            );
        }).not.toThrow();
    });

    it("handles removing fiscal year tag", async () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-FY 2024");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
        });

        // Simulate the filter update
        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            fiscalYears: [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ]
        });

        expect(result.fiscalYears).toHaveLength(1);
        expect(result.fiscalYears[0].title).toBe(2025);
    });

    it("handles removing fiscalYears tag - sets to null when empty (All)", async () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: [{ id: 2024, title: 2024 }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-FY 2024");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        // For fiscalYears, empty array means "All" → set to null
        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            fiscalYears: [{ id: 2024, title: 2024 }]
        });

        expect(result.fiscalYears).toBeNull();
    });

    it.each([
        ["portfolios", "Portfolio 1", { id: 1, name: "Portfolio 1" }],
        ["bliStatus", "DRAFT", { id: 1, title: "DRAFT" }],
        ["agreementTypes", "CONTRACT", { id: 1, title: "CONTRACT" }],
        ["agreementTitles", "Agreement 1", { id: 1, name: "Agreement 1" }],
        ["canActivePeriods", "Active", { id: 1, title: "Active" }]
    ])("handles removing %s tag with null prevState", async (filterKey, tagText, item) => {
        const filters = {
            ...defaultFilters,
            [filterKey]: [item]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        const removeButton = screen.getByTestId(`remove-tag-${tagText}`);
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        // Test that the filter function handles null gracefully
        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            [filterKey]: null
        });

        expect(result[filterKey]).toEqual([]);
    });

    it("renders portfolio tags", () => {
        const filters = {
            ...defaultFilters,
            portfolios: [
                { id: 1, name: "Portfolio 1" },
                { id: 2, name: "Portfolio 2" }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-Portfolio 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Portfolio 2")).toBeInTheDocument();
    });

    it("renders BLI status tags", () => {
        const filters = {
            ...defaultFilters,
            bliStatus: [
                { id: 1, title: "DRAFT" },
                { id: 2, title: "PLANNED" }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-DRAFT")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-PLANNED")).toBeInTheDocument();
    });

    it("renders budget range tag", () => {
        const filters = {
            ...defaultFilters,
            budgetRange: [0, 100000]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByText(/\$0 - \$100,000/)).toBeInTheDocument();
    });

    it("handles removing budget range tag", async () => {
        const filters = {
            ...defaultFilters,
            budgetRange: [0, 100000]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        const removeButton = screen.getByText(/\$0 - \$100,000 ×/);
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });
    });

    it("renders agreement type tags", () => {
        const filters = {
            ...defaultFilters,
            agreementTypes: [
                { id: 1, title: "CONTRACT" },
                { id: 2, title: "GRANT" }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-CONTRACT")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-GRANT")).toBeInTheDocument();
    });

    it("renders agreement title tags", () => {
        const filters = {
            ...defaultFilters,
            agreementTitles: [
                { id: 1, name: "Agreement 1" },
                { id: 2, name: "Agreement 2" }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-Agreement 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Agreement 2")).toBeInTheDocument();
    });

    it("renders CAN active period tags", () => {
        const filters = {
            ...defaultFilters,
            canActivePeriods: [
                { id: 1, title: "Active" },
                { id: 2, title: "Inactive" }
            ]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-Active")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Inactive")).toBeInTheDocument();
    });

    it("handles all null filters gracefully", () => {
        const allNullFilters = {
            fiscalYears: null,
            portfolios: null,
            bliStatus: null,
            budgetRange: null,
            agreementTypes: null,
            agreementTitles: null,
            canActivePeriods: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={allNullFilters}
                    setFilters={mockSetFilters}
                    fyHelpers={mockFyHelpers}
                />
            );
        }).not.toThrow();
    });

    it("renders multiple filter types together", () => {
        const filters = {
            fiscalYears: [{ id: 2024, title: 2024 }],
            portfolios: [{ id: 1, name: "Portfolio 1" }],
            bliStatus: [{ id: 1, title: "DRAFT" }],
            budgetRange: [0, 100000],
            agreementTypes: [{ id: 1, title: "CONTRACT" }],
            agreementTitles: [{ id: 1, name: "Agreement 1" }],
            canActivePeriods: [{ id: 1, title: "Active" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
                fyHelpers={mockFyHelpers}
            />
        );

        expect(screen.getByTestId("remove-tag-FY 2024")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Portfolio 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-DRAFT")).toBeInTheDocument();
        expect(screen.getByText(/\$0 - \$100,000/)).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-CONTRACT")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Agreement 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Active")).toBeInTheDocument();
    });
});
