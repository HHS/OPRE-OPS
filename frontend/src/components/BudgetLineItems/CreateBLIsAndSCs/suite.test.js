import { describe, expect, it, beforeEach } from "vitest";
import suite from "./suite";

// A far-future date so the "Need by date must be in the future" rule always passes,
// isolating the PoP-range rule under test.
const validBase = {
    id: 1,
    date_needed: "2044-06-15",
    can_id: 5,
    amount: 100
};

describe("CreateBLIsAndSCs suite — PoP range rule", () => {
    beforeEach(() => {
        suite.reset();
    });

    it("passes when date_needed falls within the SC PoP window (inclusive)", () => {
        const result = suite.run({
            budgetLines: [{ ...validBase, sc_period_start: "2044-06-15", sc_period_end: "2044-12-31" }]
        });
        expect(result.isValid()).toBe(true);
    });

    it("fails when date_needed is before the SC PoP start", () => {
        const result = suite.run({
            budgetLines: [{ ...validBase, sc_period_start: "2044-07-01", sc_period_end: "2044-12-31" }]
        });
        expect(result.isValid()).toBe(false);
        expect(result.getErrors("Budget line item (1)")).toContain(
            "Obligate By date is outside the agreement's Period of Performance"
        );
    });

    it("fails when date_needed is after the SC PoP end", () => {
        const result = suite.run({
            budgetLines: [{ ...validBase, sc_period_start: "2044-01-01", sc_period_end: "2044-05-31" }]
        });
        expect(result.isValid()).toBe(false);
        expect(result.getErrors("Budget line item (1)")).toContain(
            "Obligate By date is outside the agreement's Period of Performance"
        );
    });

    it("skips the PoP rule when the SC period is missing (e.g. grant BLIs)", () => {
        const result = suite.run({
            budgetLines: [{ ...validBase }]
        });
        // No PoP fields → rule is skipped; the remaining rules still pass.
        expect(result.isValid()).toBe(true);
        expect(result.getErrors("Budget line item (1)")).not.toContain(
            "Obligate By date is outside the agreement's Period of Performance"
        );
    });
});
