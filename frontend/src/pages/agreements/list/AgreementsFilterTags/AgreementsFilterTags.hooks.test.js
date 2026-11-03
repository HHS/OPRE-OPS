import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTagsList, removeFilter } from "./AgreementsFilterTags.hooks";

const emptyFilters = {
    fiscalYear: [],
    portfolio: [],
    projectTitle: [],
    agreementType: [],
    agreementName: [],
    contractNumber: [],
    awardType: [],
    division: [],
    cor: []
};

// ---------------------------------------------------------------------------
// useTagsList — FY tag generation
// ---------------------------------------------------------------------------
describe("useTagsList - fiscal year tags", () => {
    it("produces no FY tags when fiscalYear is empty", () => {
        const { result } = renderHook(() => useTagsList(emptyFilters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags).toHaveLength(0);
    });

    it("produces a correctly prefixed FY tag for a single year", () => {
        const filters = { ...emptyFilters, fiscalYear: [{ id: 2024, title: 2024 }] };
        const { result } = renderHook(() => useTagsList(filters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags).toHaveLength(1);
        expect(fyTags[0].tagText).toBe("FY 2024");
    });

    it("does NOT double-prefix titles already starting with 'FY '", () => {
        // FiscalYearComboBox stores titles as "FY 2024" — guard the double-prefix bug
        const filters = { ...emptyFilters, fiscalYear: [{ id: 2024, title: "FY 2024" }] };
        const { result } = renderHook(() => useTagsList(filters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags[0].tagText).toBe("FY 2024");
    });

    it("produces an 'All FYs' tag for the all-sentinel", () => {
        const filters = { ...emptyFilters, fiscalYear: [{ id: "all", title: "All FYs" }] };
        const { result } = renderHook(() => useTagsList(filters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags).toHaveLength(1);
        expect(fyTags[0].tagText).toBe("All FYs");
    });

    it("deduplicates FY tags with the same display text", () => {
        const filters = {
            ...emptyFilters,
            fiscalYear: [
                { id: 2024, title: 2024 },
                { id: 2024, title: 2024 }
            ]
        };
        const { result } = renderHook(() => useTagsList(filters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags).toHaveLength(1);
    });

    it("produces tags for multiple years", () => {
        const filters = {
            ...emptyFilters,
            fiscalYear: [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ]
        };
        const { result } = renderHook(() => useTagsList(filters));
        const fyTags = result.current.filter((t) => t.filter === "fiscalYear");
        expect(fyTags).toHaveLength(2);
        expect(fyTags.map((t) => t.tagText)).toEqual(["FY 2024", "FY 2025"]);
    });

    it("non-FY filters still produce their own tags", () => {
        const filters = { ...emptyFilters, portfolio: [{ id: 1, name: "OPRE" }] };
        const { result } = renderHook(() => useTagsList(filters));
        const portfolioTags = result.current.filter((t) => t.filter === "portfolio");
        expect(portfolioTags).toHaveLength(1);
        expect(portfolioTags[0].tagText).toBe("OPRE");
    });
});

// ---------------------------------------------------------------------------
// removeFilter — FY tag removal
// ---------------------------------------------------------------------------
describe("removeFilter - fiscal year", () => {
    it("removes a single FY tag by tagText", () => {
        const setFilters = vi.fn();
        const tag = { filter: "fiscalYear", tagText: "FY 2024" };
        const currentFilters = { ...emptyFilters, fiscalYear: [{ id: 2024, title: 2024 }] };

        removeFilter(tag, setFilters);

        const updater = setFilters.mock.calls[0][0];
        const result = updater(currentFilters);
        expect(result.fiscalYear).toEqual([]);
    });

    it("removes one year from a multi-year array, leaving the other", () => {
        const setFilters = vi.fn();
        const tag = { filter: "fiscalYear", tagText: "FY 2024" };
        const currentFilters = {
            ...emptyFilters,
            fiscalYear: [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ]
        };

        removeFilter(tag, setFilters);

        const updater = setFilters.mock.calls[0][0];
        const result = updater(currentFilters);
        expect(result.fiscalYear).toEqual([{ id: 2025, title: 2025 }]);
    });

    it("removes the all-sentinel when tagText is 'All FYs'", () => {
        const setFilters = vi.fn();
        const tag = { filter: "fiscalYear", tagText: "All FYs" };
        const currentFilters = { ...emptyFilters, fiscalYear: [{ id: "all", title: "All FYs" }] };

        removeFilter(tag, setFilters);

        const updater = setFilters.mock.calls[0][0];
        const result = updater(currentFilters);
        expect(result.fiscalYear).toEqual([]);
    });

    it("works when FiscalYearComboBox stores the title as 'FY XXXX'", () => {
        const setFilters = vi.fn();
        const tag = { filter: "fiscalYear", tagText: "FY 2024" };
        const currentFilters = { ...emptyFilters, fiscalYear: [{ id: 2024, title: "FY 2024" }] };

        removeFilter(tag, setFilters);

        const updater = setFilters.mock.calls[0][0];
        const result = updater(currentFilters);
        expect(result.fiscalYear).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// removeFilter — non-FY filters (regression guard)
// ---------------------------------------------------------------------------
describe("removeFilter - non-FY filters", () => {
    it("removes a portfolio tag by name", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "portfolio", tagText: "OPRE" }, setFilters);
        const result = setFilters.mock.calls[0][0]({
            ...emptyFilters,
            portfolio: [{ id: 1, name: "OPRE" }]
        });
        expect(result.portfolio).toEqual([]);
    });

    it("removes a projectTitle tag by title", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "projectTitle", tagText: "Project Alpha" }, setFilters);
        const result = setFilters.mock.calls[0][0]({
            ...emptyFilters,
            projectTitle: [{ id: 1, title: "Project Alpha" }]
        });
        expect(result.projectTitle).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Division & Staffing (#6457)
// ---------------------------------------------------------------------------
describe("Division & Staffing tags", () => {
    const divisions = [
        { id: 1, name: "Division A", abbreviation: "DA" },
        { id: 2, name: "Division B", abbreviation: "DB" }
    ];
    const cors = [
        { id: 1, name: "Hank Smith", division_id: 2, division_abbreviation: "DB" },
        { id: 22, name: "Ann Nodivision", division_id: null, division_abbreviation: null }
    ];

    it("labels division and COR tags like the options", () => {
        // Stable reference: a new object per render would re-trigger the hook's effects forever.
        const filters = { ...emptyFilters, division: divisions, cor: cors };
        const { result } = renderHook(() => useTagsList(filters));

        expect(result.current.filter((tag) => tag.filter === "division")).toEqual([
            { tagText: "DA - Division A", filter: "division", id: 1 },
            { tagText: "DB - Division B", filter: "division", id: 2 }
        ]);
        expect(result.current.filter((tag) => tag.filter === "cor")).toEqual([
            { tagText: "DB - Hank Smith", filter: "cor", id: 1 },
            { tagText: "Ann Nodivision", filter: "cor", id: 22 }
        ]);
    });

    it("removes only the clicked division, keyed by id", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "division", tagText: "DA - Division A", id: 1 }, setFilters);
        const result = setFilters.mock.calls[0][0]({ ...emptyFilters, division: divisions, cor: cors });

        expect(result.division).toEqual([divisions[1]]);
        expect(result.cor).toEqual(cors);
    });

    it("removes only the clicked COR, even when a division shares its id", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "cor", tagText: "DB - Hank Smith", id: 1 }, setFilters);
        const result = setFilters.mock.calls[0][0]({ ...emptyFilters, division: divisions, cor: cors });

        expect(result.cor).toEqual([cors[1]]);
        expect(result.division).toEqual(divisions);
    });
});
