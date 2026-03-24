import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { ApprovePreAwardApproval } from "./ApprovePreAwardApproval";
import store from "../../../store";

// Mock the hooks
vi.mock("./ApprovePreAwardApproval.hooks", () => ({
    default: vi.fn()
}));

// Mock child components
vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app">{children}</div>
}));

vi.mock("../../../components/UI/PageHeader", () => ({
    default: ({ title, subTitle }) => (
        <div data-testid="page-header">
            <h1>{title}</h1>
            {subTitle && <p>{subTitle}</p>}
        </div>
    )
}));

vi.mock("../../../components/Agreements/AgreementMetaAccordion", () => ({
    default: () => <div data-testid="agreement-meta-accordion">Agreement Details</div>
}));

vi.mock("../../../components/Agreements/AgreementBLIAccordion", () => ({
    default: ({ children }) => <div data-testid="agreement-bli-accordion">{children}</div>
}));

vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    default: () => <div data-testid="agreement-can-review-accordion">CAN Review</div>
}));

vi.mock("../../../components/UI/Accordion", () => ({
    default: ({ heading, children }) => (
        <div data-testid={`accordion-${heading.toLowerCase().replace(/\s+/g, "-")}`}>
            <h2>{heading}</h2>
            {children}
        </div>
    )
}));

vi.mock("../../../components/UI/Form/TextArea", () => ({
    default: ({ value, onChange, disabled, maxLength }) => (
        <textarea
            data-testid="reviewer-notes-textarea"
            value={value}
            onChange={(e) => onChange("reviewer-notes", e.target.value)}
            disabled={disabled}
            maxLength={maxLength}
        />
    )
}));

vi.mock("../../../components/UI/Alert/SimpleAlert", () => ({
    default: ({ type, heading, message }) => (
        <div data-testid={`alert-${type}`}>
            <h3>{heading}</h3>
            <p>{message}</p>
        </div>
    )
}));

vi.mock("../../../components/UI/Modals/ConfirmationModal", () => ({
    default: ({ heading, actionButtonText, handleConfirm }) => (
        <div data-testid="confirmation-modal">
            <h3>{heading}</h3>
            <button onClick={handleConfirm}>{actionButtonText}</button>
        </div>
    )
}));

import useApprovePreAwardApproval from "./ApprovePreAwardApproval.hooks";

const mockHookData = {
    agreement: { id: 1, name: "Test Agreement", display_name: "Agreement 001" },
    isLoading: false,
    executingBudgetLines: [],
    reviewerNotes: "",
    setReviewerNotes: vi.fn(),
    requestorNotes: "Please review and approve",
    handleApprove: vi.fn(),
    handleDecline: vi.fn(),
    handleCancel: vi.fn(),
    projectOfficerName: "John Doe",
    alternateProjectOfficerName: "Jane Smith",
    servicesComponents: [],
    groupedBudgetLinesByServicesComponent: [],
    preAwardMemoDocuments: [],
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {},
    isSubmitting: false,
    submitError: "",
    hasPermission: true,
    approvalAlreadyProcessed: false
};

describe("ApprovePreAwardApproval", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (hookData = mockHookData) => {
        useApprovePreAwardApproval.mockReturnValue(hookData);

        return render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1/review-pre-award"]}>
                    <Routes>
                        <Route
                            path="/agreements/:id/review-pre-award"
                            element={<ApprovePreAwardApproval />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );
    };

    it("should render loading state", () => {
        renderComponent({ ...mockHookData, isLoading: true });
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render page with agreement details", () => {
        renderComponent();

        expect(screen.getByTestId("page-header")).toBeInTheDocument();
        expect(screen.getByText("Review Pre-Award Approval Request")).toBeInTheDocument();
        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-meta-accordion")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-bli-accordion")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-can-review-accordion")).toBeInTheDocument();
    });

    it("should show permission denied for unauthorized users", () => {
        renderComponent({ ...mockHookData, hasPermission: false });

        expect(screen.getByTestId("alert-error")).toBeInTheDocument();
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(
            screen.getByText("You do not have permission to review this pre-award approval request.")
        ).toBeInTheDocument();
    });

    it("should show already processed alert when approval status is set", () => {
        renderComponent({ ...mockHookData, approvalAlreadyProcessed: true });

        expect(screen.getByTestId("alert-info")).toBeInTheDocument();
        expect(screen.getByText("Already Processed")).toBeInTheDocument();
        expect(screen.getByText("This pre-award approval request has already been processed.")).toBeInTheDocument();
    });

    it("should display submitter notes in read-only section", () => {
        renderComponent();

        expect(screen.getByText("Submitter's Notes")).toBeInTheDocument();
        expect(screen.getByText("Please review and approve")).toBeInTheDocument();
    });

    it("should allow reviewer to enter notes", async () => {
        const user = userEvent.setup();
        const setReviewerNotes = vi.fn();
        renderComponent({ ...mockHookData, setReviewerNotes });

        const textarea = screen.getByTestId("reviewer-notes-textarea");
        await user.type(textarea, "Looks good");

        expect(setReviewerNotes).toHaveBeenCalledWith("Looks good");
    });

    it("should disable reviewer notes input when already processed", () => {
        renderComponent({ ...mockHookData, approvalAlreadyProcessed: true });

        const textarea = screen.getByTestId("reviewer-notes-textarea");
        expect(textarea).toBeDisabled();
    });

    it("should render action buttons", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    });

    it("should call handleApprove when Approve button is clicked", async () => {
        const user = userEvent.setup();
        const handleApprove = vi.fn();
        renderComponent({ ...mockHookData, handleApprove });

        const approveButton = screen.getByRole("button", { name: "Approve" });
        await user.click(approveButton);

        expect(handleApprove).toHaveBeenCalledTimes(1);
    });

    it("should call handleDecline when Decline button is clicked", async () => {
        const user = userEvent.setup();
        const handleDecline = vi.fn();
        renderComponent({ ...mockHookData, handleDecline });

        const declineButton = screen.getByRole("button", { name: "Decline" });
        await user.click(declineButton);

        expect(handleDecline).toHaveBeenCalledTimes(1);
    });

    it("should call handleCancel when Cancel button is clicked", async () => {
        const user = userEvent.setup();
        const handleCancel = vi.fn();
        renderComponent({ ...mockHookData, handleCancel });

        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        await user.click(cancelButton);

        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it("should disable action buttons while submitting", () => {
        renderComponent({ ...mockHookData, isSubmitting: true });

        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
    });

    it("should disable approve and decline buttons when already processed", () => {
        renderComponent({ ...mockHookData, approvalAlreadyProcessed: true });

        expect(screen.getByRole("button", { name: "Decline" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled();
    });

    it("should show confirmation modal when showModal is true", () => {
        renderComponent({
            ...mockHookData,
            showModal: true,
            modalProps: {
                heading: "Are you sure?",
                actionButtonText: "Approve",
                handleConfirm: vi.fn()
            }
        });

        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("should show error alert when submitError is present", () => {
        renderComponent({ ...mockHookData, submitError: "Failed to submit" });

        expect(screen.getByTestId("alert-error")).toBeInTheDocument();
        expect(screen.getByText("Action Failed")).toBeInTheDocument();
        expect(screen.getByText("Failed to submit")).toBeInTheDocument();
    });

    it("should display pre-award memo documents when present", () => {
        const documents = [
            { id: 1, document_name: "Final Memo.pdf", document_size: "2.5" },
            { id: 2, document_name: "Consensus.docx", document_size: "1.2" }
        ];

        renderComponent({ ...mockHookData, preAwardMemoDocuments: documents });

        expect(screen.getByTestId("accordion-final-consensus-memo")).toBeInTheDocument();
        expect(screen.getByText("Final Memo.pdf")).toBeInTheDocument();
        expect(screen.getByText("(2.5 MB)")).toBeInTheDocument();
        expect(screen.getByText("Consensus.docx")).toBeInTheDocument();
        expect(screen.getByText("(1.2 MB)")).toBeInTheDocument();
    });

    it("should not display memo section when no documents present", () => {
        renderComponent({ ...mockHookData, preAwardMemoDocuments: [] });

        expect(screen.queryByTestId("accordion-final-consensus-memo")).not.toBeInTheDocument();
    });

    it("should not display submitter notes section when notes are empty", () => {
        renderComponent({ ...mockHookData, requestorNotes: "" });

        expect(screen.queryByText("Submitter's Notes")).not.toBeInTheDocument();
    });
});
