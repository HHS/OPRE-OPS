import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    CHANGE_REQUESTS_TOOLTIP_LOADING,
    useChangeRequestTotal,
    useChangeRequestsForAgreement,
    useChangeRequestsForBudgetLines,
    useChangeRequestsForProcurementShop,
    useChangeRequestsForTooltip,
    getChangeRequestsForTooltip
} from "./useChangeRequests.hooks";

const useSelectorMock = vi.fn();
const useGetAgreementByIdQueryMock = vi.fn();
const useGetChangeRequestsListQueryMock = vi.fn();
const useGetProcurementShopsQueryMock = vi.fn();
const useGetAllCansMock = vi.fn();
const getChangeRequestMessagesMock = vi.fn();

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("../api/opsAPI", () => ({
    useGetAgreementByIdQuery: (...args) => useGetAgreementByIdQueryMock(...args),
    useGetChangeRequestsListQuery: (...args) => useGetChangeRequestsListQueryMock(...args),
    useGetProcurementShopsQuery: (...args) => useGetProcurementShopsQueryMock(...args)
}));

vi.mock("./useGetAllCans", () => ({
    useGetAllCans: () => useGetAllCansMock()
}));

vi.mock("../helpers/changeRequests.helpers", () => ({
    getChangeRequestMessages: (...args) => getChangeRequestMessagesMock(...args)
}));

const mockCans = [
    { id: 1, display_name: "CAN-001" },
    { id: 2, display_name: "CAN-002" }
];

const budgetLineWithChanges = {
    id: 10,
    in_review: true,
    amount: 100,
    date_needed: "2026-08-10",
    status: "PLANNED",
    can: { id: 1, display_name: "CAN-001" },
    change_requests_in_review: [
        {
            has_budget_change: true,
            requested_change_data: {
                amount: 200,
                date_needed: "2026-09-10",
                can_id: 2,
                status: "IN_EXECUTION"
            }
        }
    ]
};

describe("useChangeRequestTotal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns total count with active user id", () => {
        useSelectorMock.mockImplementation((selector) => selector({ auth: { activeUser: { id: 8 } } }));
        useGetChangeRequestsListQueryMock.mockReturnValue({ data: [{ id: 1 }, { id: 2 }] });

        const { result } = renderHook(() => useChangeRequestTotal());

        expect(useGetChangeRequestsListQueryMock).toHaveBeenCalledWith({ userId: 8 }, { skip: false });
        expect(result.current).toBe(2);
    });

    it("falls back to zero when no list data and missing user", () => {
        useSelectorMock.mockImplementation((selector) => selector({ auth: { activeUser: null } }));
        useGetChangeRequestsListQueryMock.mockReturnValue({ data: undefined });

        const { result } = renderHook(() => useChangeRequestTotal());

        expect(useGetChangeRequestsListQueryMock).toHaveBeenCalledWith({ userId: null }, { skip: true });
        expect(result.current).toBe(0);
    });
});

describe("useChangeRequestsForAgreement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty list when agreement query is not successful", () => {
        useGetAgreementByIdQueryMock.mockReturnValue({ data: undefined, isSuccess: false });
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() => useChangeRequestsForAgreement(10));

        expect(result.current).toEqual([]);
    });

    it("returns empty list when CAN query not ready", () => {
        useGetAgreementByIdQueryMock.mockReturnValue({
            data: { budget_line_items: [budgetLineWithChanges] },
            isSuccess: true
        });
        useGetAllCansMock.mockReturnValue({ cans: [], isLoading: true, isError: false });

        const { result } = renderHook(() => useChangeRequestsForAgreement(10));

        expect(result.current).toEqual([]);
    });

    it("returns formatted messages when agreement and CANs are ready", () => {
        useGetAgreementByIdQueryMock.mockReturnValue({
            data: { budget_line_items: [budgetLineWithChanges] },
            isSuccess: true
        });
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() => useChangeRequestsForAgreement(10));

        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current.join(" ")).toContain("BL 10 Amount:");
    });
});

describe("useChangeRequestsForBudgetLines", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty string when budget lines are missing", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() => useChangeRequestsForBudgetLines(null));

        expect(result.current).toBe("");
    });

    it("returns empty string when CAN query fails", () => {
        useGetAllCansMock.mockReturnValue({ cans: [], isLoading: false, isError: true });

        const { result } = renderHook(() => useChangeRequestsForBudgetLines([budgetLineWithChanges]));

        expect(result.current).toBe("");
    });

    it("returns budget-change filtered messages", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() => useChangeRequestsForBudgetLines([budgetLineWithChanges], null, true));

        expect(result.current).toContain("Amount:");
        expect(result.current).toContain("CAN:");
    });

    it("returns status-filtered messages", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() =>
            useChangeRequestsForBudgetLines([budgetLineWithChanges], "IN_EXECUTION", false)
        );

        expect(result.current).toContain("Status:");
    });

    it("returns default aggregated messages when no target mode selected", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });

        const { result } = renderHook(() => useChangeRequestsForBudgetLines([budgetLineWithChanges]));

        expect(result.current).toContain("BL 10");
    });
});

describe("useChangeRequestsForProcurementShop", () => {
    it("returns formatted procurement shop diff bullets", () => {
        const agreementData = {
            budget_line_items: [{ amount: 1000 }, { amount: 500 }]
        };
        const oldShop = { name: "Old Shop", abbr: "OLD", fee_percentage: 1 };
        const newShop = { name: "New Shop", abbr: "NEW", fee_percentage: 2 };

        const { result } = renderHook(() => useChangeRequestsForProcurementShop(agreementData, oldShop, newShop));

        expect(result.current).toContain("Procurement Shop: Old Shop (OLD) to New Shop (NEW)");
        expect(result.current).toContain("Fee Rate: 1% to 2%");
        expect(result.current).toContain("Fee Total:");
    });
});

describe("useChangeRequestsForTooltip", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getChangeRequestMessagesMock.mockReturnValue("Proc old to new\nFee old to new");
    });

    const tooltipBudgetLine = {
        amount: 100,
        date_needed: "2026-01-10",
        status: "PLANNED",
        in_review: true,
        can: { display_name: "CAN-001" },
        change_requests_in_review: [
            {
                requested_change_data: {
                    amount: 200,
                    date_needed: "2026-02-10",
                    can_id: 2,
                    status: "IN_EXECUTION"
                },
                has_proc_shop_change: true,
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 10,
                        new: 20
                    }
                }
            }
        ]
    };

    it("returns loading string when dependencies are still loading", () => {
        useGetAllCansMock.mockReturnValue({ cans: [], isLoading: true, isError: false });
        useGetProcurementShopsQueryMock.mockReturnValue({ data: [], isSuccess: false, isLoading: false });

        const { result } = renderHook(() => useChangeRequestsForTooltip(tooltipBudgetLine));

        expect(result.current).toBe(CHANGE_REQUESTS_TOOLTIP_LOADING);
    });

    it("returns loading text when hooks report loading despite success", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });
        useGetProcurementShopsQueryMock.mockReturnValue({
            data: [{ id: 10 }, { id: 20 }],
            isSuccess: true,
            isLoading: true
        });

        const { result } = renderHook(() => useChangeRequestsForTooltip(tooltipBudgetLine));

        expect(result.current).toBe(CHANGE_REQUESTS_TOOLTIP_LOADING);
    });

    it("returns empty message when budget line is not in review", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });
        useGetProcurementShopsQueryMock.mockReturnValue({
            data: [{ id: 10 }, { id: 20 }],
            isSuccess: true,
            isLoading: false
        });

        const { result } = renderHook(() =>
            useChangeRequestsForTooltip({ ...tooltipBudgetLine, in_review: false }, "Pending updates")
        );

        expect(result.current).toBe("");
    });

    it("returns detailed tooltip message for in-review budget line", () => {
        useGetAllCansMock.mockReturnValue({ cans: mockCans, isLoading: false, isError: false });
        useGetProcurementShopsQueryMock.mockReturnValue({
            data: [
                { id: 10, name: "Old" },
                { id: 20, name: "New" }
            ],
            isSuccess: true,
            isLoading: false
        });

        const { result } = renderHook(() => useChangeRequestsForTooltip(tooltipBudgetLine, "Pending updates"));

        expect(result.current).toContain("Pending updates");
        expect(result.current).toContain("Amount:");
        expect(result.current).toContain("Obligate By Date:");
        expect(result.current).toContain("CAN:");
        expect(result.current).toContain("Status Change:");
        expect(result.current).toContain("Proc old to new");
    });
});

describe("getChangeRequestsForTooltip", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getChangeRequestMessagesMock.mockReturnValue("Line A\nLine B");
    });

    it("returns empty string for no changes and no in-review lock", () => {
        const result = getChangeRequestsForTooltip([], [], {}, [], false);
        expect(result).toBe("");
    });

    it("builds multiline bullets when in review with title", () => {
        const result = getChangeRequestsForTooltip(
            [
                {
                    requested_change_data: {
                        amount: 20,
                        date_needed: "2026-05-01",
                        can_id: 2,
                        status: "IN_EXECUTION"
                    },
                    has_proc_shop_change: true,
                    requested_change_diff: {
                        awarding_entity_id: {
                            old: 1,
                            new: 2
                        }
                    }
                }
            ],
            [
                { id: 1, name: "Old" },
                { id: 2, name: "New" }
            ],
            {
                amount: 10,
                date_needed: "2026-04-01",
                status: "PLANNED",
                can: { display_name: "CAN-001" }
            },
            mockCans,
            true,
            "Locked edits"
        );

        expect(result.startsWith("Locked edits")).toBe(true);
        expect(result).toContain("\n • Amount:");
        expect(result).toContain("\n • Line A");
        expect(result).toContain("\n • Line B");
    });
});
