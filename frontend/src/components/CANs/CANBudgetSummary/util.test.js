import { getPendingFunds } from "./util";
import constants from "../../../constants";

test("pending funds should be empty", async () => {
    expect(getPendingFunds(undefined)).toBe(constants.notFilledInText);
    expect(getPendingFunds({})).toBe(constants.notFilledInText);
    expect(getPendingFunds({ nonsense: "blah" })).toBe(constants.notFilledInText);
});

test("pending funds should be total_fiscal_year_funding - amount_available", async () => {
    expect(getPendingFunds({ total_funding: 10, amount_available: 1 })).toBe(9);
    expect(getPendingFunds({ total_funding: 1, amount_available: 10 })).toBe(-9);
});
