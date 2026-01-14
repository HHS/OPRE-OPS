import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import BLIFilterTags from "./BLIFilterTags";

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
            />
        );

        expect(screen.getByTestId("remove-tag-FY 2024")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-FY 2025")).toBeInTheDocument();
    });

    it("removes fiscal year tag when null array", () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("removes fiscal year tag when undefined array", () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: undefined
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
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

    it("handles removing fiscal year tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            fiscalYears: [{ id: 2024, title: 2024 }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-FY 2024");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        // Test that the filter function handles null gracefully
        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            fiscalYears: null
        });

        expect(result.fiscalYears).toEqual([]);
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
            />
        );

        expect(screen.getByTestId("remove-tag-Portfolio 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Portfolio 2")).toBeInTheDocument();
    });

    it("handles null portfolios filter", () => {
        const filters = {
            ...defaultFilters,
            portfolios: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("handles removing portfolio tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            portfolios: [{ id: 1, name: "Portfolio 1" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-Portfolio 1");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            portfolios: null
        });

        expect(result.portfolios).toEqual([]);
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
            />
        );

        expect(screen.getByTestId("remove-tag-DRAFT")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-PLANNED")).toBeInTheDocument();
    });

    it("handles null bliStatus filter", () => {
        const filters = {
            ...defaultFilters,
            bliStatus: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("handles removing bliStatus tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            bliStatus: [{ id: 1, title: "DRAFT" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-DRAFT");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            bliStatus: null
        });

        expect(result.bliStatus).toEqual([]);
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
            />
        );

        expect(screen.getByTestId("remove-tag-CONTRACT")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-GRANT")).toBeInTheDocument();
    });

    it("handles null agreementTypes filter", () => {
        const filters = {
            ...defaultFilters,
            agreementTypes: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("handles removing agreementTypes tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            agreementTypes: [{ id: 1, title: "CONTRACT" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-CONTRACT");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            agreementTypes: null
        });

        expect(result.agreementTypes).toEqual([]);
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
            />
        );

        expect(screen.getByTestId("remove-tag-Agreement 1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Agreement 2")).toBeInTheDocument();
    });

    it("handles null agreementTitles filter", () => {
        const filters = {
            ...defaultFilters,
            agreementTitles: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("handles removing agreementTitles tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            agreementTitles: [{ id: 1, name: "Agreement 1" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-Agreement 1");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            agreementTitles: null
        });

        expect(result.agreementTitles).toEqual([]);
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
            />
        );

        expect(screen.getByTestId("remove-tag-Active")).toBeInTheDocument();
        expect(screen.getByTestId("remove-tag-Inactive")).toBeInTheDocument();
    });

    it("handles null canActivePeriods filter", () => {
        const filters = {
            ...defaultFilters,
            canActivePeriods: null
        };

        expect(() => {
            render(
                <BLIFilterTags
                    filters={filters}
                    setFilters={mockSetFilters}
                />
            );
        }).not.toThrow();
    });

    it("handles removing canActivePeriods tag with null prevState", async () => {
        const filters = {
            ...defaultFilters,
            canActivePeriods: [{ id: 1, title: "Active" }]
        };

        render(
            <BLIFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeButton = screen.getByTestId("remove-tag-Active");
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockSetFilters).toHaveBeenCalled();
        });

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({
            canActivePeriods: null
        });

        expect(result.canActivePeriods).toEqual([]);
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
