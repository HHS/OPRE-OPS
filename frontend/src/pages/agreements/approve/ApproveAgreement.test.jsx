import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ApproveAgreement from "./ApproveAgreement";

const approveAgreementMock = vi.fn();

vi.mock("./ApproveAgreement.hooks", () => ({
    __esModule: true,
    default: () => approveAgreementMock()
}));

vi.mock("../../../App", () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="app">{children}</div>
}));
vi.mock("../../../components/Agreements/AgreementBLIAccordion", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>
}));
vi.mock("../../../components/Agreements/AgreementCANReviewAccordion", () => ({
    __esModule: true,
    default: () => <div />
}));
vi.mock("../../../components/Agreements/AgreementMetaAccordion", () => ({
    __esModule: true,
    default: () => <div />
}));
vi.mock("../../../components/Agreements/Documents/DocumentCollectionView", () => ({
    __esModule: true,
    default: () => <div data-testid="docs-view" />
}));
vi.mock("../../../components/BudgetLineItems/BLIDiffTable", () => ({
    __esModule: true,
    default: () => <div />
}));
vi.mock("../../../components/ChangeRequests/ReviewChangeRequestAccordion", () => ({
    __esModule: true,
    default: () => <div />
}));
vi.mock("../../../components/ServicesComponents/ServicesComponentAccordion", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>
}));
vi.mock("../../../components/UI/Accordion", () => ({
    __esModule: true,
    default: ({ heading, children }) => (
        <section>
            <h2>{heading}</h2>
            {children}
        </section>
    )
}));
vi.mock("../../../components/UI/Form/TextArea", () => ({
    __esModule: true,
    default: ({ onChange }) => (
        <input
            data-testid="notes-input"
            onChange={() => onChange("submitter-notes", "new notes")}
        />
    )
}));
vi.mock("../../../components/UI/Modals/ConfirmationModal", () => ({
    __esModule: true,
    default: () => <div data-testid="confirmation-modal" />
}));
vi.mock("../../../components/UI/PageHeader", () => ({
    __esModule: true,
    default: ({ title, subTitle }) => (
        <header>
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
        </header>
    )
}));

const baseHookResult = () => ({
    afterApproval: false,
    agreement: { name: "Agreement 1", service_requirement_type: "TEST" },
    approvedBudgetLinesPreview: [],
    budgetLinesInReview: [],
    changeRequestTitle: "Status Change",
    changeRequestsInReview: [],
    changeRequestType: "status-change",
    checkBoxText: "I understand this action",
    confirmation: false,
    errorAgreement: false,
    groupedBeforeApprovalBudgetLinesByServicesComponent: [],
    groupedUpdatedBudgetLinesByServicesComponent: [],
    handleApproveChangeRequests: vi.fn(),
    handleCancel: vi.fn(),
    hasPermissionToViewPage: true,
    isLoadingAgreement: false,
    isHydratingActiveUser: false,
    isAgreementAwarded: false,
    modalProps: {},
    notes: "",
    newAwardingEntity: null,
    oldAwardingEntity: null,
    projectOfficerName: "PO",
    alternateProjectOfficerName: "Alt PO",
    requestorNoters: "",
    servicesComponents: [],
    setAfterApproval: vi.fn(),
    setConfirmation: vi.fn(),
    setNotes: vi.fn(),
    setShowModal: vi.fn(),
    showModal: false,
    statusChangeTo: "IN_EXECUTION",
    statusForTitle: "- Executing",
    title: "Approval for Status Change - Executing",
    urlChangeToStatus: "EXECUTING"
});

describe("ApproveAgreement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        approveAgreementMock.mockReturnValue(baseHookResult());
    });

    const renderWithRouter = () =>
        render(
            <MemoryRouter initialEntries={["/agreements/approve/1?type=status-change&to=executing"]}>
                <Routes>
                    <Route
                        path="/agreements/approve/:id"
                        element={<ApproveAgreement />}
                    />
                    <Route
                        path="/error"
                        element={<div>Error page</div>}
                    />
                </Routes>
            </MemoryRouter>
        );

    it("shows loading state", () => {
        approveAgreementMock.mockReturnValue({
            ...baseHookResult(),
            isLoadingAgreement: true
        });
        renderWithRouter();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows loading state while user context is hydrating", () => {
        approveAgreementMock.mockReturnValue({
            ...baseHookResult(),
            isHydratingActiveUser: true,
            agreement: null,
            hasPermissionToViewPage: false
        });
        renderWithRouter();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("redirects to /error when user cannot view", () => {
        approveAgreementMock.mockReturnValue({
            ...baseHookResult(),
            hasPermissionToViewPage: false
        });
        renderWithRouter();
        expect(screen.getByText("Error page")).toBeInTheDocument();
    });

    it("renders page title and subtitle", () => {
        renderWithRouter();
        expect(screen.getByText("Approval for Status Change - Executing")).toBeInTheDocument();
        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
    });

    it("renders documents section for executing status", () => {
        renderWithRouter();
        expect(screen.getByText("Review Documents")).toBeInTheDocument();
        expect(screen.getByTestId("docs-view")).toBeInTheDocument();
    });

    it("calls handleApproveChangeRequests when action buttons are clicked", async () => {
        const user = userEvent.setup();
        const handleApproveChangeRequests = vi.fn();
        approveAgreementMock.mockReturnValue({
            ...baseHookResult(),
            confirmation: true,
            handleApproveChangeRequests
        });
        renderWithRouter();

        await user.click(screen.getByRole("button", { name: "Decline" }));
        await user.click(screen.getByRole("button", { name: "Approve Changes" }));

        expect(handleApproveChangeRequests).toHaveBeenCalledTimes(2);
        expect(handleApproveChangeRequests.mock.calls[0][0]).toBe("REJECT");
        expect(handleApproveChangeRequests.mock.calls[1][0]).toBe("APPROVE");
    });
});
