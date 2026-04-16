import { calculateRatio, resolveLeftFlexWidth } from "./util";

describe("calculateRatio", () => {
    it("returns 0 if the data object is malformed", () => {
        const data = { received: 100 };
        expect(calculateRatio(data)).toBe(0);
    });

    it("returns 0 if the received amount is 0", () => {
        const data = { expected: 200, received: 0 };
        expect(calculateRatio(data)).toBe(0);
    });

    it("returns 10000 if the expected amount is 0", () => {
        const data = { expected: 0, received: 200 };
        expect(calculateRatio(data)).toBe(10000);
    });

    it("returns the correct ratio", () => {
        const data = { expected: 200, received: 100 };
        expect(calculateRatio(data)).toBe(0.5);
    });
});

describe("resolveLeftFlexWidth", () => {
    describe("numeric leftPercent branch", () => {
        it("returns the numeric percent directly for a normal value", () => {
            expect(resolveLeftFlexWidth(40, 400, 600)).toBe(40);
        });

        it("returns 0 when numeric leftPercent is 0", () => {
            expect(resolveLeftFlexWidth(0, 0, 1000)).toBe(0);
        });

        it("applies MIN_WIDTH floor when numeric percent is tiny but non-zero", () => {
            // 1% is below the MIN_WIDTH of 2, so should return 2
            expect(resolveLeftFlexWidth(1, 10, 990)).toBe(2);
        });

        it("prevents the right bar from going below MIN_WIDTH when left is dominant", () => {
            // rightPercent = 100 - 99 = 1 (< 2), so leftFlexWidth should be 98
            expect(resolveLeftFlexWidth(99, 990, 10)).toBe(98);
        });

        it("returns 100 when leftPercent is 100 (right is zero)", () => {
            expect(resolveLeftFlexWidth(100, 1000, 0)).toBe(100);
        });
    });

    describe("string leftPercent branch (value-proportional fallback)", () => {
        it("computes value-proportional width for display string '<1'", () => {
            // leftValue=10, rightValue=990 → 10/1000 * 100 = 1, but < MIN_WIDTH → 2
            expect(resolveLeftFlexWidth("<1", 10, 990)).toBe(2);
        });

        it("computes value-proportional width for normal complementary values", () => {
            // leftValue=400, rightValue=600 → 40%
            expect(resolveLeftFlexWidth("<1", 400, 600)).toBe(40);
        });

        it("returns 0 when total is zero", () => {
            expect(resolveLeftFlexWidth("<1", 0, 0)).toBe(0);
        });

        it("prevents right bar from going below MIN_WIDTH when left dominates with string percent", () => {
            // leftValue=990, rightValue=10 → rightRaw = 1% < 2 → leftFlexWidth = 98
            expect(resolveLeftFlexWidth("99", 990, 10)).toBe(98);
        });
    });
});
