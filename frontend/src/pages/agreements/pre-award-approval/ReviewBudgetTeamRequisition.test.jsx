import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { ReviewBudgetTeamRequisition } from "./ReviewBudgetTeamRequisition";

// Mock dependencies with spread pattern to preserve real exports
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: vi.fn()
    };
});

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useSelector: vi.fn()
    };
});

vi.mock("./ReviewBudgetTeamRequisition.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../App", () => ({
    default: (/** @type {any} */ { children }) => <div data-testid="app-wrapper">{children}</div>
}));

// Mock sub-components to avoid deep rendering issues
vi.mock("../../../components/UI/PageHeader", () => ({
    default: (/** @type {any} */ { title, subTitle }) => (
        <div data-testid="page-header">
            <h1>{title}</h1>
            <p>{subTitle}</p>
        </div>
    )
}));

vi.mock("../../../components/Agreements/AgreementMetaAccordion", () => ({
    default: () => <div data-testid="agreement-meta-accordion">Agreement Meta</div>
}));

vi.mock("./PreAwardBudgetLinesReviewAccordion", () => ({
    PreAwardBudgetLinesReviewAccordion: () => <div data-testid="budget-lines-accordion">Budget Lines</div>
}));

vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    default: () => <div data-testid="can-review-accordion">CAN Review</div>
}));

vi.mock("../../../components/UI/Accordion", () => ({
    default: (/** @type {any} */ { heading, children }) => (
        <div data-testid={`accordion-${heading.toLowerCase().replace(/\s+/g, "-")}`}>
            <h2>{heading}</h2>
            {children}
        </div>
    )
}));

vi.mock("../../../components/UI/USWDS/DatePicker", () => ({
    default: (/** @type {any} */ { id, name, label, value, onChange, isDisabled, isRequired, hint }) => (
        <div data-testid={`date-picker-${name}`}>
            <label htmlFor={id}>
                {label}
                {isRequired && " *"}
            </label>
            {hint && <div className="usa-hint">{hint}</div>}
            <input
                id={id}
                name={name}
                type="text"
                value={value}
                onChange={onChange}
                disabled={isDisabled}
            />
        </div>
    )
}));

vi.mock("../../../components/UI/Modals/SaveChangesAndExitModal", () => ({
    default: (
        /** @type {any} */ {
            heading,
            actionButtonText,
            secondaryButtonText,
            handleConfirm,
            handleSecondary,
            closeModal
        }
    ) => (
        <div data-testid="modal">
            <h2>{heading}</h2>
            <button onClick={handleConfirm}>{actionButtonText}</button>
            {handleSecondary && <button onClick={handleSecondary}>{secondaryButtonText}</button>}
            <button onClick={closeModal}>Close</button>
        </div>
    )
}));

vi.mock("../../../components/UI/Button/FileUploadButton", () => ({
    default: (/** @type {any} */ { label, buttonText, disabled }) => (
        <div data-testid="file-upload-button">
            <span>{label}</span>
            <button disabled={disabled}>{buttonText}</button>
        </div>
    )
}));

import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useReviewBudgetTeamRequisition from "./ReviewBudgetTeamRequisition.hooks";
import DatePicker from "../../../components/UI/USWDS/DatePicker";

describe("ReviewBudgetTeamRequisition", () => {
    /** @type {import('vitest').Mock} */
    let mockNavigate;
    /** @type {import('vitest').Mock} */
    let mockUseReviewBudgetTeamRequisition;

    // Create MemoizedDatePicker for test mock
    const MemoizedDatePicker = React.memo(DatePicker);

    const defaultHookReturn = {
        agreement: {
            id: 1,
            name: "Test Agreement"
        },
        isLoading: false,
        allBudgetLines: [],
        executingTotal: 50000,
        projectOfficerName: "John Doe",
        alternateProjectOfficerName: "Jane Smith",
        servicesComponents: [],
        groupedBudgetLinesByServicesComponent: [],
        preAwardMemoDocuments: [],
        requestorNotes: "Submitter notes here",
        reviewerNotes: "Division Director notes here",
        preAwardRequestorName: "Alice Johnson",
        preAwardApprovalRequestedDate: "2026-05-10",
        requisitionNumber: "",
        setRequisitionNumber: vi.fn(),
        requisitionDate: "",
        setRequisitionDate: vi.fn(),
        attestationChecked: false,
        setAttestationChecked: vi.fn(),
        MemoizedDatePicker,
        showModal: false,
        setShowModal: vi.fn(),
        modalProps: {},
        isSubmitting: false,
        submitError: "",
        handleApprove: vi.fn(),
        handleCancel: vi.fn(),
        isFormValid: vi.fn(() => false),
        hasPermission: true,
        approvalAlreadyProcessed: false
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockNavigate = vi.fn();
        // @ts-ignore - Mock setup
        useNavigate.mockReturnValue(mockNavigate);
        // @ts-ignore - Mock setup
        useParams.mockReturnValue({ id: "1" });
        // @ts-ignore - Mock setup
        useSelector.mockReturnValue([{ name: "BUDGET_TEAM" }]);

        // @ts-ignore - Mock setup
        mockUseReviewBudgetTeamRequisition = useReviewBudgetTeamRequisition;
        mockUseReviewBudgetTeamRequisition.mockReturnValue(defaultHookReturn);
    });

    describe("Loading state", () => {
        it("should show loading text when data is loading", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                isLoading: true
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });
    });

    describe("Permission gating", () => {
        it("should show access denied message when user lacks permission", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                hasPermission: false
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Access Denied")).toBeInTheDocument();
            expect(
                screen.getByText("You do not have permission to review this pre-award requisition request.")
            ).toBeInTheDocument();
        });

        it("should render form when user has permission", () => {
            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Pre-Award Requisition")).toBeInTheDocument();
            expect(screen.getByLabelText("Requisition #")).toBeInTheDocument();
        });
    });

    describe("Already processed state", () => {
        it("should show info banner when requisition already processed", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                approvalAlreadyProcessed: true
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Already Processed")).toBeInTheDocument();
            expect(screen.getByText("This budget team requisition has already been processed.")).toBeInTheDocument();
        });

        it("should disable form fields when already processed", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                approvalAlreadyProcessed: true
            });

            render(<ReviewBudgetTeamRequisition />);

            const requisitionInput = screen.getByLabelText("Requisition #");
            const dateInput = screen.getByLabelText(/Requisition Date/);
            const attestationCheckbox = screen.getByRole("checkbox");

            expect(requisitionInput).toBeDisabled();
            expect(dateInput).toBeDisabled();
            expect(attestationCheckbox).toBeDisabled();
        });

        it("should disable approve button when already processed", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                approvalAlreadyProcessed: true
            });

            render(<ReviewBudgetTeamRequisition />);

            const approveButton = screen.getByRole("button", { name: /approve pre-award requisition/i });
            expect(approveButton).toBeDisabled();
        });
    });

    describe("Form rendering", () => {
        it("should render all required sections", () => {
            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByTestId("page-header")).toBeInTheDocument();
            expect(screen.getByTestId("agreement-meta-accordion")).toBeInTheDocument();
            expect(screen.getByTestId("budget-lines-accordion")).toBeInTheDocument();
            expect(screen.getByTestId("can-review-accordion")).toBeInTheDocument();
            expect(screen.getByTestId("accordion-review-final-consensus-memo")).toBeInTheDocument();
            expect(screen.getByTestId("accordion-enter-requisition-information")).toBeInTheDocument();
            expect(screen.getByTestId("accordion-notes")).toBeInTheDocument();
        });

        it("should render requisition form fields", () => {
            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByLabelText("Requisition #")).toBeInTheDocument();
            expect(screen.getByLabelText(/Requisition Date/)).toBeInTheDocument();
        });

        it("should render attestation checkbox", () => {
            render(<ReviewBudgetTeamRequisition />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeInTheDocument();
            expect(
                screen.getByText(
                    /I understand that approving Pre-Award Requisition means the requisition has been submitted/
                )
            ).toBeInTheDocument();
        });

        it("should render action buttons", () => {
            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /approve pre-award requisition/i })).toBeInTheDocument();
        });

        it("should display submitter and division director notes", () => {
            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Submitter notes here")).toBeInTheDocument();
            expect(screen.getByText("Division Director notes here")).toBeInTheDocument();
        });

        it("should show placeholder text when notes are empty", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                requestorNotes: "",
                reviewerNotes: ""
            });

            render(<ReviewBudgetTeamRequisition />);

            const noNotesElements = screen.getAllByText("No notes provided");
            expect(noNotesElements).toHaveLength(2);
        });
    });

    describe("Form interactions", () => {
        it("should call setRequisitionNumber when requisition number changes", async () => {
            const user = userEvent.setup();
            const mockSetRequisitionNumber = vi.fn();

            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                setRequisitionNumber: mockSetRequisitionNumber
            });

            render(<ReviewBudgetTeamRequisition />);

            const input = screen.getByLabelText("Requisition #");
            await user.type(input, "REQ-12345");

            expect(mockSetRequisitionNumber).toHaveBeenCalled();
        });

        it("should call setRequisitionDate when date changes", async () => {
            const user = userEvent.setup();
            const mockSetRequisitionDate = vi.fn();

            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                setRequisitionDate: mockSetRequisitionDate
            });

            render(<ReviewBudgetTeamRequisition />);

            const dateInput = screen.getByLabelText(/Requisition Date/);
            await user.type(dateInput, "2026-05-12");

            expect(mockSetRequisitionDate).toHaveBeenCalled();
        });

        it("should call setAttestationChecked when checkbox is clicked", async () => {
            const user = userEvent.setup();
            const mockSetAttestationChecked = vi.fn();

            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                setAttestationChecked: mockSetAttestationChecked
            });

            render(<ReviewBudgetTeamRequisition />);

            const checkbox = screen.getByRole("checkbox");
            await user.click(checkbox);

            expect(mockSetAttestationChecked).toHaveBeenCalledWith(true);
        });
    });

    describe("Form validation", () => {
        it("should disable approve button when form is invalid", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                isFormValid: vi.fn(() => false)
            });

            render(<ReviewBudgetTeamRequisition />);

            const approveButton = screen.getByRole("button", { name: /approve pre-award requisition/i });
            expect(approveButton).toBeDisabled();
        });

        it("should enable approve button when form is valid", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                requisitionNumber: "REQ-12345",
                requisitionDate: "05/12/2026",
                attestationChecked: true,
                isFormValid: vi.fn(() => true)
            });

            render(<ReviewBudgetTeamRequisition />);

            const approveButton = screen.getByRole("button", { name: /approve pre-award requisition/i });
            expect(approveButton).not.toBeDisabled();
        });

        it("should disable approve button while submitting", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                isSubmitting: true,
                isFormValid: vi.fn(() => true)
            });

            render(<ReviewBudgetTeamRequisition />);

            const approveButton = screen.getByRole("button", { name: /submitting.../i });
            expect(approveButton).toBeDisabled();
        });
    });

    describe("Approve flow", () => {
        it("should call handleApprove when approve button is clicked", async () => {
            const user = userEvent.setup();
            const mockHandleApprove = vi.fn();

            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                handleApprove: mockHandleApprove,
                isFormValid: vi.fn(() => true)
            });

            render(<ReviewBudgetTeamRequisition />);

            const approveButton = screen.getByRole("button", { name: /approve pre-award requisition/i });
            await user.click(approveButton);

            expect(mockHandleApprove).toHaveBeenCalled();
        });

        it("should show confirmation modal when approving", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                modalProps: {
                    heading:
                        "Are you sure you want to approve this Pre-Award Requisition? The COR will send the Final Consensus Memo to the Procurement Shop and the agreement will be locked from editing until after it's awarded.",
                    actionButtonText: "Approve",
                    secondaryButtonText: "Cancel",
                    handleConfirm: vi.fn()
                }
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByTestId("modal")).toBeInTheDocument();
            expect(
                screen.getByText(
                    /Are you sure you want to approve this Pre-Award Requisition\? The COR will send the Final Consensus Memo/
                )
            ).toBeInTheDocument();
        });
    });

    describe("Cancel flow", () => {
        it("should call handleCancel when cancel button is clicked", async () => {
            const user = userEvent.setup();
            const mockHandleCancel = vi.fn();

            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                handleCancel: mockHandleCancel
            });

            render(<ReviewBudgetTeamRequisition />);

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            await user.click(cancelButton);

            expect(mockHandleCancel).toHaveBeenCalled();
        });

        it("should show cancel confirmation modal", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                modalProps: {
                    heading: "Are you sure you want to cancel?",
                    description: "Any information you have entered will be discarded.",
                    actionButtonText: "Continue Editing",
                    secondaryButtonText: "Discard Changes",
                    handleConfirm: vi.fn(),
                    handleSecondary: vi.fn()
                }
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByTestId("modal")).toBeInTheDocument();
            expect(screen.getByText("Are you sure you want to cancel?")).toBeInTheDocument();
        });

        it("should disable cancel button while submitting", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                isSubmitting: true
            });

            render(<ReviewBudgetTeamRequisition />);

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toBeDisabled();
        });
    });

    describe("Error handling", () => {
        it("should display submit error when present", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                submitError: "Failed to submit requisition"
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Submission Error")).toBeInTheDocument();
            expect(screen.getByText("Failed to submit requisition")).toBeInTheDocument();
        });

        it("should not display error alert when submitError is empty", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                submitError: ""
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.queryByText("Submission Error")).not.toBeInTheDocument();
        });
    });

    describe("Pre-award memo documents", () => {
        it("should render uploaded documents", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                preAwardMemoDocuments: [
                    {
                        id: 1,
                        document_name: "Final_Consensus_Memo.pdf",
                        document_size: 1.5
                    }
                ]
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByText("Final_Consensus_Memo.pdf")).toBeInTheDocument();
            expect(screen.getByText(/1\.5 MB/)).toBeInTheDocument();
        });

        it("should show disabled upload button when no documents exist", () => {
            mockUseReviewBudgetTeamRequisition.mockReturnValue({
                ...defaultHookReturn,
                preAwardMemoDocuments: []
            });

            render(<ReviewBudgetTeamRequisition />);

            expect(screen.getByTestId("file-upload-button")).toBeInTheDocument();
            const button = screen.getByText("Download File");
            expect(button).toBeDisabled();
        });
    });
});
