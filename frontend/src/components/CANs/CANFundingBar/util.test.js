import { calculateRatio } from "./util";

test("calculates ratio correctly", async () => {
    expect(calculateRatio({})).toEqual(0);
    expect(calculateRatio({ expected: 101.1, received: 101.1 })).toEqual(1);
    expect(calculateRatio({ expected: 0, received: 101.1 })).toEqual(10000);
    expect(calculateRatio({ expected: 101.1, received: 0 })).toEqual(0);
});
