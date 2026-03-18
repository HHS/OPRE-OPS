import { describe, it, expect } from "vitest";
import { formatUserName, getUserDisplayName } from "./users.helpers";

describe("formatUserName", () => {
    // Already mixed-case — leave untouched
    it("leaves mixed-case names unchanged", () => {
        expect(formatUserName("DeAngelis")).toBe("DeAngelis");
        expect(formatUserName("McCall")).toBe("McCall");
        expect(formatUserName("John Smith")).toBe("John Smith");
        expect(formatUserName("O'Neil")).toBe("O'Neil");
    });

    // All-caps straight names
    it("title-cases all-caps names", () => {
        expect(formatUserName("JOHN SMITH")).toBe("John Smith");
        expect(formatUserName("EMILY BALL")).toBe("Emily Ball");
        expect(formatUserName("CHRIS FORTUNATO")).toBe("Chris Fortunato");
    });

    // All-caps single word
    it("title-cases a single all-caps word", () => {
        expect(formatUserName("SMITH")).toBe("Smith");
    });

    // Apostrophes
    it("handles apostrophes in all-caps names", () => {
        expect(formatUserName("O'NEIL")).toBe("O'Neil");
        expect(formatUserName("D'ANGELO")).toBe("D'Angelo");
    });

    // Hyphens
    it("handles hyphens in all-caps names", () => {
        expect(formatUserName("ANNE-MARIE")).toBe("Anne-Marie");
        expect(formatUserName("SMITH-JONES")).toBe("Smith-Jones");
    });

    // Suffixes kept uppercase
    it("keeps common suffixes uppercase", () => {
        expect(formatUserName("JOHN SMITH JR")).toBe("John Smith JR");
        expect(formatUserName("JOHN SMITH SR")).toBe("John Smith SR");
        expect(formatUserName("JOHN SMITH II")).toBe("John Smith II");
        expect(formatUserName("JOHN SMITH III")).toBe("John Smith III");
        expect(formatUserName("JOHN SMITH IV")).toBe("John Smith IV");
    });

    // Combined punctuation
    it("handles combined apostrophe + hyphen in all-caps names", () => {
        expect(formatUserName("O'NEIL-SMITH")).toBe("O'Neil-Smith");
    });

    // Null / undefined / empty — return as-is
    it("returns null for null", () => {
        expect(formatUserName(null)).toBeNull();
    });

    it("returns undefined for undefined", () => {
        expect(formatUserName(undefined)).toBeUndefined();
    });

    it("returns empty string for empty string", () => {
        expect(formatUserName("")).toBe("");
    });

    it("handles extra internal whitespace gracefully", () => {
        expect(formatUserName("JOHN  SMITH")).toBe("John Smith");
    });

    // Known limitation: all-caps names that look like compounds (DeAngelis, McCall)
    // will be naively title-cased since the original all-caps form gives no hint
    it("title-cases all-caps version of compound names (known limitation)", () => {
        expect(formatUserName("DEANGELIS")).toBe("Deangelis");
        expect(formatUserName("MCCALL")).toBe("Mccall");
    });
});

describe("getUserDisplayName", () => {
    it("formats full_name when all caps", () => {
        expect(getUserDisplayName({ full_name: "JOHN SMITH", email: "j@example.com" })).toBe("John Smith");
    });

    it("leaves full_name unchanged when mixed case", () => {
        expect(getUserDisplayName({ full_name: "DeAngelis", email: "d@example.com" })).toBe("DeAngelis");
    });

    it("falls back to first_name when full_name is absent", () => {
        expect(getUserDisplayName({ first_name: "EMILY", email: "e@example.com" })).toBe("Emily");
    });

    it("falls back to email when both names are absent", () => {
        expect(getUserDisplayName({ email: "j@example.com" })).toBe("j@example.com");
    });

    it("returns null for null user", () => {
        expect(getUserDisplayName(null)).toBeNull();
    });
});
