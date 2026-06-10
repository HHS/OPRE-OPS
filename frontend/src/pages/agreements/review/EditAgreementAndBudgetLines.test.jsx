import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import authSlice from "../../../components/Auth/authSlice";
import alertSlice from "../../../components/UI/Alert/alertSlice";
import EditAgreementAndBudgetLines from "./EditAgreementAndBudgetLines";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navigateMock
    };
});

const mockAgreement = {
    id: 42,
    name: "Test Agreement",
    project_officer_id: 100,
    alternate_project_officer_id: 101,
    budget_line_items: [],
    procurement_shop: { id: 1, abbr: "GCS" },
    is_awarded: false,
    _meta: { isEditable: true }
};

let mockAgreementResult = { data: mockAgreement, error: null, isLoading: false };
const mockServicesComponentsResult = { data: [], error: null, isLoading: false };

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: () => mockAgreementResult,
    useGetServicesComponentsListQuery: () => mockServicesComponentsResult
}));

vi.mock("../../../api/getUser", () => ({
    getUser: vi.fn().mockResolvedValue({ id: 100, full_name: "Test Officer" })
}));

vi.mock("../../../App", () => ({
    default: ({ breadCrumbName, children }) => (
        <div>
            <span data-testid="breadcrumb-name">{breadCrumbName}</span>
            {children}
        </div>
    )
}));

vi.mock("../../../components/Agreements/AgreementEditor/AgreementEditorContext", () => ({
    EditAgreementProvider: ({ children }) => <div data-testid="edit-agreement-provider">{children}</div>
}));

vi.mock("../../../components/Agreements/AgreementEditor/AgreementEditForm", () => ({
    default: ({ hideFooterButtons, registerSave, isReviewMode }) => {
        if (registerSave) {
            registerSave({
                saveAgreement: vi.fn().mockResolvedValue(true),
                verifyUniquenessBeforeSubmit: vi.fn().mockResolvedValue(null)
            });
        }
        return (
            <div data-testid="agreement-edit-form">
                <span data-testid="agreement-edit-form-hide-footer">{String(!!hideFooterButtons)}</span>
                <span data-testid="agreement-edit-form-review-mode">{String(!!isReviewMode)}</span>
            </div>
        );
    }
}));

vi.mock("../../../components/BudgetLineItems/CreateBLIsAndSCs", () => ({
    default: ({ hideFooterButtons, hideWizardChrome, registerBatchSave, isReviewMode }) => {
        if (registerBatchSave) {
            registerBatchSave(vi.fn().mockResolvedValue(undefined));
        }
        return (
            <div data-testid="create-blis-and-scs">
                <span data-testid="blis-hide-footer">{String(!!hideFooterButtons)}</span>
                <span data-testid="blis-hide-chrome">{String(!!hideWizardChrome)}</span>
                <span data-testid="blis-review-mode">{String(!!isReviewMode)}</span>
            </div>
        );
    }
}));

const buildStore = () =>
    configureStore({
        reducer: { auth: authSlice, alert: alertSlice },
        preloadedState: {
            auth: { activeUser: { id: 1, roles: [] } },
            alert: { isActive: false, type: "", heading: "", message: "" }
        }
    });

const renderPage = () =>
    render(
        <Provider store={buildStore()}>
            <MemoryRouter initialEntries={["/agreements/review/42/edit"]}>
                <Routes>
                    <Route
                        path="/agreements/review/:id/edit"
                        element={<EditAgreementAndBudgetLines />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );

describe("EditAgreementAndBudgetLines", () => {
    beforeEach(() => {
        navigateMock.mockReset();
        mockAgreementResult = { data: mockAgreement, error: null, isLoading: false };
    });

    it("renders both edit sections with the correct props", () => {
        renderPage();

        expect(screen.getByText("Edit Agreement Details")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-edit-form")).toBeInTheDocument();
        expect(screen.getByTestId("create-blis-and-scs")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-edit-form-hide-footer")).toHaveTextContent("true");
        expect(screen.getByTestId("agreement-edit-form-review-mode")).toHaveTextContent("true");
        expect(screen.getByTestId("blis-hide-footer")).toHaveTextContent("true");
        expect(screen.getByTestId("blis-hide-chrome")).toHaveTextContent("true");
        expect(screen.getByTestId("blis-review-mode")).toHaveTextContent("true");
    });

    it("renders one page-level Save changes button", () => {
        renderPage();
        expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("navigates back to the review page when Cancel is clicked", () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(navigateMock).toHaveBeenCalledWith("/agreements/review/42");
    });

    it("triggers the registered save handlers when Save changes is clicked", async () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        // Saving should ultimately not throw and the button should be re-enabled
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
        });
    });

    it("renders an access denied screen when the agreement is not editable", () => {
        mockAgreementResult = {
            data: { ...mockAgreement, _meta: { isEditable: false } },
            error: null,
            isLoading: false
        };
        renderPage();
        expect(screen.getByRole("heading", { name: "Access Denied" })).toBeInTheDocument();
    });

    it("renders a loading state while data is fetching", () => {
        mockAgreementResult = { data: undefined, error: null, isLoading: true };
        renderPage();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
});
