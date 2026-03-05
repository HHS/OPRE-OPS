import { describe, it, expect } from "vitest";
import { buildAnchorIds, getAnchorIdFromHash, toAnchorSlug } from "./helpCenterAnchors";

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

    describe("getAnchorIdFromHash", () => {
        it("returns empty string for empty hash", () => {
            expect(getAnchorIdFromHash("")).toBe("");
            expect(getAnchorIdFromHash(null)).toBe("");
        });

        it("decodes valid percent-encoding", () => {
            expect(getAnchorIdFromHash("#how-to%20guide")).toBe("how-to guide");
        });

        it("returns raw hash text when decoding fails", () => {
            expect(getAnchorIdFromHash("#%E0%A4")).toBe("%E0%A4");
        });
    });
});
