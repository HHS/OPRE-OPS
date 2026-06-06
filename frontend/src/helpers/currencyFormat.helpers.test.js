import { describe, it, expect } from "vitest";
import { formatCurrency } from "./currencyFormat.helpers";

describe("formatCurrency", () => {
    it("renders zero without decimals", () => {
        expect(formatCurrency(0)).toBe("$0");
    });

    it("treats null and undefined as zero", () => {
        expect(formatCurrency(null)).toBe("$0");
        expect(formatCurrency(undefined)).toBe("$0");
    });

    it("renders non-zero numbers with two decimals", () => {
        expect(formatCurrency(1234.5)).toBe("$1,234.50");
        expect(formatCurrency(1)).toBe("$1.00");
    });

    it("renders negative numbers with the sign", () => {
        expect(formatCurrency(-1234.5)).toBe("-$1,234.50");
    });

    it("rounds to two decimal places", () => {
        expect(formatCurrency(1.005)).toBe("$1.01");
        expect(formatCurrency(1.004)).toBe("$1.00");
    });

    it("coerces numeric strings", () => {
        expect(formatCurrency("1234.5")).toBe("$1,234.50");
        expect(formatCurrency("0")).toBe("$0");
    });

    it("falls back to zero for non-finite inputs", () => {
        expect(formatCurrency(NaN)).toBe("$0");
        expect(formatCurrency(Infinity)).toBe("$0");
        expect(formatCurrency(-Infinity)).toBe("$0");
        expect(formatCurrency("not a number")).toBe("$0");
    });
});
