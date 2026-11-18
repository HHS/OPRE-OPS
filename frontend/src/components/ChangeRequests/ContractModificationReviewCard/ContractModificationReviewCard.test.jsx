import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import ContractModificationReviewCard from "./ContractModificationReviewCard";

const mockReview = vi.fn();
const mockSetAlert = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useReviewContractModificationMutation: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: () => "Agreement Name B"
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "Sheila Celentano"
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: mockSetAlert })
}));

const baseRequest = {
    id: 9,
    agreement_id: 42,
    created_by: 503,
    created_on: "2026-11-17",
    modification_type: "MODIFIED_LOE",
    budget_line_items: []
};

const renderCard = (request = {}) =>
    render(<ContractModificationReviewCard request={{ ...baseRequest, ...request }} />);

describe("ContractModificationReviewCard", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders Agreement, Modification Type, Requested by, and the request date", () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();

        expect(screen.getByText("Contract Modification")).toBeInTheDocument();
        expect(screen.getByText("Agreement Name B")).toBeInTheDocument();
        expect(screen.getByText("Modified LOE")).toBeInTheDocument();
        expect(screen.getByText("Sheila Celentano")).toBeInTheDocument();
    });

    it("has no 'Review agreement' link or detail view -- the icons are the only interaction (#6546)", () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();

        expect(screen.queryByText(/review agreement/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("approving opens a confirmation modal without calling the mutation until confirmed", async () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));

        expect(mockReview).not.toHaveBeenCalled();
        expect(screen.getByText("Are you sure you want to approve this Contract Modification?")).toBeInTheDocument();
    });

    it("confirming Approve calls the mutation with no reviewer notes and alerts success", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "APPROVE", reviewerNotes: null });
        await vi.waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith(
                expect.objectContaining({ type: "success", heading: "Contract Modification Approved" })
            )
        );
    });

    it("confirming Decline calls the mutation with DECLINE and alerts the decline", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Decline" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Decline" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "DECLINE", reviewerNotes: null });
        await vi.waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error", heading: "Contract Modification Declined" })
            )
        );
    });
});
