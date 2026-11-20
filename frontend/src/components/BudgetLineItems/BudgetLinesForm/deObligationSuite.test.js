import { beforeEach, describe, expect, it } from "vitest";
import suite from "./deObligationSuite";

describe("De-obligation Validation Suite", () => {
    beforeEach(() => {
        suite.reset();
    });

    const maxAmount = 500000;

    it("passes for an amount in (0, maxAmount]", () => {
        const result = suite.run({ requestedAmount: 100000 }, maxAmount);

        expect(result.hasErrors()).toBe(false);
        expect(result.getErrors("requestedAmount")).toHaveLength(0);
    });

    it("passes when the full remaining amount is requested (full de-obligation)", () => {
        const result = suite.run({ requestedAmount: maxAmount }, maxAmount);

        expect(result.hasErrors()).toBe(false);
    });

    it("fails when the amount is missing", () => {
        const result = suite.run({ requestedAmount: null }, maxAmount);

        expect(result.hasErrors()).toBe(true);
        expect(result.getErrors("requestedAmount")).toContain("This is required information");
    });

    it("fails when the amount is 0", () => {
        const result = suite.run({ requestedAmount: 0 }, maxAmount);

        expect(result.hasErrors()).toBe(true);
        expect(result.getErrors("requestedAmount")).toContain("The de-obligated amount must be greater than $0");
    });

    it("fails when the amount is negative", () => {
        const result = suite.run({ requestedAmount: -50 }, maxAmount);

        expect(result.hasErrors()).toBe(true);
        expect(result.getErrors("requestedAmount")).toContain("The de-obligated amount must be greater than $0");
    });

    it("fails when the amount exceeds the remaining obligated amount", () => {
        const result = suite.run({ requestedAmount: maxAmount + 0.01 }, maxAmount);

        expect(result.hasErrors()).toBe(true);
        expect(result.getErrors("requestedAmount")).toContain(
            "The de-obligated amount can't be more than the budget line's obligated amount"
        );
    });
});
