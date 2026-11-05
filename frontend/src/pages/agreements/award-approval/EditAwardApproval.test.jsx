import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { EditAwardApproval } from "./EditAwardApproval";
import store from "../../../store";

vi.mock("./EditAwardApproval.hooks", () => ({
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

vi.mock("../../../components/Agreements/AwardRequestForm", () => ({
    default: () => <div data-testid="award-request-form">Award Request Form</div>
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
        <div data-testid="save-changes-modal">
            <p>{heading}</p>
            <button onClick={handleConfirm}>{actionButtonText}</button>
            <button>{secondaryButtonText}</button>
        </div>
    )
}));

import useEditAwardApproval from "./EditAwardApproval.hooks";

const baseHookReturn = {
    agreement: { id: 42, name: "Agreement Name B", display_name: "Agreement Name B" },
    isLoading: false,
    hasPermission: true,
    handleSave: vi.fn(),
    handleCancel: vi.fn(),
    submitError: null,
    isSubmitting: false,
    projectOfficerName: "Sheila Celentano",
    alternateProjectOfficerName: null,
    allBudgetLines: [],
    servicesComponentLookup: {},
    groupedBudgetLinesByServicesComponent: [],
    vendors: [],
    selectedVendor: null,
    setSelectedVendor: vi.fn(),
    contractNumber: "",
    setContractNumber: vi.fn(),
    awardAmount: "",
    setAwardAmount: vi.fn(),
    awardDate: "",
    setAwardDate: vi.fn(),
    agreementTitle: "",
    setAgreementTitle: vi.fn(),
    modificationNumber: "",
    setModificationNumber: vi.fn(),
    purchaseOrderNumber: "",
    setPurchaseOrderNumber: vi.fn(),
    taskOrderNumber: "",
    setTaskOrderNumber: vi.fn(),
    runValidate: vi.fn(),
    validationResult: { getErrors: () => [], hasErrors: () => false },
    MemoizedDatePicker: () => <input data-testid="memoized-date-picker" />,
    clinAssignments: {},
    setClinAssignments: vi.fn(),
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {}
};

const renderPage = (hookOverrides = {}) => {
    useEditAwardApproval.mockReturnValue({ ...baseHookReturn, ...hookOverrides });
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/agreements/42/edit-award"]}>
                <Routes>
                    <Route
                        path="/agreements/:id/edit-award"
                        element={<EditAwardApproval />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
};

describe("EditAwardApproval", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows loading when isLoading is true", () => {
        useEditAwardApproval.mockReturnValue({ ...baseHookReturn, isLoading: true });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <EditAwardApproval />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("shows Access Denied when the user lacks permission", () => {
        renderPage({ hasPermission: false });
        expect(screen.getByTestId("simple-alert-error")).toBeInTheDocument();
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("renders the page title 'Edit Award Approval'", () => {
        renderPage();
        expect(screen.getByText("Edit Award Approval")).toBeInTheDocument();
    });

    it("renders the nickname-preferred display name as subtitle, not the raw full name", () => {
        renderPage({
            agreement: { id: 42, name: "Full Legal Title For Testing", nick_name: "FLT", display_name: "FLT" }
        });
        // Scope to the PageHeader so a missing subtitle can't pass by matching text elsewhere.
        const header = within(screen.getByTestId("page-header"));
        expect(header.getByText("FLT")).toBeInTheDocument();
        expect(header.queryByText("Full Legal Title For Testing")).not.toBeInTheDocument();
    });

    it("falls back to the full name as subtitle when there is no nickname", () => {
        renderPage({ agreement: { id: 42, name: "No Nickname Agreement", nick_name: null, display_name: null } });
        const header = within(screen.getByTestId("page-header"));
        expect(header.getByText("No Nickname Agreement")).toBeInTheDocument();
    });

    it("renders Cancel and Save Changes buttons", () => {
        renderPage();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });
});
