import { describe, expect, it } from "vitest";
import { safeRedirectPath, safeRedirectSearch } from "./safeRedirect.helpers";

describe("safeRedirectPath", () => {
    it("falls back to '/' for non-string or empty input", () => {
        expect(safeRedirectPath(undefined)).toBe("/");
        expect(safeRedirectPath(null)).toBe("/");
        expect(safeRedirectPath("")).toBe("/");
        expect(safeRedirectPath(42)).toBe("/");
        expect(safeRedirectPath({})).toBe("/");
    });

    it("allows root and normal in-app paths", () => {
        expect(safeRedirectPath("/")).toBe("/");
        expect(safeRedirectPath("/agreements")).toBe("/agreements");
        expect(safeRedirectPath("/agreements/42/review")).toBe("/agreements/42/review");
        expect(safeRedirectPath("/search?q=1&tag=foo")).toBe("/search?q=1&tag=foo");
        expect(safeRedirectPath("/path#fragment")).toBe("/path#fragment");
    });

    it("rejects protocol-relative URLs", () => {
        expect(safeRedirectPath("//evil.com")).toBe("/");
        expect(safeRedirectPath("//evil.com/phish")).toBe("/");
    });

    it("rejects backslash-smuggled paths", () => {
        // Chrome historically normalizes backslashes to forward slashes, which
        // turns "/\\evil.com" into "//evil.com" — an offsite redirect.
        expect(safeRedirectPath("/\\evil.com")).toBe("/");
        expect(safeRedirectPath("/\\\\evil.com")).toBe("/");
    });

    it("rejects absolute URLs with any scheme", () => {
        expect(safeRedirectPath("http://evil.com/")).toBe("/");
        expect(safeRedirectPath("https://evil.com/")).toBe("/");
        expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
        expect(safeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe("/");
        expect(safeRedirectPath("file:///etc/passwd")).toBe("/");
    });

    it("rejects paths that do not start with '/'", () => {
        expect(safeRedirectPath("agreements/42")).toBe("/");
        expect(safeRedirectPath("  /agreements")).toBe("/");
        expect(safeRedirectPath(".//evil.com")).toBe("/");
    });
});

describe("safeRedirectSearch", () => {
    it("falls back to '' for non-string or empty input", () => {
        expect(safeRedirectSearch(undefined)).toBe("");
        expect(safeRedirectSearch(null)).toBe("");
        expect(safeRedirectSearch("")).toBe("");
        expect(safeRedirectSearch(42)).toBe("");
    });

    it("allows normal query strings", () => {
        expect(safeRedirectSearch("?q=1")).toBe("?q=1");
        expect(safeRedirectSearch("?tag=foo&page=2")).toBe("?tag=foo&page=2");
        expect(safeRedirectSearch("?")).toBe("?");
    });

    it("rejects strings that don't start with '?'", () => {
        expect(safeRedirectSearch("q=1")).toBe("");
        expect(safeRedirectSearch("&tag=foo")).toBe("");
        expect(safeRedirectSearch("//evil.com?q=1")).toBe("");
    });

    it("rejects strings with control characters", () => {
        expect(safeRedirectSearch("?q=\n")).toBe("");
        expect(safeRedirectSearch("?q=\rfoo")).toBe("");
        expect(safeRedirectSearch("?q=\x00")).toBe("");
    });
});
