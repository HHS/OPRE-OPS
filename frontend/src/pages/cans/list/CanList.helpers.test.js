import { describe, it, expect } from "vitest";
import { sortAndFilterCANs } from "./CanList.helpers";
import { USER_ROLES } from "../../../components/Users/User.constants";

describe("sortAndFilterCANs", () => {
    const mockUser = {
        id: 1,
        roles: [USER_ROLES.USER],
        division: 1,
        display_name: "Test User",
        email: "test@example.com",
        first_name: "Test",
        full_name: "Test User",
        last_name: "User",
        permissions: [],
        username: "testuser"
    };

    const mockCANs = [
        {
            id: 1,
            obligate_by: "2023-12-31",
            portfolio: { division_id: 1 },
            budget_line_items: [{ team_members: [{ id: 1 }] }]
        },
        {
            id: 2,
            obligate_by: "2023-11-30",
            portfolio: { division_id: 2 },
            budget_line_items: []
        },
        {
            id: 3,
            obligate_by: "2023-10-31",
            portfolio: { division_id: 1 },
            budget_line_items: [{ team_members: [{ id: 2 }] }]
        },
        {
            id: 4,
            obligate_by: null,
            portfolio: { division_id: 1 },
            budget_line_items: []
        }
    ];

    it("should return an empty array when input is null or empty", () => {
        expect(sortAndFilterCANs(null, false, mockUser)).toEqual([]);
        expect(sortAndFilterCANs([], false, mockUser)).toEqual([]);
    });

    it("should sort CANs by obligate_by date in descending order", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result?.map((can) => can.id)).toEqual([1, 2, 3, 4]);
    });

    it("should filter CANs by user's team membership when myCANsUrl is true", () => {
        const result = sortAndFilterCANs(mockCANs, true, mockUser);
        expect(result?.length).toBe(1);
        expect(result?.[0].id).toBe(1);
    });

    it("should not filter CANs when myCANsUrl is false", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result?.length).toBe(4);
    });

    it("should handle CANs with null obligate_by dates", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser);
        expect(result?.[result.length - 1].id).toBe(4);
    });

    it("should allow admin to see all CANs when myCANsUrl is true", () => {
        const adminUser = { ...mockUser, roles: [USER_ROLES.ADMIN] };
        const result = sortAndFilterCANs(mockCANs, true, adminUser);
        expect(result?.length).toBe(4);
    });

    it("should filter CANs by division for division directors and budget team", () => {
        const divisionDirector = { ...mockUser, roles: [USER_ROLES.DIVISION_DIRECTOR] };
        const result = sortAndFilterCANs(mockCANs, true, divisionDirector);
        expect(result?.length).toBe(3);
        expect(result?.every((can) => can.portfolio.division_id === 1)).toBe(true);
    });
});
