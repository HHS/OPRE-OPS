import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTagsList, removeFilter } from "./ProjectFilterTags.hooks";

const emptyFilters = {
    fiscalYear: [],
    portfolio: [],
    projectSearch: [],
    agreementSearch: [],
    projectType: []
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

    it("removes a projectSearch tag by title", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "projectSearch", tagText: "Project Alpha" }, setFilters);
        const result = setFilters.mock.calls[0][0]({
            ...emptyFilters,
            projectSearch: [{ id: 1, title: "Project Alpha" }]
        });
        expect(result.projectSearch).toEqual([]);
    });

    it("removes an agreementSearch tag by title", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "agreementSearch", tagText: "Agreement 1" }, setFilters);
        const result = setFilters.mock.calls[0][0]({
            ...emptyFilters,
            agreementSearch: [{ id: 1, title: "Agreement 1" }]
        });
        expect(result.agreementSearch).toEqual([]);
    });

    it("removes a projectType tag by title", () => {
        const setFilters = vi.fn();
        removeFilter({ filter: "projectType", tagText: "RESEARCH" }, setFilters);
        const result = setFilters.mock.calls[0][0]({
            ...emptyFilters,
            projectType: [{ id: 1, title: "RESEARCH" }]
        });
        expect(result.projectType).toEqual([]);
    });
});
