import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useStartModification from "./StartModification.hooks";

const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const submitMock = vi.fn();
const queries = {};

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

vi.mock("../../../api/opsAPI", () => ({
    useGetVersionQuery: () => queries.version,
    useGetAgreementByIdQuery: () => queries.agreement,
    useGetAgreementAwardHistoryByIdQuery: () => queries.awardHistory,
    useGetServicesComponentsListQuery: () => queries.servicesComponents,
    useGetAgreementContractModificationEditsByIdQuery: () => queries.edits,
    useGetAgreementContractModificationsByIdQuery: () => queries.requests,
    useSubmitContractModificationMutation: () => [submitMock, { isLoading: false }]
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/user.hooks", () => ({ __esModule: true, default: () => "Name" }));

const today = new Date().toISOString().slice(0, 10);
// API shape: budget lines carry services_component_id, not the number the page groups by.
const EXECUTABLE = { id: 1, status: "PLANNED", date_needed: today, services_component_id: 9, in_review: false };
const DRAFT = { id: 2, status: "DRAFT", date_needed: today, services_component_id: 9, in_review: false };
const OTHER_SC = { id: 3, status: "PLANNED", date_needed: today, services_component_id: 10, in_review: false };
const AGREEMENT = {
    id: 42,
    is_awarded: true,
    _meta: { isEditable: true },
    budget_line_items: [EXECUTABLE, DRAFT, OTHER_SC]
};

const setQueries = ({ edits = [], requests = [], awardHistory = [] } = {}) => {
    queries.version = { data: { enable_modified_loe_edits: true }, isLoading: false };
    queries.agreement = { data: AGREEMENT, isLoading: false };
    queries.servicesComponents = {
        data: [
            { id: 9, number: 1 },
            { id: 10, number: 2 }
        ]
    };
    queries.edits = { data: edits };
    queries.requests = { data: requests, isLoading: false };
    queries.awardHistory = { data: awardHistory };
};

describe("useStartModification", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setQueries();
    });

    it("marks only Planned current-FY budget lines selectable, with a reason for the rest", async () => {
        const { result } = renderHook(() => useStartModification(42));

        await waitFor(() => expect(result.current.budgetLines).toHaveLength(3));
        const [executable, draft] = result.current.budgetLines;
        expect(executable).toMatchObject({ actionable: true, disabledReason: null });
        expect(draft.actionable).toBe(false);
        expect(draft.disabledReason).toMatch(/Only Budget Lines in Planned Status/);
    });

    it("can't be submitted with nothing to modify", async () => {
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(3));

        expect(result.current.isSubmissionReady).toBe(false);
    });

    it("selecting all in a services component selects only that group's selectable budget lines", async () => {
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(3));

        act(() => result.current.toggleSelectActionableBLIs(1));

        expect(result.current.selectedBudgetLines.map((bli) => bli.id)).toEqual([1]);
        expect(result.current.isSubmissionReady).toBe(true);
    });

    it("sends the selected budget lines and notes, then returns to the Award & Modifications tab", async () => {
        submitMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(3));

        act(() => {
            result.current.handleSelectBLI(1);
            result.current.setNotes("Please review");
        });
        await act(() => result.current.handleSendToApproval());

        expect(submitMock).toHaveBeenCalledWith({
            agreementId: 42,
            budgetLineItemIds: [1],
            requestorNotes: "Please review"
        });
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Contract Modification Sent to Approval",
                redirectUrl: "/agreements/42/award-modifications"
            })
        );
    });

    it("shows an error alert when sending fails", async () => {
        setQueries({ edits: [{ id: 5, modification_type: "MODIFIED_LOE" }] });
        submitMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("400")) });
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.isSubmissionReady).toBe(true));

        await act(() => result.current.handleSendToApproval());

        expect(setAlertMock).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });

    it("includes Admin Changes such as a COR change in the modification (#3269)", async () => {
        const loeEdit = { id: 7, modification_type: "MODIFIED_LOE", field: "amount" };
        const corEdit = { id: 8, modification_type: "ADMIN_CHANGE", field: "project_officer_id" };
        setQueries({ edits: [loeEdit, corEdit] });
        const { result } = renderHook(() => useStartModification(42));

        await waitFor(() => expect(result.current.budgetLines).toHaveLength(3));
        expect(result.current.edits).toEqual([loeEdit, corEdit]);
    });

    it("can be submitted with only a COR change pending and no budget lines (#3269)", async () => {
        setQueries({ edits: [{ id: 8, modification_type: "ADMIN_CHANGE", field: "project_officer_id" }] });
        submitMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
        const { result } = renderHook(() => useStartModification(42));

        await waitFor(() => expect(result.current.isSubmissionReady).toBe(true));
        await act(() => result.current.handleSendToApproval());

        expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({ budgetLineItemIds: [] }));
        expect(setAlertMock).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    });

    it("gives the agreement details the original award, not a later modification (#3269)", () => {
        const award = { fiscal_year_label: "FY 2044 Award", award_amount: "1500000.00" };
        const modification = { fiscal_year_label: "FY 2045 Mod 1", award_amount: "250000.00" };
        setQueries({ awardHistory: [award, modification] });

        const { result } = renderHook(() => useStartModification(42));

        expect(result.current.awardRecord).toBe(award);
    });

    it("gives the Award Total the Agreement Total card's total: non-Draft budget lines plus fees (#3269)", () => {
        setQueries();
        queries.agreement = {
            data: {
                ...AGREEMENT,
                procurement_shop: { abbr: "GCS", fee_percentage: 5 },
                budget_line_items: [
                    { ...EXECUTABLE, amount: 1000 },
                    { ...DRAFT, amount: 500 },
                    { ...OTHER_SC, amount: 2000 }
                ]
            },
            isLoading: false
        };

        const { result } = renderHook(() => useStartModification(42));

        // (1000 + 2000) + 5% fees; the Draft line isn't counted, as on the card
        expect(result.current.awardTotal).toBe(3150);
    });

    it("gives an empty award record when the award history is empty, so the award fields show TBD", () => {
        const { result } = renderHook(() => useStartModification(42));

        expect(result.current.awardRecord).toEqual({});
    });

    it("isn't ready until the award history has loaded", () => {
        queries.awardHistory = { data: undefined, isLoading: true };

        const { result } = renderHook(() => useStartModification(42));

        expect(result.current.isPageReady).toBe(false);
    });

    it("can't start while a modification is in review", () => {
        setQueries({ requests: [{ id: 9, status: "IN_REVIEW" }] });
        const { result } = renderHook(() => useStartModification(42));

        expect(result.current.canStartModification).toBe(false);
    });
});
