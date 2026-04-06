import { describe, it, expect } from "vitest";
import {
    formatUserName,
    getUserDisplayName,
    normalizeAgreementUsers,
    normalizeCanUsers,
    normalizePortfolioUsers,
    normalizeProjectUsers,
    normalizeUser
} from "./users.helpers";

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

describe("normalizeUser", () => {
    it("adds display_name derived from all-caps full_name", () => {
        expect(normalizeUser({ id: 1, full_name: "JOHN SMITH", email: "j@example.com" })).toEqual({
            id: 1,
            full_name: "JOHN SMITH",
            email: "j@example.com",
            display_name: "John Smith"
        });
    });

    it("preserves mixed-case full_name and sets display_name to same", () => {
        const user = { id: 2, full_name: "DeAngelis", email: "d@example.com" };
        expect(normalizeUser(user)).toEqual({ ...user, display_name: "DeAngelis" });
    });

    it("does not mutate the original object", () => {
        const user = { id: 3, full_name: "JANE DOE" };
        const result = normalizeUser(user);
        expect(user).not.toHaveProperty("display_name");
        expect(result.display_name).toBe("Jane Doe");
    });

    it("returns non-object inputs unchanged", () => {
        expect(normalizeUser(null)).toBeNull();
        expect(normalizeUser(undefined)).toBeUndefined();
    });

    it("respects a backend-provided display_name when it is already mixed-case", () => {
        // Backend sends a properly cased display_name — frontend should not overwrite it.
        const user = { id: 4, full_name: "JOHN SMITH", display_name: "John Smith", email: "j@example.com" };
        expect(normalizeUser(user)).toEqual({ ...user, display_name: "John Smith" });
    });

    it("applies title-casing to a backend-provided display_name that is all-caps", () => {
        // Backend sends an all-caps display_name — frontend should still normalize it.
        const user = { id: 5, full_name: "JANE DOE", display_name: "JANE DOE", email: "jane@example.com" };
        expect(normalizeUser(user)).toEqual({ ...user, display_name: "Jane Doe" });
    });
});

describe("embedded payload normalizers", () => {
    it("normalizes agreement string name arrays and team members", () => {
        expect(
            normalizeAgreementUsers({
                division_directors: ["DAVE DIRECTOR"],
                team_leaders: ["CHRIS FORTUNATO"],
                team_members: [{ id: 1, full_name: "AMELIA POPHAM", email: "amelia@example.com" }]
            })
        ).toEqual({
            division_directors: ["Dave Director"],
            team_leaders: ["Chris Fortunato"],
            team_members: [
                { id: 1, full_name: "AMELIA POPHAM", email: "amelia@example.com", display_name: "Amelia Popham" }
            ]
        });
    });

    it("normalizes project team leaders, team members, and division directors", () => {
        expect(
            normalizeProjectUsers({
                division_directors: ["DIRECTOR DERREK"],
                team_leaders: [{ id: 1, full_name: "CHRIS FORTUNATO", email: "chris@example.com" }],
                team_members: [{ id: 2, full_name: "SYSTEM OWNER", email: "owner@example.com" }]
            })
        ).toEqual({
            division_directors: ["Director Derrek"],
            team_leaders: [
                { id: 1, full_name: "CHRIS FORTUNATO", email: "chris@example.com", display_name: "Chris Fortunato" }
            ],
            team_members: [
                { id: 2, full_name: "SYSTEM OWNER", email: "owner@example.com", display_name: "System Owner" }
            ]
        });
    });

    it("normalizes portfolio team leaders", () => {
        expect(
            normalizePortfolioUsers({
                id: 1,
                team_leaders: [{ id: 1, full_name: "JANE SMITH", email: "jane@example.com" }]
            })
        ).toEqual({
            id: 1,
            team_leaders: [{ id: 1, full_name: "JANE SMITH", email: "jane@example.com", display_name: "Jane Smith" }]
        });
    });

    it("normalizes nested portfolio team leaders on CAN payloads", () => {
        expect(
            normalizeCanUsers({
                id: 1,
                portfolio: {
                    id: 2,
                    team_leaders: [{ id: 1, full_name: "JOHN DOE", email: "john@example.com" }]
                }
            })
        ).toEqual({
            id: 1,
            portfolio: {
                id: 2,
                team_leaders: [{ id: 1, full_name: "JOHN DOE", email: "john@example.com", display_name: "John Doe" }]
            }
        });
    });
});
