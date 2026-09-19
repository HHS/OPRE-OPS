import { describe, it, expect } from "vitest";
import {
    isAllSentinel,
    normalizeFYTag,
    deriveDropdownValue,
    resolveForAPI,
    deriveFYTags,
    handleFYTagRemoval
} from "./fiscalYearFilter.helpers";

// ---------------------------------------------------------------------------
// isAllSentinel
// ---------------------------------------------------------------------------
describe("isAllSentinel", () => {
    it("returns false for an empty array", () => {
        expect(isAllSentinel([])).toBe(false);
    });

    it("returns false for real year entries", () => {
        expect(isAllSentinel([{ id: 2024, title: 2024 }])).toBe(false);
    });

    it("returns true for lowercase 'all' sentinel (FiscalYearComboBox output)", () => {
        expect(isAllSentinel([{ id: "all", title: "All FYs" }])).toBe(true);
    });

    it("returns true for uppercase 'ALL' sentinel (FiscalYearComboBox internal check)", () => {
        expect(isAllSentinel([{ id: "ALL", title: "All FYs" }])).toBe(true);
    });

    it("returns true when sentinel is mixed with real years", () => {
        expect(
            isAllSentinel([
                { id: 2024, title: 2024 },
                { id: "all", title: "All FYs" }
            ])
        ).toBe(true);
    });

    it("returns false for null/non-array input", () => {
        expect(isAllSentinel(null)).toBe(false);
        expect(isAllSentinel(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// normalizeFYTag
// ---------------------------------------------------------------------------
describe("normalizeFYTag", () => {
    it("prefixes a bare year number", () => {
        expect(normalizeFYTag(2024)).toBe("FY 2024");
    });

    it("prefixes a bare year string", () => {
        expect(normalizeFYTag("2024")).toBe("FY 2024");
    });

    it("is idempotent — does not double-prefix an already-prefixed title", () => {
        expect(normalizeFYTag("FY 2024")).toBe("FY 2024");
    });

    it("prefixes 'All FYs' as 'FY All FYs' — normalizeFYTag does not special-case the sentinel", () => {
        // normalizeFYTag is only called for real year titles; deriveFYTags intercepts the sentinel
        // via isAllSentinel before calling normalizeFYTag, so this case never reaches production.
        expect(normalizeFYTag("All FYs")).toBe("FY All FYs");
        // (deriveFYTags routes sentinel through isAllSentinel before calling normalizeFYTag)
    });
});

// ---------------------------------------------------------------------------
// deriveDropdownValue
// ---------------------------------------------------------------------------
describe("deriveDropdownValue", () => {
    it("returns selectedFiscalYear when compareFYs is empty", () => {
        expect(deriveDropdownValue("All", [])).toBe("All");
        expect(deriveDropdownValue("2024", [])).toBe("2024");
    });

    it("returns selectedFiscalYear when compareFYs is null/undefined", () => {
        expect(deriveDropdownValue("All", null)).toBe("All");
        expect(deriveDropdownValue("2025", undefined)).toBe("2025");
    });

    it("returns 'Multi' when 2 or more real years are selected", () => {
        expect(
            deriveDropdownValue("All", [
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ])
        ).toBe("Multi");
    });

    it("returns 'Multi' for 3 or more years", () => {
        expect(
            deriveDropdownValue("2024", [
                { id: 2023, title: 2023 },
                { id: 2024, title: 2024 },
                { id: 2025, title: 2025 }
            ])
        ).toBe("Multi");
    });

    it("returns 'All' when the single entry is the all-sentinel", () => {
        expect(deriveDropdownValue("2024", [{ id: "all", title: "All FYs" }])).toBe("All");
    });

    it("returns the year as a string when a single real year is selected", () => {
        expect(deriveDropdownValue("All", [{ id: 2024, title: 2024 }])).toBe("2024");
    });

    it("returns 'All' for uppercase ALL sentinel", () => {
        expect(deriveDropdownValue("2024", [{ id: "ALL", title: "All FYs" }])).toBe("All");
    });

    it("returns 'All' when sentinel is mixed with real years — sentinel dominates over length check", () => {
        expect(
            deriveDropdownValue("2024", [
                { id: "all", title: "All FYs" },
                { id: 2024, title: 2024 }
            ])
        ).toBe("All");
    });
});

// ---------------------------------------------------------------------------
// resolveForAPI
// ---------------------------------------------------------------------------
describe("resolveForAPI", () => {
    it("returns [] when selectedFiscalYear is 'All' and compareFYs is empty", () => {
        expect(resolveForAPI("All", [])).toEqual([]);
    });

    it("returns the single dropdown year when compareFYs is empty and a year is selected", () => {
        expect(resolveForAPI("2024", [])).toEqual([{ id: 2024, title: 2024 }]);
    });

    it("returns [] when compareFYs contains the all-sentinel", () => {
        expect(resolveForAPI("2024", [{ id: "all", title: "All FYs" }])).toEqual([]);
    });

    it("returns [] for uppercase ALL sentinel", () => {
        expect(resolveForAPI("2024", [{ id: "ALL", title: "All FYs" }])).toEqual([]);
    });

    it("returns the compareFYs array when real years are selected in the modal", () => {
        const compareFYs = [
            { id: 2024, title: 2024 },
            { id: 2025, title: 2025 }
        ];
        expect(resolveForAPI("All", compareFYs)).toEqual(compareFYs);
    });

    it("uses compareFYs even when a dropdown year is also set (modal wins)", () => {
        const compareFYs = [{ id: 2025, title: 2025 }];
        expect(resolveForAPI("2024", compareFYs)).toEqual(compareFYs);
    });

    it("returns [] when compareFYs is null (treated as empty)", () => {
        expect(resolveForAPI("All", null)).toEqual([]);
        expect(resolveForAPI("2024", null)).toEqual([{ id: 2024, title: 2024 }]);
    });

    it("returns [] when sentinel is mixed with real years — sentinel dominates", () => {
        // isAllSentinel checks the whole array, so even one sentinel entry suppresses the FY filter
        expect(
            resolveForAPI("All", [
                { id: "all", title: "All FYs" },
                { id: 2024, title: 2024 }
            ])
        ).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// deriveFYTags
// ---------------------------------------------------------------------------
describe("deriveFYTags", () => {
    it("returns [] for an empty array", () => {
        expect(deriveFYTags([])).toEqual([]);
    });

    it("returns [] for null/undefined", () => {
        expect(deriveFYTags(null)).toEqual([]);
        expect(deriveFYTags(undefined)).toEqual([]);
    });

    it("returns a single 'All FYs' tag for the all-sentinel", () => {
        expect(deriveFYTags([{ id: "all", title: "All FYs" }])).toEqual([{ tagText: "All FYs", filter: "fiscalYear" }]);
    });

    it("returns a single 'All FYs' tag for the uppercase ALL sentinel", () => {
        expect(deriveFYTags([{ id: "ALL", title: "All FYs" }])).toEqual([{ tagText: "All FYs", filter: "fiscalYear" }]);
    });

    it("returns correctly prefixed tags for real years (bare numbers)", () => {
        expect(deriveFYTags([{ id: 2024, title: 2024 }])).toEqual([{ tagText: "FY 2024", filter: "fiscalYear" }]);
    });

    it("does NOT double-prefix titles already starting with 'FY '", () => {
        // FiscalYearComboBox stores titles as "FY 2024"
        expect(deriveFYTags([{ id: 2024, title: "FY 2024" }])).toEqual([{ tagText: "FY 2024", filter: "fiscalYear" }]);
    });

    it("returns multiple tags for multiple years", () => {
        const result = deriveFYTags([
            { id: 2024, title: 2024 },
            { id: 2025, title: 2025 }
        ]);
        expect(result).toEqual([
            { tagText: "FY 2024", filter: "fiscalYear" },
            { tagText: "FY 2025", filter: "fiscalYear" }
        ]);
    });

    it("deduplicates entries with the same tagText", () => {
        const result = deriveFYTags([
            { id: 2024, title: 2024 },
            { id: 2024, title: 2024 }
        ]);
        expect(result).toHaveLength(1);
        expect(result[0].tagText).toBe("FY 2024");
    });

    it("deduplicates when one entry has a bare number title and another has 'FY XXXX'", () => {
        const result = deriveFYTags([
            { id: 2024, title: 2024 },
            { id: 2024, title: "FY 2024" }
        ]);
        expect(result).toHaveLength(1);
    });

    it("uses the default filterKey 'fiscalYear' when no override is provided", () => {
        const result = deriveFYTags([{ id: 2024, title: 2024 }]);
        expect(result[0].filter).toBe("fiscalYear");
    });

    it("uses the provided filterKey override — required for BLI which uses 'fiscalYears'", () => {
        const result = deriveFYTags([{ id: 2024, title: 2024 }], "fiscalYears");
        expect(result[0].filter).toBe("fiscalYears");
    });

    it("applies filterKey override to the All FYs sentinel tag", () => {
        const result = deriveFYTags([{ id: "all", title: "All FYs" }], "fiscalYears");
        expect(result[0].filter).toBe("fiscalYears");
    });
});

// ---------------------------------------------------------------------------
// handleFYTagRemoval
// ---------------------------------------------------------------------------
describe("handleFYTagRemoval", () => {
    it("removes the entry matching the tagText", () => {
        const compareFYs = [
            { id: 2024, title: 2024 },
            { id: 2025, title: 2025 }
        ];
        expect(handleFYTagRemoval(compareFYs, "FY 2024")).toEqual([{ id: 2025, title: 2025 }]);
    });

    it("removes the last remaining entry, returning []", () => {
        expect(handleFYTagRemoval([{ id: 2024, title: 2024 }], "FY 2024")).toEqual([]);
    });

    it("removes the all-sentinel when tagText is 'All FYs'", () => {
        expect(handleFYTagRemoval([{ id: "all", title: "All FYs" }], "All FYs")).toEqual([]);
    });

    it("removes the uppercase ALL sentinel when tagText is 'All FYs'", () => {
        expect(handleFYTagRemoval([{ id: "ALL", title: "All FYs" }], "All FYs")).toEqual([]);
    });

    it("works when the title is already prefixed 'FY XXXX'", () => {
        const compareFYs = [{ id: 2024, title: "FY 2024" }];
        expect(handleFYTagRemoval(compareFYs, "FY 2024")).toEqual([]);
    });

    it("returns [] for null/non-array input", () => {
        expect(handleFYTagRemoval(null, "FY 2024")).toEqual([]);
        expect(handleFYTagRemoval(undefined, "FY 2024")).toEqual([]);
    });

    it("returns the original array unchanged when tagText does not match", () => {
        const compareFYs = [{ id: 2024, title: 2024 }];
        expect(handleFYTagRemoval(compareFYs, "FY 2025")).toEqual(compareFYs);
    });
});
