import { describe, it, expect } from "vitest";
import { buildAnchorIds, toAnchorSlug } from "./helpCenterAnchors";

describe("helpCenterAnchors", () => {
    describe("toAnchorSlug", () => {
        it("converts heading to URL-friendly slug", () => {
            expect(toAnchorSlug("How to find your user role")).toBe("how-to-find-your-user-role");
            expect(toAnchorSlug("What's the process?")).toBe("whats-the-process");
            expect(toAnchorSlug("A  B   C")).toBe("a-b-c");
            expect(toAnchorSlug("A&B")).toBe("a-and-b");
        });

        it("returns empty string for invalid values", () => {
            expect(toAnchorSlug("")).toBe("");
            expect(toAnchorSlug(null)).toBe("");
            expect(toAnchorSlug(undefined)).toBe("");
            expect(toAnchorSlug(true)).toBe("");
        });
    });

    describe("buildAnchorIds", () => {
        it("builds unique IDs with duplicate suffixes", () => {
            const ids = buildAnchorIds([
                { heading: "What's the format of the file name for exports?" },
                { heading: "What's the format of the file name for exports?" },
                { heading: "How to export data from OPS" }
            ]);

            expect(ids).toEqual([
                "whats-the-format-of-the-file-name-for-exports",
                "whats-the-format-of-the-file-name-for-exports-2",
                "how-to-export-data-from-ops"
            ]);
        });

        it("handles invalid input", () => {
            expect(buildAnchorIds(null)).toEqual([]);
            expect(buildAnchorIds(undefined)).toEqual([]);
            expect(buildAnchorIds({})).toEqual([]);
        });
    });
});
