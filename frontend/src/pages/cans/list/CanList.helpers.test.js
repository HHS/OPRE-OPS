import { describe, it, expect } from "vitest";
import { sortAndFilterCANs, getPortfolioOptions } from "./CanList.helpers";
import { USER_ROLES } from "../../../components/Users/User.constants";

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

describe("sortAndFilterCANs", () => {
    const mockCANs = [
        {
            id: 1,
            obligate_by: "2023-12-31",
            portfolio: {
                division_id: 1,
                division: {
                    division_director_id: 1,
                    deputy_division_director_id: 1,
                } },
            budget_line_items: [{ team_members: [{ id: 1 }] }],
            active_period: 1
        },
        {
            id: 2,
            obligate_by: "2023-11-30",
            portfolio: {
                division_id: 2,
                division: {
                division_director_id: 2,
                deputy_division_director_id: 2,
            } },
            budget_line_items: [],
            active_period: 2
        },
        {
            id: 3,
            obligate_by: "2023-10-31",
            portfolio: {
                division_id: 1,
                division: {
                division_director_id: 1,
                deputy_division_director_id: 1,
            } },
            budget_line_items: [{ team_members: [{ id: 2 }] }],
            active_period: 1
        },
        {
            id: 4,
            obligate_by: null,
            portfolio: {
                division_id: 1,
                division: {
                division_director_id: 1,
                deputy_division_director_id: 1,
            } },
            budget_line_items: [],
            active_period: 3
        }
    ];

    const mockFilters = {};

    it("should return an empty array when input is null or empty", () => {
        expect(sortAndFilterCANs(null, false, mockUser, mockFilters)).toEqual([]);
        expect(sortAndFilterCANs([], false, mockUser, mockFilters)).toEqual([]);
    });

    it("should sort CANs by obligate_by date in descending order", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser, mockFilters);
        expect(result.map((can) => can.id)).toEqual([1, 2, 3, 4]);
    });

    it("should filter CANs by user's team membership when myCANsUrl is true", () => {
        const result = sortAndFilterCANs(mockCANs, true, mockUser, mockFilters);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
    });

    it("should not filter CANs when myCANsUrl is false", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser, mockFilters);
        expect(result.length).toBe(4);
    });

    it("should handle CANs with null obligate_by dates", () => {
        const result = sortAndFilterCANs(mockCANs, false, mockUser, mockFilters);
        expect(result[result.length - 1].id).toBe(4);
    });

    it("should allow system owner to see all CANs when myCANsUrl is true", () => {
        const systemOwner = { ...mockUser, roles: [USER_ROLES.SYSTEM_OWNER] };
        const result = sortAndFilterCANs(mockCANs, true, systemOwner, mockFilters);
        expect(result.length).toBe(4);
    });

    it("should filter CANs by division for reviewer/approvers and budget team", () => {
        const reviewerApprover = { ...mockUser, roles: [USER_ROLES.REVIEWER_APPROVER] };
        const result = sortAndFilterCANs(mockCANs, true, reviewerApprover, mockFilters);
        expect(result.length).toBe(3);
        expect(result.every((can) => can.portfolio.division_id === 1 )).toBe(true);
    });

    it("should filter CANs by active period", () => {
        const filtersWithActivePeriod = {
            activePeriod: [{ id: 1, title: "Period 1" }]
        };
        const result = sortAndFilterCANs(mockCANs, false, mockUser, filtersWithActivePeriod);
        expect(result.length).toBe(2);
        expect(result.every((can) => can.active_period === 1)).toBe(true);
    });
    it("should filter CANs by transfer method", () => {
        const mockCANsWithTransfer = [
            {
                id: 1,
                obligate_by: "2023-12-31",
                portfolio: { division_id: 1 },
                budget_line_items: [{ team_members: [{ id: 1 }] }],
                active_period: 1,
                funding_details: { method_of_transfer: "IAA" }
            },
            {
                id: 2,
                obligate_by: "2023-11-30",
                portfolio: { division_id: 2 },
                budget_line_items: [],
                active_period: 2,
                funding_details: { method_of_transfer: "CONTRACT" }
            },
            {
                id: 3,
                obligate_by: "2023-10-31",
                portfolio: { division_id: 1 },
                budget_line_items: [{ team_members: [{ id: 2 }] }],
                active_period: 1,
                funding_details: { method_of_transfer: "IAA" }
            }
        ];

        const filtersWithTransfer = {
            transfer: [{ id: 1, title: "IAA" }]
        };

        const result = sortAndFilterCANs(mockCANsWithTransfer, false, mockUser, filtersWithTransfer);
        expect(result.length).toBe(2);
        expect(result.every((can) => can.funding_details.method_of_transfer === "IAA")).toBe(true);
    });
});

describe("Portfolio filtering and options", () => {
    const mockCANsWithPortfolios = [
        {
            id: 1,
            obligate_by: "2023-12-31",
            portfolio: { division_id: 1, name: "Portfolio A", abbreviation: "ABC" },
            budget_line_items: [{ team_members: [{ id: 1 }] }],
            active_period: 1
        },
        {
            id: 2,
            obligate_by: "2023-11-30",
            portfolio: { division_id: 2, name: "Portfolio X", abbreviation: "XYZ" },
            budget_line_items: [],
            active_period: 2
        },
        {
            id: 3,
            obligate_by: "2023-10-31",
            portfolio: { division_id: 1, name: "Portfolio A", abbreviation: "ABC" },
            budget_line_items: [{ team_members: [{ id: 2 }] }],
            active_period: 1
        }
    ];

    it("should filter CANs by portfolio", () => {
        const filtersWithPortfolio = {
            portfolio: [{ id: 1, title: "Portfolio A (ABC)" }]
        };
        const result = sortAndFilterCANs(mockCANsWithPortfolios, false, mockUser, filtersWithPortfolio);
        expect(result.length).toBe(2);
        expect(
            result.every((can) => can.portfolio.name === "Portfolio A" && can.portfolio.abbreviation === "ABC")
        ).toBe(true);
    });

    it("should return unique portfolio options", () => {
        const portfolioOptions = getPortfolioOptions(mockCANsWithPortfolios);
        expect(portfolioOptions).toEqual([
            { abbr: "ABC", id: 0, title: "Portfolio A (ABC)" },
            { abbr: "XYZ", id: 1, title: "Portfolio X (XYZ)" }
        ]);
    });

    it("should return an empty array for getPortfolioOptions when input is null or empty", () => {
        expect(getPortfolioOptions(null)).toEqual([]);
        expect(getPortfolioOptions([])).toEqual([]);
    });

    it("should handle multiple portfolios in filter", () => {
        const filtersWithMultiplePortfolios = {
            portfolio: [
                { id: 1, title: "Portfolio A (ABC)" },
                { id: 2, title: "Portfolio X (XYZ)" }
            ]
        };
        const result = sortAndFilterCANs(mockCANsWithPortfolios, false, mockUser, filtersWithMultiplePortfolios);
        expect(result.length).toBe(3);
    });
});
