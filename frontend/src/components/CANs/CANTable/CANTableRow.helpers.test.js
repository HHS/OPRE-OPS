import { describe, it, expect } from "vitest";
import { displayActivePeriod } from "./CANTableRow.helpers";

describe("displayActivePeriod", () => {
    it('should return "TBD" when activePeriod is 0', () => {
        expect(displayActivePeriod(0)).toBe("TBD");
    });

    it('should return "1 year" when activePeriod is 1', () => {
        expect(displayActivePeriod(1)).toBe("1 year");
    });

    it('should return "X years" for any activePeriod greater than 1', () => {
        expect(displayActivePeriod(2)).toBe("2 years");
        expect(displayActivePeriod(5)).toBe("5 years");
        expect(displayActivePeriod(10)).toBe("10 years");
    });

    it("should handle negative values", () => {
        expect(displayActivePeriod(-2)).toBe("-2 years");
    });
});
