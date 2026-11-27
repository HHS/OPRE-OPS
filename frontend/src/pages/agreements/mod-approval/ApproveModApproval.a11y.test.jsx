import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    useGetAgreementByIdQuery,
    useGetAgreementContractModificationsByIdQuery,
    useReviewContractModificationMutation
} from "../../../api/opsAPI";
import { setupStore } from "../../../store";
import Alert from "../../../components/UI/Alert/Alert";
import { ApproveModApproval } from "./ApproveModApproval";

// Unlike ApproveModApproval.test.jsx, this file does NOT mock the page's own hooks module --
// it exercises the real useApproveModApproval -> useContractModificationReview chain, with a
// real (unmocked) Alert fed by Redux, so an ARIA-role regression on the outcome alert (the
// OPS-6479 class of bug: a mocked setAlert can pass forever while the DOM has no accessible
// role at all) would actually be caught here.
vi.mock("../../../api/opsAPI", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useGetAgreementByIdQuery: vi.fn(),
        useGetAgreementContractModificationsByIdQuery: vi.fn(),
        useGetServicesComponentsListQuery: vi.fn(() => ({ data: [] })),
        useGetGrantNumbersListQuery: vi.fn(() => ({ data: [] })),
        useReviewContractModificationMutation: vi.fn()
    };
});

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "Basic User"
}));

vi.mock("../../../App", () => ({
    default: (/** @type {{ children: React.ReactNode }} */ { children }) => <div data-testid="app">{children}</div>
}));

vi.mock("../../../components/Agreements/AgreementMetaAccordion", () => ({
    default: () => <div data-testid="agreement-meta-accordion" />
}));

vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    default: () => <div data-testid="agreement-can-review-accordion" />
}));

vi.mock("../pre-award-approval/BudgetLinesReviewAccordion", () => ({
    BudgetLinesReviewAccordion: () => <div data-testid="budget-lines-review-accordion" />
}));

vi.mock("../../../components/Agreements/ContractModificationEdits/ContractModificationEditCard", () => ({
    default: () => <div data-testid="edit-card" />
}));

const agreement = { id: 1, name: "Agreement B", display_name: "Agreement Name B", budget_line_items: [] };
const request = {
    id: 9,
    agreement_id: 1,
    status: "IN_REVIEW",
    can_review: true,
    requestor_notes: null,
    edits: [],
    budget_line_items: []
};

const mockReview = vi.fn();

const renderPageWithRealAlert = () => {
    const store = setupStore({});
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/agreements/1/review-modification"]}>
                <Alert />
                <Routes>
                    <Route
                        path="/agreements/:id/review-modification"
                        element={<ApproveModApproval />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
};

describe("ApproveModApproval + Alert (real Redux alert, not mocked)", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    beforeEach(() => {
        useGetAgreementByIdQuery.mockReturnValue({ data: agreement, isLoading: false });
        useGetAgreementContractModificationsByIdQuery.mockReturnValue({ data: [request], isLoading: false });
    });

    it('gives the Decline outcome an accessible role="alert" live region', async () => {
        const unwrap = vi.fn().mockResolvedValue({});
        mockReview.mockReturnValue({ unwrap });
        useReviewContractModificationMutation.mockReturnValue([mockReview, { isLoading: false }]);

        renderPageWithRealAlert();
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

        renderPageWithRealAlert();
        await userEvent.click(screen.getByRole("button", { name: "Approve modification" }));
        const confirmButtons = screen.getAllByRole("button", { name: "Approve" });
        await userEvent.click(confirmButtons[confirmButtons.length - 1]);

        const status = await screen.findByRole("status");
        expect(status).toHaveTextContent("Agreement Approved for Contract Modification");
    });
});
