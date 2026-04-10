import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    deriveDropdownValueApproachA,
    resolveForAPIApproachA,
    deriveTagsApproachA,
    getInitialStateApproachA,
    handleTagRemovalApproachA,
    deriveDropdownValueApproachB,
    resolveForAPIApproachB,
    deriveTagsApproachB,
    getInitialStateApproachB,
    handleTagRemovalApproachB,
    getFiscalYearHelpers
} from "./fiscalYearFilterHelpers";

// Mock getCurrentFiscalYear
vi.mock("../../../helpers/utils", () => ({
    getCurrentFiscalYear: vi.fn(() => "2026")
}));

describe("Fiscal Year Filter Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Approach A: 'All' as Default", () => {
        describe("deriveDropdownValueApproachA", () => {
            it("returns 'All' for null fiscalYears", () => {
                expect(deriveDropdownValueApproachA(null)).toBe("All");
            });

            it("returns current FY for empty array", () => {
                expect(deriveDropdownValueApproachA([])).toBe("2026");
            });

            it("returns current FY for undefined", () => {
                expect(deriveDropdownValueApproachA(undefined)).toBe("2026");
            });

            it("returns year ID for single year", () => {
                expect(deriveDropdownValueApproachA([{ id: 2024, title: 2024 }])).toBe(2024);
            });

            it("returns 'Multi' for multiple years", () => {
                expect(
                    deriveDropdownValueApproachA([
                        { id: 2024, title: 2024 },
                        { id: 2025, title: 2025 }
                    ])
                ).toBe("Multi");
            });
        });

        describe("resolveForAPIApproachA", () => {
            it("returns null for null fiscalYears", () => {
                expect(resolveForAPIApproachA(null)).toBeNull();
            });

            it("returns current FY array for empty array", () => {
                const result = resolveForAPIApproachA([]);
                expect(result).toEqual([{ id: "2026", title: "2026" }]);
            });

            it("returns fiscalYears as-is for non-empty array", () => {
                const fiscalYears = [{ id: 2024, title: 2024 }];
                expect(resolveForAPIApproachA(fiscalYears)).toEqual(fiscalYears);
            });
        });

        describe("deriveTagsApproachA", () => {
            it("returns empty array for null fiscalYears", () => {
                expect(deriveTagsApproachA(null)).toEqual([]);
            });

            it("returns empty array for non-array", () => {
                expect(deriveTagsApproachA("not an array")).toEqual([]);
            });

            it("returns tags for fiscal years", () => {
                const result = deriveTagsApproachA([
                    { id: 2024, title: 2024 },
                    { id: 2025, title: 2025 }
                ]);
                expect(result).toEqual([
                    { tagText: "FY 2024", filter: "fiscalYears" },
                    { tagText: "FY 2025", filter: "fiscalYears" }
                ]);
            });

            it("does not double-prefix when title already has 'FY '", () => {
                const result = deriveTagsApproachA([
                    { id: 2024, title: "FY 2024" },
                    { id: 2025, title: "FY 2025" }
                ]);
                expect(result).toEqual([
                    { tagText: "FY 2024", filter: "fiscalYears" },
                    { tagText: "FY 2025", filter: "fiscalYears" }
                ]);
            });
        });

        describe("getInitialStateApproachA", () => {
            it("returns current FY as initial state", () => {
                const result = getInitialStateApproachA();
                expect(result).toEqual([{ id: "2026", title: "2026" }]);
            });
        });

        describe("handleTagRemovalApproachA", () => {
            it("removes specified year", () => {
                const result = handleTagRemovalApproachA(
                    [
                        { id: 2024, title: 2024 },
                        { id: 2025, title: 2025 }
                    ],
                    "FY 2024"
                );
                expect(result).toEqual([{ id: 2025, title: 2025 }]);
            });

            it("returns null when removing last year", () => {
                const result = handleTagRemovalApproachA([{ id: 2024, title: 2024 }], "FY 2024");
                expect(result).toBeNull();
            });

            it("returns null for non-array input", () => {
                const result = handleTagRemovalApproachA(null, "FY 2024");
                expect(result).toBeNull();
            });
        });
    });

    describe("Approach B: Current FY as Default", () => {
        describe("deriveDropdownValueApproachB", () => {
            it("returns current FY for null fiscalYears", () => {
                expect(deriveDropdownValueApproachB(null)).toBe("2026");
            });

            it("returns current FY for empty array", () => {
                expect(deriveDropdownValueApproachB([])).toBe("2026");
            });

            it("returns 'All' for explicit 'all' selection", () => {
                expect(deriveDropdownValueApproachB([{ id: "all", title: "All FYs" }])).toBe("All");
            });

            it("returns year ID for single year", () => {
                expect(deriveDropdownValueApproachB([{ id: 2024, title: 2024 }])).toBe(2024);
            });

            it("returns 'Multi' for multiple years", () => {
                expect(
                    deriveDropdownValueApproachB([
                        { id: 2024, title: 2024 },
                        { id: 2025, title: 2025 }
                    ])
                ).toBe("Multi");
            });
        });

        describe("resolveForAPIApproachB", () => {
            it("returns current FY array for null fiscalYears", () => {
                const result = resolveForAPIApproachB(null);
                expect(result).toEqual([{ id: "2026", title: "2026" }]);
            });

            it("returns null for explicit 'all' selection", () => {
                expect(resolveForAPIApproachB([{ id: "all", title: "All FYs" }])).toBeNull();
            });

            it("returns fiscalYears as-is for specific years", () => {
                const fiscalYears = [{ id: 2024, title: 2024 }];
                expect(resolveForAPIApproachB(fiscalYears)).toEqual(fiscalYears);
            });
        });

        describe("deriveTagsApproachB", () => {
            it("returns empty array for null fiscalYears", () => {
                expect(deriveTagsApproachB(null)).toEqual([]);
            });

            it("returns 'All FYs' tag for explicit 'all' selection", () => {
                const result = deriveTagsApproachB([{ id: "all", title: "All FYs" }]);
                expect(result).toEqual([{ tagText: "All FYs", filter: "fiscalYears" }]);
            });

            it("returns tags for specific fiscal years", () => {
                const result = deriveTagsApproachB([
                    { id: 2024, title: 2024 },
                    { id: 2025, title: 2025 }
                ]);
                expect(result).toEqual([
                    { tagText: "FY 2024", filter: "fiscalYears" },
                    { tagText: "FY 2025", filter: "fiscalYears" }
                ]);
            });

            it("does not double-prefix when title already has 'FY '", () => {
                const result = deriveTagsApproachB([
                    { id: 2024, title: "FY 2024" },
                    { id: 2025, title: "FY 2025" }
                ]);
                expect(result).toEqual([
                    { tagText: "FY 2024", filter: "fiscalYears" },
                    { tagText: "FY 2025", filter: "fiscalYears" }
                ]);
            });
        });

        describe("getInitialStateApproachB", () => {
            it("returns null as initial state", () => {
                expect(getInitialStateApproachB()).toBeNull();
            });
        });

        describe("handleTagRemovalApproachB", () => {
            it("returns null when removing 'All FYs' tag", () => {
                const result = handleTagRemovalApproachB([{ id: "all", title: "All FYs" }], "All FYs");
                expect(result).toBeNull();
            });

            it("removes specified year", () => {
                const result = handleTagRemovalApproachB(
                    [
                        { id: 2024, title: 2024 },
                        { id: 2025, title: 2025 }
                    ],
                    "FY 2024"
                );
                expect(result).toEqual([{ id: 2025, title: 2025 }]);
            });

            it("returns null when removing last year", () => {
                const result = handleTagRemovalApproachB([{ id: 2024, title: 2024 }], "FY 2024");
                expect(result).toBeNull();
            });
        });
    });

    describe("getFiscalYearHelpers", () => {
        it("returns Approach A helpers when useApproachB is false", () => {
            const helpers = getFiscalYearHelpers(false);
            expect(helpers.deriveDropdownValue).toBe(deriveDropdownValueApproachA);
            expect(helpers.resolveForAPI).toBe(resolveForAPIApproachA);
            expect(helpers.deriveTags).toBe(deriveTagsApproachA);
            expect(helpers.getInitialState).toBe(getInitialStateApproachA);
            expect(helpers.handleTagRemoval).toBe(handleTagRemovalApproachA);
        });

        it("returns Approach B helpers when useApproachB is true", () => {
            const helpers = getFiscalYearHelpers(true);
            expect(helpers.deriveDropdownValue).toBe(deriveDropdownValueApproachB);
            expect(helpers.resolveForAPI).toBe(resolveForAPIApproachB);
            expect(helpers.deriveTags).toBe(deriveTagsApproachB);
            expect(helpers.getInitialState).toBe(getInitialStateApproachB);
            expect(helpers.handleTagRemoval).toBe(handleTagRemovalApproachB);
        });
    });
});
