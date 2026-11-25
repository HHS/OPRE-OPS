import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { ApproveModApproval } from "./ApproveModApproval";
import store from "../../../store";

vi.mock("./ApproveModApproval.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../App", () => ({
    default: (/** @type {{ children: React.ReactNode }} */ { children }) => <div data-testid="app">{children}</div>
}));

vi.mock("../../../components/UI/PageHeader", () => ({
    default: (/** @type {{ title: string; subTitle?: string }} */ { title, subTitle }) => (
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
    default: (/** @type {{ children: React.ReactNode }} */ { children }) => (
        <div data-testid="agreement-bli-accordion">{children}</div>
    )
}));

vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    default: () => <div data-testid="agreement-can-review-accordion">CAN Review</div>
}));

vi.mock("../../../components/BudgetLineItems/ReviewExecutingTotalAccordion/ReviewExecutingTotalAccordion", () => ({
    default: () => <div data-testid="review-executing-total-accordion">Review Executing Total</div>
}));

vi.mock("../../../components/Agreements/ContractModificationEdits/ContractModificationEditCard", () => ({
    default: (/** @type {{ edit: { id: number, modification_type?: string } }} */ { edit }) => (
        <div data-testid={`edit-card-${edit.id}`}>{edit.modification_type}</div>
    )
}));

vi.mock("../../../components/UI/Accordion", () => ({
    default: (/** @type {{ heading: string; children: React.ReactNode }} */ { heading, children }) => (
        <div data-testid={`accordion-${heading.toLowerCase().replace(/\s+/g, "-")}`}>
            <h2>{heading}</h2>
            {children}
        </div>
    )
}));

vi.mock("../../../components/UI/Form/TextArea", () => ({
    default: (/** @type {{ onChange: (name: string, value: string) => void }} */ { onChange }) => (
        <textarea
            data-testid="reviewer-notes-textarea"
            onChange={(e) => onChange("reviewer-notes", e.target.value)}
        />
    )
}));

vi.mock("../../../components/UI/Alert/SimpleAlert", () => ({
    default: (
        /** @type {{ type: string; heading?: string; message?: string; children?: React.ReactNode }} */ {
            type,
            heading,
            message,
            children
        }
    ) => (
        <div data-testid={`alert-${type}`}>
            <h3>{heading}</h3>
            <p>{children || message}</p>
        </div>
    )
}));

vi.mock("../../../components/UI/Modals/ConfirmationModal", () => ({
    default: (
        /** @type {{ heading: string; actionButtonText: string; handleConfirm: () => void }} */ {
            heading,
            actionButtonText,
            handleConfirm
        }
    ) => (
        <div data-testid="confirmation-modal">
            <h3>{heading}</h3>
            <button onClick={handleConfirm}>{actionButtonText}</button>
        </div>
    )
}));

import useApproveModApproval from "./ApproveModApproval.hooks";

const baseRequest = {
    id: 10,
    agreement_id: 1,
    can_review: true,
    requestor_notes: "Please review this modification",
    edits: [{ id: 100, modification_type: "MODIFIED_LOE", field: "amount", old_value: 1, new_value: 2 }],
    budget_line_items: []
};

const mockHookData = {
    agreement: { id: 1, name: "Test Agreement", display_name: "Agreement 001" },
    isLoading: false,
    request: baseRequest,
    hasPermission: true,
    allBudgetLines: [],
    servicesComponents: [],
    groupedBudgetLinesByServicesComponent: [],
    totalGrantNumbers: 0,
    executingTotal: 0,
    highlightedFieldByBudgetLineId: {},
    projectOfficerName: "John Doe",
    alternateProjectOfficerName: "Jane Smith",
    requestorName: "Basic User",
    reviewerNotes: "",
    setReviewerNotes: vi.fn(),
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {},
    handleApprove: vi.fn(),
    handleDecline: vi.fn(),
    handleCancel: vi.fn(),
    isSubmitDisabled: false,
    submitError: ""
};

describe("ApproveModApproval", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (hookData = mockHookData) => {
        // @ts-expect-error - Mock function
        useApproveModApproval.mockReturnValue(hookData);

        return render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1/review-modification"]}>
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

    it("should render loading state", () => {
        renderComponent({ ...mockHookData, isLoading: true });
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render the page with the agreement and the modification's edits", () => {
        renderComponent();

        expect(screen.getByTestId("page-header")).toBeInTheDocument();
        expect(screen.getByText("Mod Approval")).toBeInTheDocument();
        expect(screen.getByText("Agreement 001")).toBeInTheDocument();
        expect(screen.getByTestId("edit-card-100")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-meta-accordion")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-can-review-accordion")).toBeInTheDocument();
    });

    it("should show access denied when the user cannot review", () => {
        renderComponent({ ...mockHookData, hasPermission: false });

        expect(screen.getByTestId("alert-error")).toBeInTheDocument();
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("should show nothing-to-review when there is no in-review request", () => {
        renderComponent({ ...mockHookData, request: undefined, hasPermission: false });

        expect(screen.getByText("Nothing to Review")).toBeInTheDocument();
        expect(
            screen.getByText("There is no contract modification currently awaiting review on this agreement.")
        ).toBeInTheDocument();
    });

    it("should display the submitter's notes", () => {
        renderComponent();

        expect(screen.getByText("Submitter's Notes")).toBeInTheDocument();
        expect(screen.getByText("Please review this modification")).toBeInTheDocument();
    });

    it("should let the reviewer enter notes", async () => {
        const user = userEvent.setup();
        const setReviewerNotes = vi.fn();
        renderComponent({ ...mockHookData, setReviewerNotes });

        await user.type(screen.getByTestId("reviewer-notes-textarea"), "a");

        expect(setReviewerNotes).toHaveBeenCalledWith("a");
    });

    it("should call handleApprove when Approve is clicked", async () => {
        const user = userEvent.setup();
        const handleApprove = vi.fn();
        renderComponent({ ...mockHookData, handleApprove });

        await user.click(screen.getByRole("button", { name: "Approve modification" }));

        expect(handleApprove).toHaveBeenCalledTimes(1);
    });

    it("should call handleDecline when Decline is clicked", async () => {
        const user = userEvent.setup();
        const handleDecline = vi.fn();
        renderComponent({ ...mockHookData, handleDecline });

        await user.click(screen.getByRole("button", { name: "Decline" }));

        expect(handleDecline).toHaveBeenCalledTimes(1);
    });

    it("should call handleCancel when Cancel is clicked", async () => {
        const user = userEvent.setup();
        const handleCancel = vi.fn();
        renderComponent({ ...mockHookData, handleCancel });

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it("should disable the action buttons while submitting", () => {
        renderComponent({ ...mockHookData, isSubmitDisabled: true });

        expect(screen.getByRole("button", { name: "Approve modification" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Decline" })).toBeDisabled();
    });

    it("should show the confirmation modal when showModal is true", () => {
        renderComponent({
            ...mockHookData,
            showModal: true,
            modalProps: { heading: "Are you sure?", actionButtonText: "Approve" }
        });

        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("should show the submit error alert", () => {
        renderComponent({ ...mockHookData, submitError: "Something went wrong" });

        expect(screen.getByTestId("alert-error")).toBeInTheDocument();
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
});
