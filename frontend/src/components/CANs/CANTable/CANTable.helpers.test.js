import { formatObligateBy } from "./CANTable.helpers";

describe("formatObligateBy", () => {
    test('returns "TBD" for undefined input', () => {
        expect(formatObligateBy(undefined)).toBe("TBD");
    });

    test('returns "TBD" for non-numeric input', () => {
        expect(formatObligateBy("not a number")).toBe("TBD");
    });

    test('returns "TBD" for NaN input', () => {
        expect(formatObligateBy(NaN)).toBe("TBD");
    });

    test("formats valid fiscal year correctly", () => {
        expect(formatObligateBy(2023)).toBe("09/30/23");
    });

    test("handles different fiscal years", () => {
        expect(formatObligateBy(2024)).toBe("09/30/24");
        expect(formatObligateBy(2025)).toBe("09/30/25");
    });
});
