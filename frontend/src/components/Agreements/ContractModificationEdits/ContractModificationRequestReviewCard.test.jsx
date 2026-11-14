import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import ContractModificationRequestReviewCard from "./ContractModificationRequestReviewCard";

const mockReview = vi.fn();
const mockSetAlert = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useReviewContractModificationMutation: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: (id) => (id ? `CAN-${id}` : "unknown")
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: mockSetAlert })
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

const BUDGET_LINE_SUMMARY = {
    id: 123459,
    line_description: "Research support",
    // Distinct from AMOUNT_EDIT's old/new values above, so the two cards' formatted amounts
    // don't collide in a getByText query.
    amount: "250000.00",
    fiscal_year: 2044,
    can_display_name: "G994426"
};

const baseRequest = {
    id: 9,
    requestor_notes: null,
    edits: [],
    budget_line_item_ids: [],
    budget_line_items: []
};

const renderCard = (request = {}) =>
    render(<ContractModificationRequestReviewCard request={{ ...baseRequest, ...request }} />);

describe("ContractModificationRequestReviewCard", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the submitter's notes, bundled edits, and selected budget lines with their amount/CAN/FY", () => {
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard({
            requestor_notes: "Please review by Friday",
            edits: [AMOUNT_EDIT],
            budget_line_item_ids: [123459],
            budget_line_items: [BUDGET_LINE_SUMMARY]
        });

        expect(screen.getByText("Please review by Friday")).toBeInTheDocument();
        expect(screen.getByText("123458")).toBeInTheDocument(); // the bundled edit's BL ID
        // The budget line to execute, now shown with enough detail to actually review it
        // (OPS-1008 follow-up: previously only the bare id rendered).
        expect(screen.getByText("123459")).toBeInTheDocument();
        expect(screen.getByText("Research support")).toBeInTheDocument();
        expect(screen.getByText("G994426")).toBeInTheDocument();
        expect(screen.getByText("$250,000.00")).toBeInTheDocument();
        expect(screen.getByText("2044")).toBeInTheDocument();
    });

    it("approves: confirming the modal calls the mutation with APPROVE and the typed notes, and alerts success", async () => {
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
        // This card unmounts once the request leaves IN_REVIEW, so the Director's only confirmation that
        // anything happened is this page-level alert (OPS-6479 follow-up: previously there was none).
        await vi.waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith(
                expect.objectContaining({ type: "success", heading: "Contract Modification Approved" })
            )
        );
    });

    const COR_EDIT = {
        ...AMOUNT_EDIT,
        id: 2,
        modification_type: "ADMIN_CHANGE",
        budget_line_item_id: null,
        field: "project_officer_id",
        old_value: 503,
        new_value: 512,
        old_display_name: "Chris Fortunato",
        new_display_name: "Tim Donaworth",
        change_request_id: null
    };

    it.each([
        [
            "budget lines only",
            { budget_line_items: [BUDGET_LINE_SUMMARY] },
            "The selected budget lines have been moved to Executing."
        ],
        [
            "a COR change and budget lines",
            { edits: [COR_EDIT], budget_line_items: [BUDGET_LINE_SUMMARY] },
            "The selected budget lines have been moved to Executing."
        ],
        // The COR changed when it was saved (#3269), so a COR-only approval changes nothing else.
        ["a COR change only", { edits: [COR_EDIT] }, "The Contract Modification has been approved."],
        ["other edits only", { edits: [AMOUNT_EDIT] }, "The Contract Modification has been approved."]
    ])("approving %s says what the approval changed", async (_, request, message) => {
        mockReview.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard(request);
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        await vi.waitFor(() => expect(mockSetAlert).toHaveBeenCalledWith(expect.objectContaining({ message })));
    });

    it("disables Approve/Decline after a successful review, closing the window before the refetch unmounts the card", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        // The mocked hook reports isLoading: false throughout — matching the real gap this
        // guards: RTK Query's own isLoading flips back to false as soon as the mutation
        // resolves, before the refetch that removes this card (now out of IN_REVIEW) lands.
        // Without the component's own "just succeeded" state, both buttons would re-enable
        // here and a second click could submit a duplicate review (OPS-1008 follow-up).
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        await vi.waitFor(() => expect(mockReview).toHaveBeenCalledTimes(1));
        expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Decline" })).toBeDisabled();
    });

    it("declines: confirming the modal calls the mutation with DECLINE, and alerts the outcome", async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Decline" }));
        // The confirmation modal's own "Decline" action button confirms the review.
        const confirmButtons = screen.getAllByRole("button", { name: "Decline" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(mockReview).toHaveBeenCalledWith({ requestId: 9, action: "DECLINE", reviewerNotes: null });
        await vi.waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error", heading: "Contract Modification Declined" })
            )
        );
    });

    it("shows an inline error when the review fails", async () => {
        const unwrap = vi.fn().mockRejectedValue({
            data: {
                message: "Validation failed",
                errors: { budget_line_item_ids: ["Budget line 123459 changed after this request was sent."] }
            }
        });
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCard();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        expect(await screen.findByText(/changed after this request was sent/i)).toBeInTheDocument();
    });
});
