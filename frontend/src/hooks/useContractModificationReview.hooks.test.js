import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useReviewContractModificationMutation } from "../api/opsAPI";
import useContractModificationReview from "./useContractModificationReview.hooks";

const mockReview = vi.fn();
const mockSetAlert = vi.fn();

vi.mock("../api/opsAPI", () => ({
    useReviewContractModificationMutation: vi.fn()
}));

vi.mock("./use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: mockSetAlert })
}));

vi.mock("../helpers/scrollToTop.helper", () => ({
    scrollToTop: vi.fn()
}));

const baseRequest = { id: 9, budget_line_items: [] };

describe("useContractModificationReview", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("handleReview opens the modal without calling the mutation until confirmed", () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);
        const { result } = renderHook(() => useContractModificationReview(baseRequest));

        act(() => {
            result.current.handleReview("APPROVE");
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.heading).toBe("Are you sure you want to approve this Contract Modification?");
        expect(mockReview).not.toHaveBeenCalled();
    });

    it("confirming APPROVE calls the mutation and alerts the approval copy for an execute-only request", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);
        const request = { id: 9, budget_line_items: [{ id: 1 }] };
        const { result } = renderHook(() => useContractModificationReview(request));

        act(() => {
            result.current.handleReview("APPROVE", "Looks fine");
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "APPROVE", reviewerNotes: "Looks fine" });
        await waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "success",
                heading: "Contract Modification Approved",
                message: "The selected budget lines have been moved to Executing."
            })
        );
    });

    it("confirming DECLINE calls the mutation with null notes by default and alerts the decline", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);
        const { result } = renderHook(() => useContractModificationReview(baseRequest));

        act(() => {
            result.current.handleReview("DECLINE");
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "DECLINE", reviewerNotes: null });
        await waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Contract Modification Declined",
                message: "This Contract Modification has been declined and returned to the submitter."
            })
        );
    });

    it("sets submitError when the mutation rejects", async () => {
        const unwrap = vi.fn().mockRejectedValue({ data: { error: "Budget line changed" } });
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);
        const { result } = renderHook(() => useContractModificationReview(baseRequest));

        act(() => {
            result.current.handleReview("APPROVE");
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        await waitFor(() => expect(result.current.submitError).toBeTruthy());
    });
});
