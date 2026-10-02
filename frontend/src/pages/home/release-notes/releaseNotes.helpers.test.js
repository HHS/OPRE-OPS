import { describe, expect, it } from "vitest";
import { getReleaseTotals } from "./releaseNotes.helpers";

describe("getReleaseTotals", () => {
    it("counts each change category and the overall total", () => {
        const release = {
            changes: [{ type: "New Feature" }, { type: "New Feature" }, { type: "Fixes" }, { type: "Improvements" }]
        };
        expect(getReleaseTotals(release)).toEqual({
            totalReleaseChanges: 4,
            totalNewFeatures: 2,
            totalFixes: 1,
            totalImprovements: 1
        });
    });

    it("ignores change types outside the known categories (counted only in the total)", () => {
        const release = {
            changes: [{ type: "New Feature" }, { type: "Security" }, { type: "Fix" }]
        };
        const totals = getReleaseTotals(release);
        expect(totals.totalReleaseChanges).toBe(3);
        expect(totals.totalNewFeatures).toBe(1);
        expect(totals.totalFixes).toBe(0);
        expect(totals.totalImprovements).toBe(0);
    });

    it("returns all zeros for a release missing its changes array", () => {
        expect(getReleaseTotals({ version: "1.0.0" })).toEqual({
            totalReleaseChanges: 0,
            totalNewFeatures: 0,
            totalFixes: 0,
            totalImprovements: 0
        });
    });

    it("returns all zeros for an undefined release", () => {
        expect(getReleaseTotals(undefined)).toEqual({
            totalReleaseChanges: 0,
            totalNewFeatures: 0,
            totalFixes: 0,
            totalImprovements: 0
        });
    });
});
