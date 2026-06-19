import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";

const deleteBudgetLineItemMock = vi.fn();
const setAlertMock = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useDeleteBudgetLineItemMutation: () => [deleteBudgetLineItemMock]
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: setAlertMock })
}));

const budgetLines = [{ id: 1 }];

describe("useAllBudgetLinesTable handleDeleteBudgetLine", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const confirmDelete = (result) => {
        act(() => {
            result.current.handleDeleteBudgetLine(1);
        });
        return result.current.modalProps.handleConfirm;
    };

    it("shows the immediate-delete alert on a 200 response", async () => {
        deleteBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({ statusCode: 200 }) });
        const { result } = renderHook(() => useAllBudgetLinesTable(budgetLines));

        const handleConfirm = confirmDelete(result);
        await act(async () => {
            await handleConfirm();
        });

        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success", heading: "Budget Line Deleted" })
        );
    });

    it("shows the sent-to-approval alert on a 202 response", async () => {
        deleteBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({ statusCode: 202 }) });
        const { result } = renderHook(() => useAllBudgetLinesTable(budgetLines));

        const handleConfirm = confirmDelete(result);
        await act(async () => {
            await handleConfirm();
        });

        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success", heading: "Changes Sent to Approval" })
        );
    });

    it("shows an error alert when the delete fails", async () => {
        deleteBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("boom")) });
        const { result } = renderHook(() => useAllBudgetLinesTable(budgetLines));

        const handleConfirm = confirmDelete(result);
        await act(async () => {
            await handleConfirm();
        });

        expect(setAlertMock).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });
});
