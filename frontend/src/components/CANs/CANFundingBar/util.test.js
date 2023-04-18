import { calculateRatio } from "./util";

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
