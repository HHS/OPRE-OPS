import { describe, it, expect } from "vitest";
import { sortAndFilterCANs } from "./CanList.helpers";

describe("sortAndFilterCANs", () => {
    const mockUser = { division: 1 };

    const mockCANs = [
        { id: 1, obligate_by: "2023", portfolio: { division_id: 1 } },
        { id: 2, obligate_by: "2023", portfolio: { division_id: 2 } },
        { id: 3, obligate_by: "2023", portfolio: { division_id: 1 } },
        { id: 4, obligate_by: null, portfolio: { division_id: 1 } }
    ];

    it("should return an empty array when input is null or empty", () => {
        expect(sortAndFilterCANs(null, false, mockUser)).toEqual([]);
        expect(sortAndFilterCANs([], false, mockUser)).toEqual([]);
    });

    it("should sort CANs by obligate_by date in descending order", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result.map((can) => can.id)).toEqual([1, 2, 3, 4]);
    });

    it("should filter CANs by user division when myCANsUrl is true", () => {
        const result = sortAndFilterCANs(mockCANs, true, mockUser);
        expect(result.length).toBe(3);
        expect(result.every((can) => can.portfolio.division_id === 1)).toBe(true);
    });

    it("should not filter CANs when myCANsUrl is false", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result.length).toBe(4);
    });

    it("should handle CANs with null obligate_by dates", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result[result.length - 1].id).toBe(4);
    });
});
