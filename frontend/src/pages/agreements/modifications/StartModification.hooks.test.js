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
const EXECUTABLE = { id: 1, status: "PLANNED", date_needed: today, services_component_number: 1, in_review: false };
const DRAFT = { id: 2, status: "DRAFT", date_needed: today, services_component_number: 1, in_review: false };
const AGREEMENT = { id: 42, is_awarded: true, _meta: { isEditable: true }, budget_line_items: [EXECUTABLE, DRAFT] };

const setQueries = ({ edits = [], requests = [] } = {}) => {
    queries.version = { data: { enable_modified_loe_edits: true }, isLoading: false };
    queries.agreement = { data: AGREEMENT, isLoading: false };
    queries.servicesComponents = { data: [{ id: 9, number: 1 }] };
    queries.edits = { data: edits };
    queries.requests = { data: requests, isLoading: false };
};

describe("useStartModification", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setQueries();
    });

    it("marks only Planned current-FY budget lines selectable, with a reason for the rest", async () => {
        const { result } = renderHook(() => useStartModification(42));

        await waitFor(() => expect(result.current.budgetLines).toHaveLength(2));
        const [executable, draft] = result.current.budgetLines;
        expect(executable).toMatchObject({ actionable: true, disabledReason: null });
        expect(draft.actionable).toBe(false);
        expect(draft.disabledReason).toMatch(/Only Budget Lines in Planned Status/);
    });

    it("can't be submitted with nothing to modify", async () => {
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(2));

        expect(result.current.isSubmissionReady).toBe(false);
    });

    it("selecting all in a services component selects only the selectable budget lines", async () => {
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(2));

        act(() => result.current.toggleSelectActionableBLIs(1));

        expect(result.current.selectedBudgetLines.map((bli) => bli.id)).toEqual([1]);
        expect(result.current.isSubmissionReady).toBe(true);
    });

    it("sends the selected budget lines and notes, then returns to the Award & Modifications tab", async () => {
        submitMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.budgetLines).toHaveLength(2));

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
        setQueries({ edits: [{ id: 5 }] });
        submitMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("400")) });
        const { result } = renderHook(() => useStartModification(42));
        await waitFor(() => expect(result.current.isSubmissionReady).toBe(true));

        await act(() => result.current.handleSendToApproval());

        expect(setAlertMock).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });

    it("can't start while a modification is in review", () => {
        setQueries({ requests: [{ id: 9, status: "IN_REVIEW" }] });
        const { result } = renderHook(() => useStartModification(42));

        expect(result.current.canStartModification).toBe(false);
    });
});
