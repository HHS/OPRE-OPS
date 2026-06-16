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

// Test doubles for the children: each one watches `saveTrigger` and reports the
// configured fake result through `onSaved`. Tests can override `nextAgreementResult`
// or `nextBLIResult` to simulate failure paths without touching the real components.
let nextAgreementResult = { ok: true };
let nextBLIResult = { ok: true };
const agreementSaveSpy = vi.fn();
const bliSaveSpy = vi.fn();

vi.mock("../../../components/Agreements/AgreementEditor/AgreementEditForm", async () => {
    const { useEffect, useRef } = await vi.importActual("react");
    function MockAgreementEditForm({ hideFooterButtons, isReviewMode, saveTrigger, onSaved }) {
        // Latch on the trigger value: only respond when it actually increments.
        // The page's `onSaved` callback may change reference across renders, so
        // depending on it would cause an infinite re-render loop.
        const lastSeenTrigger = useRef(saveTrigger);
        useEffect(() => {
            if (!saveTrigger || saveTrigger === lastSeenTrigger.current) return;
            lastSeenTrigger.current = saveTrigger;
            agreementSaveSpy(saveTrigger);
            onSaved?.(nextAgreementResult);
        });
        return (
            <div data-testid="agreement-edit-form">
                <span data-testid="agreement-edit-form-hide-footer">{String(!!hideFooterButtons)}</span>
                <span data-testid="agreement-edit-form-review-mode">{String(!!isReviewMode)}</span>
            </div>
        );
    }
    return { default: MockAgreementEditForm };
});

vi.mock("../../../components/BudgetLineItems/CreateBLIsAndSCs", async () => {
    const { useEffect, useRef } = await vi.importActual("react");
    function MockCreateBLIsAndSCs({ hideFooterButtons, hideWizardChrome, isReviewMode, saveTrigger, onSaved }) {
        const lastSeenTrigger = useRef(saveTrigger);
        useEffect(() => {
            if (!saveTrigger || saveTrigger === lastSeenTrigger.current) return;
            lastSeenTrigger.current = saveTrigger;
            bliSaveSpy(saveTrigger);
            onSaved?.(nextBLIResult);
        });
        return (
            <div data-testid="create-blis-and-scs">
                <span data-testid="blis-hide-footer">{String(!!hideFooterButtons)}</span>
                <span data-testid="blis-hide-chrome">{String(!!hideWizardChrome)}</span>
                <span data-testid="blis-review-mode">{String(!!isReviewMode)}</span>
            </div>
        );
    }
    return { default: MockCreateBLIsAndSCs };
});

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
        agreementSaveSpy.mockReset();
        bliSaveSpy.mockReset();
        nextAgreementResult = { ok: true };
        nextBLIResult = { ok: true };
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

    it("chains agreement save then BLI save when Save changes is clicked", async () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => {
            expect(agreementSaveSpy).toHaveBeenCalled();
            expect(bliSaveSpy).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
        });
    });

    it("does not run the BLI save when the agreement save fails", async () => {
        nextAgreementResult = { ok: false, error: { message: "boom" } };
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => {
            expect(agreementSaveSpy).toHaveBeenCalled();
        });
        // Give the page a moment to (incorrectly) chain the BLI save if the contract is broken.
        await new Promise((r) => setTimeout(r, 0));
        expect(bliSaveSpy).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
        });
    });

    it("does not run the BLI save when the agreement save reports a conflict field", async () => {
        nextAgreementResult = { ok: false, conflictField: "name" };
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => {
            expect(agreementSaveSpy).toHaveBeenCalled();
        });
        await new Promise((r) => setTimeout(r, 0));
        expect(bliSaveSpy).not.toHaveBeenCalled();
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
