import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import ContractModificationRequestReviewCard from "./ContractModificationRequestReviewCard";

const mockReview = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useReviewContractModificationMutation: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: (id) => (id ? `CAN-${id}` : "unknown")
}));

const AMOUNT_EDIT = {
    id: 1,
    agreement_id: 42,
    modification_type: "MODIFIED_LOE",
    budget_line_item_id: 123458,
    field: "amount",
    old_value: 600000.0,
    new_value: 500000.0,
    requested_by: { id: 521, full_name: "First Last Name" },
    requested_on: "2024-12-01T14:03:00",
    change_request_id: 512,
    agreement_mod_id: null
};

const baseRequest = {
    id: 9,
    requestor_notes: null,
    edits: [],
    budget_line_item_ids: []
};

const renderCard = (request = {}) =>
    render(<ContractModificationRequestReviewCard request={{ ...baseRequest, ...request }} />);

describe("ContractModificationRequestReviewCard", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the submitter's notes, bundled edits, and selected budget lines", () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard({
            requestor_notes: "Please review by Friday",
            edits: [AMOUNT_EDIT],
            budget_line_item_ids: [123459]
        });

        expect(screen.getByText("Please review by Friday")).toBeInTheDocument();
        expect(screen.getByText("123458")).toBeInTheDocument(); // the bundled edit's BL ID
        expect(screen.getByText("123459")).toBeInTheDocument(); // the budget line to execute
    });

    it("approves: confirming the modal calls the mutation with APPROVE and the typed notes", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.type(screen.getByLabelText(/Notes/i), "Looks good");
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        // The confirmation modal's own "Approve" action button confirms the review.
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "APPROVE", reviewerNotes: "Looks good" });
    });

    it("declines: confirming the modal calls the mutation with DECLINE", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Decline" }));
        // The confirmation modal's own "Decline" action button confirms the review.
        const confirmButtons = screen.getAllByRole("button", { name: "Decline" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "DECLINE", reviewerNotes: null });
    });

    it("shows an inline error when the review fails", async () => {
        const unwrap = vi
            .fn()
            .mockRejectedValue({ data: { error: "Budget line 123459 changed after this request was sent." } });
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(await screen.findByText(/changed after this request was sent/i)).toBeInTheDocument();
    });
});
