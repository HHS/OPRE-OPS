import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewContractModificationMutation } from "../../../api/opsAPI";
import { renderWithProviders } from "../../../test-utils";
import Alert from "../../UI/Alert/Alert";
import ContractModificationRequestReviewCard from "./ContractModificationRequestReviewCard";

const mockReview = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useReviewContractModificationMutation: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: (id) => (id ? `CAN-${id}` : "unknown")
}));

const baseRequest = {
    id: 9,
    requestor_notes: null,
    edits: [],
    budget_line_item_ids: []
};

// Unlike ContractModificationRequestReviewCard.test.jsx, this file does NOT mock
// use-alert.hooks — setAlert dispatches to a real Redux store, and the real Alert
// component (not a mock) renders from it. This is the only way to catch an ARIA-role
// regression on the alert `type` passed to setAlert: a mocked setAlert can assert the
// call args forever while the resulting DOM has no accessible role at all (exactly how
// the OPS-6479 follow-up bug — "warning" never announced to screen readers — shipped
// with a passing test suite).
const renderCardWithRealAlert = (request = {}) =>
    renderWithProviders(
        <>
            <Alert />
            <ContractModificationRequestReviewCard request={{ ...baseRequest, ...request }} />
        </>
    );

describe("ContractModificationRequestReviewCard + Alert (real Redux alert, not mocked)", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('gives the Decline outcome an accessible role="alert" live region', async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCardWithRealAlert();
        await userEvent.click(screen.getByRole("button", { name: "Decline" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Decline" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("Contract Modification Declined");
    });

    it('gives the Approve outcome an accessible role="status" live region', async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderCardWithRealAlert();
        await userEvent.click(screen.getByRole("button", { name: "Approve" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        const status = await screen.findByRole("status");
        expect(status).toHaveTextContent("Contract Modification Approved");
    });
});
