import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCanFunding from "./CanFunding.hooks";

const setAlertMock = vi.fn();
const toggleEditModeMock = vi.fn();
const resetWelcomeModalMock = vi.fn();
const scrollToTopMock = vi.fn();
const useSelectorMock = vi.fn();
const cryptoRandomStringMock = vi.fn();

const addCanFundingBudgetMock = vi.fn();
const updateCanFundingBudgetMock = vi.fn();
const addCanFundingReceivedMock = vi.fn();
const updateCanFundingReceivedMock = vi.fn();
const deleteCanFundingReceivedMock = vi.fn();

const useAddCanFundingBudgetsMutationMock = vi.fn();
const useUpdateCanFundingBudgetMutationMock = vi.fn();
const useAddCanFundingReceivedMutationMock = vi.fn();
const useUpdateCanFundingReceivedMutationMock = vi.fn();
const useDeleteCanFundingReceivedMutationMock = vi.fn();

vi.mock("crypto-random-string", () => ({
    __esModule: true,
    default: (...args) => cryptoRandomStringMock(...args)
}));

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("../../../api/opsAPI.js", () => ({
    useAddCanFundingBudgetsMutation: (...args) => useAddCanFundingBudgetsMutationMock(...args),
    useUpdateCanFundingBudgetMutation: (...args) => useUpdateCanFundingBudgetMutationMock(...args),
    useAddCanFundingReceivedMutation: (...args) => useAddCanFundingReceivedMutationMock(...args),
    useUpdateCanFundingReceivedMutation: (...args) => useUpdateCanFundingReceivedMutationMock(...args),
    useDeleteCanFundingReceivedMutation: (...args) => useDeleteCanFundingReceivedMutationMock(...args)
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../helpers/scrollToTop.helper.js", () => ({
    scrollToTop: () => scrollToTopMock()
}));

vi.mock("../../../helpers/utils.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getCurrentFiscalYear: () => 2026
    };
});

const baseFundingReceived = [
    { id: 5, funding: 250, notes: "Initial", fiscal_year: 2026 },
    { id: 6, funding: 125, notes: "Keep", fiscal_year: 2026 }
];

const renderUseCanFunding = (overrides = {}) => {
    const args = {
        canId: 1,
        canNumber: "CAN-001",
        totalFunding: 1000,
        fiscalYear: 2026,
        isBudgetTeamMember: true,
        isEditMode: false,
        toggleEditMode: toggleEditModeMock,
        resetWelcomeModal: resetWelcomeModalMock,
        receivedFunding: 375,
        fundingReceived: baseFundingReceived,
        currentFiscalYearFundingId: 9,
        isExpired: false,
        ...overrides
    };

    return renderHook(() =>
        useCanFunding(
            args.canId,
            args.canNumber,
            args.totalFunding,
            args.fiscalYear,
            args.isBudgetTeamMember,
            args.isEditMode,
            args.toggleEditMode,
            args.resetWelcomeModal,
            args.receivedFunding,
            args.fundingReceived,
            args.currentFiscalYearFundingId,
            args.isExpired
        )
    );
};

describe("useCanFunding", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cryptoRandomStringMock.mockReturnValueOnce("abc").mockReturnValueOnce("def");

        useSelectorMock.mockImplementation((selector) =>
            selector({
                auth: {
                    activeUser: {
                        full_name: "Pat Budget"
                    }
                }
            })
        );

        addCanFundingBudgetMock.mockReturnValue({ unwrap: () => Promise.resolve({ ok: true }) });
        updateCanFundingBudgetMock.mockReturnValue({ unwrap: () => Promise.resolve({ ok: true }) });
        addCanFundingReceivedMock.mockResolvedValue({ ok: true });
        updateCanFundingReceivedMock.mockResolvedValue({ ok: true });
        deleteCanFundingReceivedMock.mockResolvedValue({ ok: true });

        useAddCanFundingBudgetsMutationMock.mockReturnValue([addCanFundingBudgetMock]);
        useUpdateCanFundingBudgetMutationMock.mockReturnValue([updateCanFundingBudgetMock]);
        useAddCanFundingReceivedMutationMock.mockReturnValue([addCanFundingReceivedMock]);
        useUpdateCanFundingReceivedMutationMock.mockReturnValue([updateCanFundingReceivedMock]);
        useDeleteCanFundingReceivedMutationMock.mockReturnValue([deleteCanFundingReceivedMock]);
    });

    it("shows edit controls for the current fiscal year and updates the budget locally", () => {
        const { result } = renderUseCanFunding();

        expect(result.current.showButton).toBe(true);

        act(() => {
            result.current.handleEnteredBudgetAmount("1200");
        });

        act(() => {
            result.current.handleAddBudget({ preventDefault: vi.fn() });
        });

        expect(result.current.budgetForm).toEqual({ submittedAmount: 1200, isSubmitted: true });
        expect(result.current.budgetEnteredAmount).toBe("");
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "FY Budget Updated"
            })
        );
    });

    it("adds and edits funding received entries while recalculating totals", () => {
        const { result } = renderUseCanFunding({ isEditMode: true });

        act(() => {
            result.current.handleEnteredFundingReceivedAmount("100");
            result.current.handleEnteredNotes("New money");
        });

        act(() => {
            result.current.handleAddFundingReceived({ preventDefault: vi.fn() });
        });

        expect(result.current.totalReceived).toBe(475);
        expect(result.current.enteredFundingReceived).toHaveLength(3);
        expect(result.current.enteredFundingReceived[2]).toMatchObject({
            id: "TBD",
            tempId: "temp-abc",
            notes: "New money",
            funding: "100",
            created_by_user: { full_name: "Pat Budget" }
        });

        act(() => {
            result.current.populateFundingReceivedForm("temp-abc");
        });

        expect(result.current.fundingReceivedForm.isEditing).toBe(true);
        expect(result.current.fundingReceivedEnteredAmount).toBe("100");

        act(() => {
            result.current.handleEnteredFundingReceivedAmount("175");
            result.current.handleEnteredNotes("Updated money");
        });

        act(() => {
            result.current.handleAddFundingReceived({ preventDefault: vi.fn() });
        });

        expect(result.current.totalReceived).toBe(550);
        expect(result.current.enteredFundingReceived).toHaveLength(3);
        expect(result.current.enteredFundingReceived[2]).toMatchObject({
            tempId: "temp-abc",
            notes: "Updated money",
            funding: "175"
        });
    });

    it("deletes persisted funding entries through the modal confirm path", () => {
        const { result } = renderUseCanFunding({ isEditMode: true });

        act(() => {
            result.current.deleteFundingReceived(5);
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.heading).toContain("delete this funding received");

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(result.current.enteredFundingReceived.map((item) => item.id)).toEqual([6]);
        expect(result.current.deletedFundingReceivedIds).toEqual([5]);
        expect(result.current.totalReceived).toBe(125);
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Funding Received Deleted"
            })
        );
    });

    it("submits budget, funding received, and deletions before cleaning up on success", async () => {
        const { result } = renderUseCanFunding({ isEditMode: true });

        act(() => {
            result.current.handleEnteredBudgetAmount("1200");
        });

        act(() => {
            result.current.handleAddBudget({ preventDefault: vi.fn() });
        });

        act(() => {
            result.current.handleEnteredFundingReceivedAmount("100");
            result.current.handleEnteredNotes("Added row");
        });

        act(() => {
            result.current.handleAddFundingReceived({ preventDefault: vi.fn() });
        });

        await waitFor(() => {
            expect(result.current.enteredFundingReceived).toHaveLength(3);
        });

        act(() => {
            result.current.populateFundingReceivedForm(5);
        });

        act(() => {
            result.current.handleEnteredFundingReceivedAmount("275");
            result.current.handleEnteredNotes("Adjusted row");
        });

        act(() => {
            result.current.handleAddFundingReceived({ preventDefault: vi.fn() });
        });

        await waitFor(() => {
            expect(result.current.enteredFundingReceived.find((item) => item.id === 5)?.funding).toBe("275");
        });

        act(() => {
            result.current.deleteFundingReceived(6);
        });

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(updateCanFundingBudgetMock).toHaveBeenCalledWith({
            id: 9,
            data: {
                fiscal_year: 2026,
                can_id: 1,
                budget: 1200
            }
        });
        expect(addCanFundingReceivedMock).toHaveBeenCalledWith({
            data: {
                fiscal_year: 2026,
                can_id: 1,
                funding: "100",
                notes: "Added row"
            }
        });
        expect(updateCanFundingReceivedMock).toHaveBeenCalledWith({
            id: 5,
            data: {
                fiscal_year: 2026,
                can_id: 1,
                funding: "275",
                notes: "Adjusted row"
            }
        });
        expect(deleteCanFundingReceivedMock).toHaveBeenCalledWith(6);

        await waitFor(() => {
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "success",
                    heading: "CAN Updated"
                })
            );
        });

        expect(toggleEditModeMock).toHaveBeenCalledTimes(1);
        expect(resetWelcomeModalMock).toHaveBeenCalledTimes(1);
        expect(scrollToTopMock).toHaveBeenCalledTimes(1);
        expect(result.current.enteredFundingReceived).toEqual(baseFundingReceived);
        expect(result.current.deletedFundingReceivedIds).toEqual([]);
        expect(result.current.showModal).toBe(false);
    });

    it("shows an error alert and still cleans up when submit fails", async () => {
        updateCanFundingBudgetMock.mockReturnValueOnce({
            unwrap: () => Promise.reject(new Error("budget failed"))
        });

        const { result } = renderUseCanFunding({ isEditMode: true });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        await waitFor(() => {
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "error",
                    heading: "Error",
                    redirectUrl: "/error"
                })
            );
        });

        expect(toggleEditModeMock).toHaveBeenCalledTimes(1);
        expect(resetWelcomeModalMock).toHaveBeenCalledTimes(1);
        expect(scrollToTopMock).toHaveBeenCalledTimes(1);
    });
});
