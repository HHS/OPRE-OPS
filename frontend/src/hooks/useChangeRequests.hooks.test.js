// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getChangeRequestsForTooltip,
    useChangeRequestTotal,
    useChangeRequestsForAgreement,
    useChangeRequestsForBudgetLines,
    useChangeRequestsForProcurementShop,
    useChangeRequestsForTooltip
} from "./useChangeRequests.hooks";

const useSelectorMock = vi.fn();
const useGetAgreementByIdQueryMock = vi.fn();
const useGetChangeRequestsListQueryMock = vi.fn();
const useGetProcurementShopsQueryMock = vi.fn();
const useGetAllCansMock = vi.fn();
const renderFieldMock = vi.fn();
const convertToCurrencyMock = vi.fn();
const calculateAgreementTotalMock = vi.fn();
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

vi.mock("../helpers/utils", () => ({
    convertToCurrency: (...args) => convertToCurrencyMock(...args),
    renderField: (...args) => renderFieldMock(...args)
}));

vi.mock("../helpers/agreement.helpers", () => ({
    calculateAgreementTotal: (...args) => calculateAgreementTotalMock(...args)
}));

vi.mock("../helpers/changeRequests.helpers", () => ({
    getChangeRequestMessages: (...args) => getChangeRequestMessagesMock(...args)
}));

describe("useChangeRequests.hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSelectorMock.mockImplementation((selector) =>
            selector({
                auth: {
                    activeUser: {
                        id: 77
                    }
                }
            })
        );
        useGetAllCansMock.mockReturnValue({
            cans: [{ id: 1, display_name: "CAN-1" }],
            isLoading: false,
            isError: false
        });
        renderFieldMock.mockImplementation((_entity, field, value) => `${field}:${value}`);
        convertToCurrencyMock.mockImplementation((value) => `$${value}`);
        calculateAgreementTotalMock.mockImplementation((_blis, fee) => fee * 100);
        getChangeRequestMessagesMock.mockReturnValue(
            "Procurement Shop: OLD to NEW\nFee Rate: 5% to 7%\nFee Total: $5 to $7"
        );
        useGetProcurementShopsQueryMock.mockReturnValue({
            data: [
                { id: 1, name: "Old", abbr: "OLD", fee_percentage: 5 },
                { id: 2, name: "New", abbr: "NEW", fee_percentage: 7 }
            ],
            isSuccess: true,
            isLoading: false
        });
    });

    it("useChangeRequestsForAgreement returns [] when dependencies are not ready", () => {
        useGetAgreementByIdQueryMock.mockReturnValue({
            data: null,
            isSuccess: false
        });
        useGetAllCansMock.mockReturnValue({
            cans: [],
            isLoading: true,
            isError: false
        });

        const { result } = renderHook(() => useChangeRequestsForAgreement(100));

        expect(result.current).toEqual([]);
        expect(useGetAgreementByIdQueryMock).toHaveBeenCalledWith(100, { skip: false });
    });

    it("useChangeRequestsForAgreement returns change messages on success", () => {
        useGetAgreementByIdQueryMock.mockReturnValue({
            data: {
                budget_line_items: [
                    {
                        id: 501,
                        in_review: true,
                        amount: 100,
                        date_needed: "2026-04-01",
                        status: "PLANNED",
                        can: { display_name: "CAN OLD" },
                        change_requests_in_review: [
                            {
                                requested_change_data: {
                                    amount: 150,
                                    date_needed: "2026-05-01",
                                    can_id: 1,
                                    status: "IN_EXECUTION"
                                }
                            }
                        ]
                    }
                ]
            },
            isSuccess: true
        });

        const { result } = renderHook(() => useChangeRequestsForAgreement(1));

        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current.join(" ")).toContain("BL 501");
        expect(result.current.join(" ")).toContain("status:PLANNED");
    });

    it("useChangeRequestTotal returns count or 0", () => {
        useGetChangeRequestsListQueryMock.mockReturnValueOnce({ data: [{ id: 1 }, { id: 2 }] });
        const view = renderHook(() => useChangeRequestTotal());
        expect(view.result.current).toBe(2);
        expect(useGetChangeRequestsListQueryMock).toHaveBeenCalledWith({ userId: 77 });

        useGetChangeRequestsListQueryMock.mockReturnValueOnce({ data: undefined });
        {
            const view = renderHook(() => useChangeRequestTotal());
            expect(view.result.current).toBe(0);
        }
    });

    it("useChangeRequestsForBudgetLines handles loading/no-data and budget path", () => {
        useGetAllCansMock.mockReturnValueOnce({
            cans: [],
            isLoading: true,
            isError: false
        });
        const view = renderHook(() => useChangeRequestsForBudgetLines([], null, true));
        expect(view.result.current).toBe("");

        const budgetLines = [
            {
                id: 12,
                in_review: true,
                amount: 100,
                date_needed: "2026-01-01",
                status: "PLANNED",
                can: { display_name: "CAN-OLD" },
                change_requests_in_review: [
                    {
                        has_budget_change: true,
                        requested_change_data: { amount: 150, date_needed: "2026-03-01", can_id: 1 }
                    }
                ]
            }
        ];

        {
            const view = renderHook(() => useChangeRequestsForBudgetLines(budgetLines, null, true));
            expect(view.result.current).toContain("BL 12");
            expect(view.result.current).toContain("Amount");
        }
    });

    it("useChangeRequestsForBudgetLines handles status-targeted and default paths", () => {
        const budgetLines = [
            {
                id: 22,
                in_review: true,
                amount: 100,
                date_needed: "2026-01-01",
                status: "PLANNED",
                can: { display_name: "CAN-OLD" },
                change_requests_in_review: [
                    {
                        has_budget_change: false,
                        requested_change_data: { status: "IN_EXECUTION" }
                    }
                ]
            }
        ];

        const view = renderHook(() => useChangeRequestsForBudgetLines(budgetLines, "IN_EXECUTION", false));
        expect(view.result.current).toContain("Status");

        {
            const view = renderHook(() => useChangeRequestsForBudgetLines(budgetLines, null, false));
            expect(view.result.current).toContain("Status");
        }
    });

    it("useChangeRequestsForProcurementShop returns formatted bullet message", () => {
        const { result } = renderHook(() =>
            useChangeRequestsForProcurementShop(
                { budget_line_items: [{ amount: 100 }] },
                { name: "Old Shop", abbr: "OLD", fee_percentage: 5 },
                { name: "New Shop", abbr: "NEW", fee_percentage: 7 }
            )
        );

        expect(result.current).toContain("Procurement Shop: Old Shop (OLD) to New Shop (NEW)");
        expect(result.current).toContain("\u2022");
    });

    it("useChangeRequestsForTooltip returns loading and empty states", () => {
        useGetProcurementShopsQueryMock.mockReturnValueOnce({
            data: [],
            isSuccess: false,
            isLoading: true
        });
        const view = renderHook(() => useChangeRequestsForTooltip({}, "Title"));
        expect(view.result.current).toBe("");

        useGetProcurementShopsQueryMock.mockReturnValueOnce({
            data: [],
            isSuccess: true,
            isLoading: true
        });
        {
            const view = renderHook(() =>
                useChangeRequestsForTooltip({ in_review: true, change_requests_in_review: [] }, "Title")
            );
            expect(view.result.current).toBe("Loading...");
        }
    });

    it("getChangeRequestsForTooltip includes amount/date/can/status/procurement-shop changes", () => {
        const result = getChangeRequestsForTooltip(
            [
                {
                    requested_change_data: {
                        amount: 200,
                        date_needed: "2026-06-01",
                        can_id: 1,
                        status: "IN_EXECUTION"
                    },
                    has_proc_shop_change: true,
                    requested_change_diff: {
                        awarding_entity_id: { old: 1, new: 2 }
                    }
                }
            ],
            [
                { id: 1, fee_percentage: 5, abbr: "OLD" },
                { id: 2, fee_percentage: 7, abbr: "NEW" }
            ],
            {
                amount: 100,
                date_needed: "2026-01-01",
                status: "PLANNED",
                can: { display_name: "CAN-OLD" }
            },
            [{ id: 1, display_name: "CAN-NEW" }],
            true,
            "Pending edits:"
        );

        expect(result).toContain("Pending edits:");
        expect(result).toContain("Amount");
        expect(result).toContain("Obligate By Date");
        expect(result).toContain("CAN");
        expect(result).toContain("Status Change");
        expect(result).toContain("Procurement Shop");
    });
});
