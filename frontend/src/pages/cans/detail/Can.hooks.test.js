import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCan from "./Can.hooks";

const useSelectorMock = vi.fn();
const useParamsMock = vi.fn();
const useGetCanByIdQueryMock = vi.fn();
const useGetCanFundingQueryMock = vi.fn();

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useParams: () => useParamsMock()
    };
});

vi.mock("../../../api/opsAPI", () => ({
    useGetCanByIdQuery: (...args) => useGetCanByIdQueryMock(...args),
    useGetCanFundingQuery: (...args) => useGetCanFundingQueryMock(...args)
}));

vi.mock("../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getCurrentFiscalYear: () => 2026
    };
});

const canFixture = {
    id: 42,
    number: "CAN-042",
    display_name: "CAN-042",
    description: "Test CAN",
    nick_name: "Coverage CAN",
    portfolio_id: 9,
    is_expired: false,
    funding_details: { fiscal_year: 2024, active_period: 2 },
    funding_budgets: [
        { id: 901, fiscal_year: 2025, budget: 500 },
        { id: 902, fiscal_year: 2026, budget: 1000 }
    ],
    funding_received: [
        { id: 1, fiscal_year: 2026, funding: 200 },
        { id: 2, fiscal_year: 2025, funding: 100 }
    ],
    projects: [
        { id: 1, project_type: "RESEARCH" },
        { id: 2, project_type: "RESEARCH" },
        { id: 3, project_type: "TECHNICAL" }
    ],
    budget_line_items: [
        {
            id: 11,
            fiscal_year: 2026,
            status: "DRAFT",
            agreement: { name: "AGR-1", agreement_type: "CONTRACT" }
        },
        {
            id: 12,
            fiscal_year: 2026,
            status: "IN_EXECUTION",
            agreement: { name: "AGR-2", agreement_type: "IAA" }
        },
        {
            id: 13,
            fiscal_year: 2025,
            status: "PLANNED",
            agreement: { name: "AGR-3", agreement_type: "CONTRACT" }
        }
    ],
    portfolio: {
        division_id: 55,
        name: "Portfolio One",
        team_leaders: [{ id: 1, full_name: "Leader" }]
    }
};

describe("useCan", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useParamsMock.mockReturnValue({ id: "42" });
        useSelectorMock.mockImplementation((selector) =>
            selector({
                auth: {
                    activeUser: {
                        roles: [{ name: "BUDGET_TEAM" }]
                    }
                }
            })
        );

        useGetCanByIdQueryMock.mockReturnValue({
            data: canFixture,
            isLoading: false
        });

        useGetCanFundingQueryMock.mockImplementation(({ fiscalYear }) => {
            if (fiscalYear === 2025) {
                return { data: { funding: { available_funding: 75 } }, isLoading: false };
            }

            return {
                data: {
                    funding: {
                        total_funding: 1000,
                        planned_funding: 300,
                        obligated_funding: 100,
                        in_execution_funding: 200,
                        in_draft_funding: 400,
                        received_funding: 200
                    }
                },
                isLoading: false
            };
        });
    });

    it("derives fiscal-year data, counts, and ids from the CAN payload", () => {
        const { result } = renderHook(() => useCan());

        expect(result.current.canId).toBe(42);
        expect(result.current.fiscalYear).toBe(2026);
        expect(result.current.isBudgetTeam).toBe(true);
        expect(result.current.canNumber).toBe("CAN-042");
        expect(result.current.currentFiscalYearFundingId).toBe(902);
        expect(result.current.budgetLineItemsByFiscalYear.map((item) => item.id)).toEqual([11, 12]);
        expect(result.current.fundingReceivedByFiscalYear.map((item) => item.id)).toEqual([1]);
        expect(result.current.projectTypesCount).toEqual([
            { type: "RESEARCH", count: 2 },
            { type: "TECHNICAL", count: 1 }
        ]);
        expect(result.current.budgetLineTypesCount).toEqual([
            { type: "DRAFT", count: 1 },
            { type: "IN_EXECUTION", count: 1 }
        ]);
        expect(result.current.agreementTypesCount).toEqual([
            { type: "CONTRACT", count: 1 },
            { type: "IAA", count: 1 }
        ]);
        expect(result.current.carryForwardFunding).toBe(75);
    });

    it("updates filtered results when the selected fiscal year changes and toggles edit modes", async () => {
        const { result } = renderHook(() => useCan());

        act(() => {
            result.current.setSelectedFiscalYear("2025");
        });

        await waitFor(() => {
            expect(result.current.fiscalYear).toBe(2025);
        });

        expect(result.current.budgetLineItemsByFiscalYear.map((item) => item.id)).toEqual([13]);
        expect(result.current.fundingReceivedByFiscalYear.map((item) => item.id)).toEqual([2]);

        act(() => {
            result.current.toggleDetailPageEditMode();
        });

        act(() => {
            result.current.toggleFundingPageEditMode();
        });

        expect(result.current.isEditMode).toEqual({ detailPage: true, fundingPage: true });
    });

    it("opens a welcome modal when the current fiscal year has no funding and enters edit mode on confirm", () => {
        useGetCanFundingQueryMock.mockImplementation(({ fiscalYear }) => {
            if (fiscalYear === 2025) {
                return { data: { funding: { available_funding: 10 } }, isLoading: false };
            }

            return {
                data: {
                    funding: {
                        total_funding: 0,
                        planned_funding: 0,
                        obligated_funding: 0,
                        in_execution_funding: 0,
                        in_draft_funding: 0,
                        received_funding: 0
                    }
                },
                isLoading: false
            };
        });

        const { result } = renderHook(() => useCan());

        act(() => {
            result.current.toggleFundingPageEditMode();
        });

        expect(result.current.modalProps.showModal).toBe(true);
        expect(result.current.modalProps.heading).toContain("Welcome to FY 2026");
        expect(result.current.isEditMode.fundingPage).toBe(false);

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(result.current.isEditMode.fundingPage).toBe(true);
        expect(result.current.modalProps.showModal).toBe(false);

        act(() => {
            result.current.resetWelcomeModal();
        });

        expect(result.current.isEditMode.fundingPage).toBe(false);
        expect(result.current.modalProps.showModal).toBe(false);
    });

    it("returns safe defaults when CAN data is missing", () => {
        useGetCanByIdQueryMock.mockReturnValueOnce({ data: undefined, isLoading: false });
        useGetCanFundingQueryMock.mockImplementation(() => ({ data: undefined, isLoading: false }));

        const { result } = renderHook(() => useCan());

        expect(result.current.can).toBeNull();
        expect(result.current.canNumber).toBe("TBD");
        expect(result.current.budgetLineItemsByFiscalYear).toEqual([]);
        expect(result.current.fundingReceivedByFiscalYear).toEqual([]);
        expect(result.current.totalFunding).toBe(0);
        expect(result.current.carryForwardFunding).toBe(0);
        expect(result.current.currentFiscalYearFundingId).toBeUndefined();
    });
});
