import { describe, it, expect } from "vitest";
import { RELEASE_NOTES_TYPES } from "./constants";
import { summarizeRelease } from "./releaseNotes.helpers";

const release = {
    version: "1.130.0",
    releaseDate: "2025-06-24",
    changes: [
        { id: "a", subject: "One", type: RELEASE_NOTES_TYPES.NEW_FEATURE, description: "..." },
        { id: "b", subject: "Two", type: RELEASE_NOTES_TYPES.NEW_FEATURE, description: "..." },
        { id: "c", subject: "Three", type: RELEASE_NOTES_TYPES.FIXES, description: "..." }
    ]
};

describe("summarizeRelease", () => {
    it("returns null when no release is given", () => {
        expect(summarizeRelease(undefined)).toBeNull();
    });

    it("returns the version and formatted release date", () => {
        const summary = summarizeRelease(release);

        expect(summary?.version).toBe("1.130.0");
        expect(summary?.releaseDate).toBe("June 24, 2025");
    });

    it("counts the total number of changes", () => {
        expect(summarizeRelease(release)?.totalChanges).toBe(3);
    });

    it("pluralizes the per-type labels", () => {
        const summary = summarizeRelease(release);

        expect(summary?.changeCounts).toEqual([
            { type: RELEASE_NOTES_TYPES.NEW_FEATURE, count: 2, label: "2 New Features" },
            { type: RELEASE_NOTES_TYPES.FIXES, count: 1, label: "1 Fix" }
        ]);
    });

    it("excludes types with no changes", () => {
        const summary = summarizeRelease(release);

        expect(summary?.changeCounts.map(({ type }) => type)).not.toContain(RELEASE_NOTES_TYPES.IMPROVEMENTS);
    });

    it("handles a release with no changes", () => {
        const summary = summarizeRelease({ version: "1.0.0", releaseDate: "2025-01-01", changes: [] });

        expect(summary?.totalChanges).toBe(0);
        expect(summary?.changeCounts).toEqual([]);
    });
});
