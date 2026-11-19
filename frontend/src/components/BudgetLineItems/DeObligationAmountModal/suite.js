import { create, test, enforce, mode, Modes } from "vest";

/**
 * Validates the amount to de-obligate from an Obligated budget line (OPS-6488): must be a
 * number greater than $0 and no more than the line's obligated amount (maxAmount) -- so the
 * line can be de-obligated in full.
 */
const suite = create((data, maxAmount = 0) => {
    mode(Modes.ALL);

    test("requestedAmount", "This is required information", () => {
        enforce(data.requestedAmount).isNotNullish();
    });

    test("requestedAmount", "The de-obligated amount must be greater than $0", () => {
        enforce(data.requestedAmount).greaterThan(0);
    });

    test("requestedAmount", "The de-obligated amount can't be more than the budget line's obligated amount", () => {
        enforce(data.requestedAmount).lessThanOrEquals(maxAmount);
    });
});

export default suite;
