import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { ApproveAwardApproval } from "./ApproveAwardApproval";
import store from "../../../store";

vi.mock("./ApproveAwardApproval.hooks", () => ({
    default: vi.fn()
}));

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

vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    default: () => <div data-testid="agreement-can-review-accordion">CAN Review</div>
}));

vi.mock("../../../components/UI/Accordion", () => ({
    default: ({ heading, children }) => (
        <div data-testid={`accordion-${String(heading).toLowerCase().replace(/\s+/g, "-")}`}>
            <h2>{heading}</h2>
            {children}
        </div>
    )
}));

vi.mock("../../../components/UI/Form/TextArea", () => ({
    default: ({ onChange, isDisabled, maxLength }) => (
        <textarea
            data-testid="reviewer-notes-textarea"
            onChange={(e) => onChange("reviewer-notes", e.target.value)}
            disabled={isDisabled}
            maxLength={maxLength}
        />
    )
}));

vi.mock("../../../components/UI/Alert/SimpleAlert", () => ({
    default: ({ type, heading, message }) => (
        <div data-testid={`simple-alert-${type}`}>
            <h2>{heading}</h2>
            <p>{message}</p>
        </div>
    )
}));

vi.mock("../../../components/UI/Modals/SaveChangesAndExitModal", () => ({
    default: ({ heading, handleConfirm, actionButtonText, secondaryButtonText }) => (
        <div data-testid="confirmation-modal">
            <p>{heading}</p>
            <button onClick={handleConfirm}>{actionButtonText}</button>
            <button>{secondaryButtonText}</button>
        </div>
    )
}));

vi.mock("../../../components/UI/Button/FileUploadButton", () => ({
    default: () => <div data-testid="file-upload-button">Upload</div>
}));

vi.mock("../../../components/UI/USWDS/DatePicker", () => ({
    default: ({ onChange, label }) => (
        <input
            data-testid="date-picker"
            aria-label={label}
            onChange={(e) => onChange && onChange(e)}
        />
    )
}));

vi.mock("../../../components/UI/SummaryBox", () => ({
    default: () => <div data-testid="summary-box">Vendor Info</div>
}));

import useApproveAwardApproval from "./ApproveAwardApproval.hooks";

const baseHookReturn = {
    agreement: { id: 42, name: "Agreement Name B", display_name: "Agreement Name B" },
    isLoading: false,
    allBudgetLines: [],
    executingTotal: 1000000,
    reviewerNotes: "",
    setReviewerNotes: vi.fn(),
    requestorNotes: "COR notes here",
    handleApprove: vi.fn(),
    handleCancel: vi.fn(),
    projectOfficerName: "Sheila Celentano",
    alternateProjectOfficerName: null,
    servicesComponents: [],
    groupedBudgetLinesByServicesComponent: [],
    step6: { id: 7, vendor_id: 10, contract_number: "GS-123", award_amount: 1500000, award_date: "2024-09-30" },
    requestorName: "Sheila Celentano",
    requestorDate: "2024-01-14",
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {},
    isSubmitting: false,
    submitError: null,
    hasPermission: true,
    approvalAlreadyProcessed: false,
    obligatedDate: "",
    setObligatedDate: vi.fn(),
    MemoizedDatePicker: ({ onChange, label }) => (
        <input
            data-testid="memoized-date-picker"
            aria-label={label}
            onChange={(e) => onChange && onChange(e)}
        />
    )
};

const renderPage = (hookOverrides = {}) => {
    useApproveAwardApproval.mockReturnValue({ ...baseHookReturn, ...hookOverrides });
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/agreements/42/review-award"]}>
                <Routes>
                    <Route
                        path="/agreements/:id/review-award"
                        element={<ApproveAwardApproval />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
};

describe("ApproveAwardApproval", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows loading when isLoading is true", () => {
        useApproveAwardApproval.mockReturnValue({ ...baseHookReturn, isLoading: true });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ApproveAwardApproval />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("shows Access Denied when user lacks permission", () => {
        renderPage({ hasPermission: false });
        expect(screen.getByTestId("simple-alert-error")).toBeInTheDocument();
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    it("renders the page title 'Award Approval'", () => {
        renderPage();
        expect(screen.getByText("Award Approval")).toBeInTheDocument();
    });

    it("renders the agreement name as subtitle", () => {
        renderPage();
        expect(screen.getByText("Agreement Name B")).toBeInTheDocument();
    });

    it("shows the 'Already Processed' info alert when approval already processed", () => {
        renderPage({ approvalAlreadyProcessed: true });
        expect(screen.getByTestId("simple-alert-info")).toBeInTheDocument();
    });

    it("shows confirmation modal when showModal is true", () => {
        renderPage({
            showModal: true,
            modalProps: {
                heading: "Confirm?",
                actionButtonText: "Approve",
                secondaryButtonText: "Cancel",
                handleConfirm: vi.fn()
            }
        });
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        expect(screen.getByText("Confirm?")).toBeInTheDocument();
    });

    it("Approve Award button calls handleApprove after checking attestation", async () => {
        const handleApprove = vi.fn();
        renderPage({ handleApprove });
        // Must check attestation before button is enabled
        const checkbox = screen.getByRole("checkbox");
        await userEvent.click(checkbox);
        const btn = screen.getByRole("button", { name: /Approve Award/i });
        await userEvent.click(btn);
        expect(handleApprove).toHaveBeenCalled();
    });

    it("Approve Award button is disabled when approval already processed", () => {
        renderPage({ approvalAlreadyProcessed: true });
        const btn = screen.getByRole("button", { name: /Approve Award/i });
        expect(btn).toBeDisabled();
    });

    it("Approve Award button is disabled without attestation checkbox checked", () => {
        renderPage();
        const btn = screen.getByRole("button", { name: /Approve Award/i });
        // Without checking attestation, button should be disabled
        expect(btn).toBeDisabled();
    });

    it("enables Approve Award after checking attestation", async () => {
        renderPage();
        const checkbox = screen.getByRole("checkbox");
        await userEvent.click(checkbox);
        const btn = screen.getByRole("button", { name: /Approve Award/i });
        expect(btn).not.toBeDisabled();
    });

    it("shows submit error alert when submitError is set", () => {
        renderPage({ submitError: "Something went wrong" });
        expect(screen.getByTestId("simple-alert-error")).toBeInTheDocument();
    });
});
