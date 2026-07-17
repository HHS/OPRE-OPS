import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

// Spy + result for the new single-mutation save path. Tests can override
// `nextBundleResult` to either resolve with a body or reject with an error.
const updateBundleMock = vi.fn();
let nextBundleResult = { resolveWith: { ok: true } };

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: () => mockAgreementResult,
    useGetServicesComponentsListQuery: () => mockServicesComponentsResult,
    useUpdateAgreementEditBundleMutation: () => [
        (...args) => {
            updateBundleMock(...args);
            return {
                unwrap: () => {
                    if (nextBundleResult.rejectWith) {
                        return Promise.reject(nextBundleResult.rejectWith);
                    }
                    return Promise.resolve(nextBundleResult.resolveWith);
                }
            };
        }
    ]
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

// Each child mock immediately registers a `getSlice` getter on the bundleSliceRef so
// the page can read its slice when the user clicks Save Changes. Tests can override
// the static slices to assert what the page sends in the bundle payload.
let agreementSlice = { name: "Edited Agreement" };
let blisSlice = {
    services_components: { create: [], update: [], delete: [] },
    budget_line_items: { create: [], update: [], delete: [] }
};

// simulateProcurementShopChange is set by tests to trigger onProcurementShopChangeStateChange.
let simulateProcurementShopChange = false;

vi.mock("../../../components/Agreements/AgreementEditor/AgreementEditForm", async () => {
    const { useEffect } = await vi.importActual("react");
    function MockAgreementEditForm({ hideFooterButtons, isReviewMode, bundleSliceRef, onProcurementShopChangeStateChange }) {
        useEffect(() => {
            if (bundleSliceRef) {
                bundleSliceRef.current = { getSlice: () => agreementSlice };
            }
        });
        useEffect(() => {
            if (onProcurementShopChangeStateChange) {
                onProcurementShopChangeStateChange(
                    simulateProcurementShopChange
                        ? { shouldRequestChange: true, oldProcurementShop: { id: 1 }, newProcurementShop: { id: 2 } }
                        : { shouldRequestChange: false, oldProcurementShop: null, newProcurementShop: null }
                );
            }
        }, [onProcurementShopChangeStateChange]);
        return (
            <div data-testid="agreement-edit-form">
                <span data-testid="agreement-edit-form-hide-footer">{String(!!hideFooterButtons)}</span>
                <span data-testid="agreement-edit-form-review-mode">{String(!!isReviewMode)}</span>
            </div>
        );
    }
    return { default: MockAgreementEditForm };
});

// simulateFinancialChange is set by tests to trigger onFinancialChangeStateChange.
let simulateFinancialChange = false;

vi.mock("../../../components/BudgetLineItems/CreateBLIsAndSCs", async () => {
    const { useEffect } = await vi.importActual("react");
    function MockCreateBLIsAndSCs({
        hideFooterButtons,
        hideWizardChrome,
        isReviewMode,
        bundleSliceRef,
        onFinancialChangeStateChange
    }) {
        useEffect(() => {
            if (bundleSliceRef) {
                bundleSliceRef.current = { getSlice: () => blisSlice };
            }
        });
        // Report financial change state; dependency array mirrors the real component.
        useEffect(() => {
            if (onFinancialChangeStateChange) {
                onFinancialChangeStateChange(simulateFinancialChange);
            }
        }, [onFinancialChangeStateChange]);
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

const renderPage = (initialEntry = "/agreements/review/42/edit") => {
    const store = buildStore();
    const utils = render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route
                        path="/agreements/review/:id/edit"
                        element={<EditAgreementAndBudgetLines />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    return { ...utils, store };
};

describe("EditAgreementAndBudgetLines", () => {
    beforeEach(() => {
        navigateMock.mockReset();
        updateBundleMock.mockReset();
        nextBundleResult = { resolveWith: { ok: true } };
        simulateFinancialChange = false;
        simulateProcurementShopChange = false;
        agreementSlice = { name: "Edited Agreement" };
        blisSlice = {
            services_components: { create: [], update: [], delete: [] },
            budget_line_items: { create: [], update: [], delete: [] }
        };
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

    it("returns to the sanitized returnTo path from the query string on Cancel", () => {
        renderPage("/agreements/review/42/edit?returnTo=%2Fagreements%2F42%2Fpre-award-approval");
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(navigateMock).toHaveBeenCalledWith("/agreements/42/pre-award-approval");
    });

    it("falls back to the default review path when returnTo is not a same-origin /agreements/ path", () => {
        renderPage("/agreements/review/42/edit?returnTo=https%3A%2F%2Fevil.example.com%2Fx");
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(navigateMock).toHaveBeenCalledWith("/agreements/review/42");
    });

    it("falls back to the default review path when returnTo contains path traversal", () => {
        renderPage("/agreements/review/42/edit?returnTo=%2Fagreements%2F..%2Fadmin");
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(navigateMock).toHaveBeenCalledWith("/agreements/review/42");
    });

    it("uses returnTo as the success alert redirect after saving", async () => {
        const { store } = renderPage("/agreements/review/42/edit?returnTo=%2Fagreements%2F42%2Fpre-award-approval");
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
        });
        expect(store.getState().alert.redirectUrl).toBe("/agreements/42/pre-award-approval");
    });

    it("fires a single edit-bundle mutation combining both child slices", async () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
        expect(updateBundleMock).toHaveBeenCalledWith({
            id: 42,
            data: {
                agreement: { name: "Edited Agreement" },
                services_components: { create: [], update: [], delete: [] },
                budget_line_items: { create: [], update: [], delete: [] }
            }
        });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
        });
    });

    it("omits the agreement section when the agreement slice is null", async () => {
        agreementSlice = null;
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
        const arg = updateBundleMock.mock.calls[0][0];
        expect(arg.data.agreement).toBeUndefined();
        expect(arg.data.services_components).toBeDefined();
        expect(arg.data.budget_line_items).toBeDefined();
    });

    it("re-enables the save button after a failure (no partial-state cleanup)", async () => {
        nextBundleResult = { rejectWith: { data: { error: "boom" } } };
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
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

    describe("financial-approval modal (DD-approval for PLANNED/IN_EXECUTION BLI edits)", () => {
        it("saves directly without modal when there are no financial-snapshot changes", async () => {
            // simulateFinancialChange is false by default — no PLANNED/IN_EXECUTION financial edits
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            expect(
                screen.queryByText("Budget changes require approval from your Division Director.")
            ).not.toBeInTheDocument();
        });

        it("shows DD-approval modal instead of saving when CreateBLIsAndSCs reports financial changes", async () => {
            simulateFinancialChange = true;
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            // Modal should appear; bundle mutation should NOT have fired yet
            expect(
                await screen.findByText(
                    "Budget changes require approval from your Division Director. Do you want to send it to approval?"
                )
            ).toBeInTheDocument();
            expect(updateBundleMock).not.toHaveBeenCalled();
        });

        it("saves after the user confirms in the DD-approval modal", async () => {
            simulateFinancialChange = true;
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            const sendBtn = await screen.findByRole("button", { name: "Send to Approval" });
            fireEvent.click(sendBtn);
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
        });

        it("dismisses the modal without saving when the user clicks Continue Editing", async () => {
            simulateFinancialChange = true;
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await screen.findByText(
                "Budget changes require approval from your Division Director. Do you want to send it to approval?"
            );
            fireEvent.click(screen.getByRole("button", { name: "Continue Editing" }));
            expect(updateBundleMock).not.toHaveBeenCalled();
            expect(
                screen.queryByText(
                    "Budget changes require approval from your Division Director. Do you want to send it to approval?"
                )
            ).not.toBeInTheDocument();
        });

        it("shows the modal when both procurement-shop and financial changes are pending", async () => {
            simulateProcurementShopChange = true;
            simulateFinancialChange = true;
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            expect(
                await screen.findByText(
                    "Budget changes require approval from your Division Director. Do you want to send it to approval?"
                )
            ).toBeInTheDocument();
            expect(updateBundleMock).not.toHaveBeenCalled();
        });

        it("shows the modal when only a procurement-shop change is pending", async () => {
            simulateProcurementShopChange = true;
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            expect(
                await screen.findByText(
                    "Budget changes require approval from your Division Director. Do you want to send it to approval?"
                )
            ).toBeInTheDocument();
            expect(updateBundleMock).not.toHaveBeenCalled();
        });
    });
});
