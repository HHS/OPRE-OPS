import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestPreAwardApproval } from "./RequestPreAwardApproval";

const navigateMock = vi.fn();
const requestPreAwardApprovalHookMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    /** @type {any} */
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useParams: () => ({ id: "1" })
    };
});

vi.mock("./RequestPreAwardApproval.hooks", () => ({
    __esModule: true,
    default: () => requestPreAwardApprovalHookMock()
}));

vi.mock("../../../App", () => ({
    __esModule: true,
    default: (/** @type {{ children: React.ReactNode }} */ { children }) => (
        <div data-testid="app">{children}</div>
    )
}));

vi.mock("../../../components/Agreements/AgreementMetaAccordion", () => ({
    __esModule: true,
    default: () => <div data-testid="meta-accordion" />
}));

vi.mock("../../../components/Agreements/AgreementBLIAccordion", () => ({
    __esModule: true,
    default: (/** @type {{ title: string }} */ { title }) => <div data-testid="bli-accordion">{title}</div>
}));

vi.mock("../../../components/BudgetLineItems/ReviewExecutingTotalAccordion/ReviewExecutingTotalAccordion", () => ({
    __esModule: true,
    default: () => <div data-testid="review-executing-total-accordion" />
}));

vi.mock("../../../components/UI/Accordion", () => ({
    __esModule: true,
    default: (/** @type {{ heading: string; children: React.ReactNode }} */ { heading, children }) => (
        <section data-testid="accordion">
            <h2>{heading}</h2>
            {children}
        </section>
    )
}));

vi.mock("../../../components/UI/Form/TextArea", () => ({
    __esModule: true,
    default: (
        /** @type {{ value: string; onChange: (name: string, value: string) => void }} */ { value, onChange }
    ) => (
        <textarea
            data-testid="notes-textarea"
            value={value}
            onChange={(e) => onChange("requestor-notes", e.target.value)}
        />
    )
}));

vi.mock("../../../components/UI/PageHeader", () => ({
    __esModule: true,
    default: (/** @type {{ title: string; subTitle: string }} */ { title, subTitle }) => (
        <header data-testid="page-header">
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
        </header>
    )
}));

const baseHookResult = () => ({
    agreement: { name: "Test Agreement", id: 1 },
    isLoading: false,
    executingBudgetLines: [{ id: 1, status: "IN_EXECUTION" }],
    executingTotal: 0,
    notes: "",
    setNotes: vi.fn(),
    handleSubmit: vi.fn(),
    handleCancel: vi.fn(),
    projectOfficerName: "John Doe",
    alternateProjectOfficerName: "Jane Smith",
    isApprovalPending: false,
    hasApprovalBeenRequested: false,
    hasBLIInReview: false,
    isSubmitting: false,
    servicesComponents: [],
    groupedBudgetLinesByServicesComponent: [],
    selectedFile: null,
    handleFileChange: vi.fn(),
    handleFileUpload: vi.fn(),
    isUploading: false,
    uploadError: "",
    submitError: "",
    preAwardMemoDocuments: [],
    isStep4Completed: true
});

describe("RequestPreAwardApproval", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requestPreAwardApprovalHookMock.mockReturnValue(baseHookResult());
    });

    it("renders loading state", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            isLoading: true
        });

        render(<RequestPreAwardApproval />);

        const loadingElement = screen.getByText("Loading...");
        expect(loadingElement).toBeInTheDocument();
        expect(loadingElement.tagName).toBe("P");
    });

    it("renders page header with agreement name", () => {
        render(<RequestPreAwardApproval />);

        expect(screen.getByRole("heading", { level: 1, name: "Request Pre-Award Approval" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 2, name: "Test Agreement" })).toBeInTheDocument();
    });

    it("renders all required accordions", () => {
        render(<RequestPreAwardApproval />);

        expect(screen.getByTestId("meta-accordion")).toBeInTheDocument();
        expect(screen.getByTestId("bli-accordion")).toBeInTheDocument();
        expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    it("renders notes textarea", () => {
        render(<RequestPreAwardApproval />);

        expect(screen.getByTestId("notes-textarea")).toBeInTheDocument();
    });

    it("updates notes when typing", async () => {
        const setNotesMock = vi.fn();
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            setNotes: setNotesMock
        });

        const user = userEvent.setup();
        render(<RequestPreAwardApproval />);

        const textarea = screen.getByTestId("notes-textarea");
        await user.type(textarea, "Test notes");

        await waitFor(() => {
            expect(setNotesMock).toHaveBeenCalled();
        });
    });

    it("renders cancel and submit buttons", () => {
        render(<RequestPreAwardApproval />);

        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send to Approval" })).toBeInTheDocument();
    });

    it("calls handleCancel when cancel button is clicked", async () => {
        const handleCancelMock = vi.fn();
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            handleCancel: handleCancelMock
        });

        const user = userEvent.setup();
        render(<RequestPreAwardApproval />);

        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        await user.click(cancelButton);

        expect(handleCancelMock).toHaveBeenCalledTimes(1);
    });

    it("calls handleSubmit when submit button is clicked", async () => {
        const handleSubmitMock = vi.fn();
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            handleSubmit: handleSubmitMock
        });

        const user = userEvent.setup();
        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        await user.click(submitButton);

        expect(handleSubmitMock).toHaveBeenCalledTimes(1);
    });

    it("disables submit button when approval already requested", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            isApprovalPending: true,
            hasApprovalBeenRequested: true
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).toBeDisabled();
    });

    it("shows alert when approval already requested", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            isApprovalPending: true,
            hasApprovalBeenRequested: true
        });

        render(<RequestPreAwardApproval />);

        expect(screen.getByText("Pre-Award Approval In Review")).toBeInTheDocument();
    });

    it("disables submit button when BLI is in review", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            hasBLIInReview: true
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).toBeDisabled();
    });

    it("shows alert when BLI is in review", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            hasBLIInReview: true
        });

        render(<RequestPreAwardApproval />);

        expect(screen.getByText("Budget Line In Review")).toBeInTheDocument();
        expect(
            screen.getByText(/One or more budget lines have pending change requests that are currently in review/)
        ).toBeInTheDocument();
    });

    it("enables submit button when no blocking conditions", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            hasApprovalBeenRequested: false,
            hasBLIInReview: false,
            isSubmitting: false,
            isStep4Completed: true
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).not.toBeDisabled();
    });

    it("disables submit button when step 4 is not completed", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            isStep4Completed: false
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).toBeDisabled();
    });

    it("shows alert when step 4 is not completed", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            isStep4Completed: false
        });

        render(<RequestPreAwardApproval />);

        expect(screen.getByText("Step 4 Not Completed")).toBeInTheDocument();
        expect(
            screen.getByText(/You must complete Step 4 \(Evaluation\) in the Procurement Tracker/)
        ).toBeInTheDocument();
    });

    it("enables submit button when approval is declined", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            hasApprovalBeenRequested: false, // Should be false when declined
            hasBLIInReview: false,
            isSubmitting: false,
            isStep4Completed: true
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).not.toBeDisabled();
    });

    it("disables submit button when approval is approved", () => {
        requestPreAwardApprovalHookMock.mockReturnValue({
            ...baseHookResult(),
            hasApprovalBeenRequested: true
        });

        render(<RequestPreAwardApproval />);

        const submitButton = screen.getByRole("button", { name: "Send to Approval" });
        expect(submitButton).toBeDisabled();
    });
});
