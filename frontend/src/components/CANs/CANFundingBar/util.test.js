import { calculateRatio } from "./util";

describe("calculateRatio", () => {
    test("returns 0 when received and expected are not provided", () => {
        const ratio = calculateRatio({});
        expect(ratio).toBe(0);
    });

    test("calculates ratio correctly", () => {
        const ratio1 = calculateRatio({ expected: 101.1, received: 101.1 });
        expect(ratio1).toBe(1);

        const ratio2 = calculateRatio({ expected: 0, received: 101.1 });
        expect(ratio2).toBe(10000);

        const ratio3 = calculateRatio({ expected: 101.1, received: 0 });
        expect(ratio3).toBe(0);
    });
});
