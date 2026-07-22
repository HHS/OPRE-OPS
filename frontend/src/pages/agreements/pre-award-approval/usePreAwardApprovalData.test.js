import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import usePreAwardApprovalData from "./usePreAwardApprovalData";

// Mock the API hooks
vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
    useGetDocumentsByAgreementIdQuery: vi.fn(),
    useGetProcurementTrackersByAgreementIdQuery: vi.fn()
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    groupByServicesComponent: vi.fn(),
    budgetLinesTotal: vi.fn()
}));

import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { groupByServicesComponent, budgetLinesTotal } from "../../../helpers/budgetLines.helpers";

describe("usePreAwardApprovalData", () => {
    const executingBli1 = { id: 1, status: "IN_EXECUTION" };
    const executingBli2 = { id: 2, status: "IN_EXECUTION" };
    const draftBli = { id: 3, status: "DRAFT" };
    const plannedBli = { id: 4, status: "PLANNED" };

    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        budget_line_items: [executingBli1, draftBli, executingBli2, plannedBli]
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useGetAgreementByIdQuery.mockReturnValue({ data: mockAgreement, isLoading: false });
        useGetServicesComponentsListQuery.mockReturnValue({ data: [] });
        useGetDocumentsByAgreementIdQuery.mockReturnValue({ data: { documents: [] } });
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({ data: { data: [] } });
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        groupByServicesComponent.mockReturnValue([]);
        budgetLinesTotal.mockReturnValue(0);
    });

    it("returns all budget lines regardless of status", () => {
        const { result } = renderHook(() => usePreAwardApprovalData(1));

        expect(result.current.allBudgetLines).toHaveLength(4);
    });

    it("returns only IN_EXECUTION budget lines in executingBudgetLines", () => {
        const { result } = renderHook(() => usePreAwardApprovalData(1));

        expect(result.current.executingBudgetLines).toEqual([executingBli1, executingBli2]);
    });

    it("groups only the executing budget lines for the executing grouping", () => {
        renderHook(() => usePreAwardApprovalData(1));

        // groupByServicesComponent is called for both all and executing groupings;
        // assert it was invoked with exactly the executing budget lines
        expect(groupByServicesComponent).toHaveBeenCalledWith([executingBli1, executingBli2], []);
    });

    it("computes the executing total from executing budget lines only", () => {
        renderHook(() => usePreAwardApprovalData(1));

        expect(budgetLinesTotal).toHaveBeenCalledWith([executingBli1, executingBli2]);
    });
});
