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

vi.mock("../../../components/Agreements/AgreementEditor/AgreementEditForm", async () => {
    const { useEffect } = await vi.importActual("react");
    function MockAgreementEditForm({ hideFooterButtons, isReviewMode, bundleSliceRef }) {
        useEffect(() => {
            if (bundleSliceRef) {
                bundleSliceRef.current = { getSlice: () => agreementSlice };
            }
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
    const { useEffect } = await vi.importActual("react");
    function MockCreateBLIsAndSCs({ hideFooterButtons, hideWizardChrome, isReviewMode, bundleSliceRef }) {
        useEffect(() => {
            if (bundleSliceRef) {
                bundleSliceRef.current = { getSlice: () => blisSlice };
            }
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

    describe("BLI change-request modal (financial snapshot changes)", () => {
        it("shows the BLI approval modal when a PLANNED/EXECUTING BLI has financial changes (non-superuser)", async () => {
            blisSlice = {
                services_components: { create: [], update: [], delete: [] },
                budget_line_items: { create: [], update: [], delete: [] },
                hasFinancialSnapshotChanges: true,
                bliChangeMessages: "• BL 1 Amount: $100.00 to $200.00"
            };
            renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            // Modal should appear; mutation should NOT have fired yet.
            await waitFor(() => {
                expect(
                    screen.getByText(/Budget changes require approval from your Division Director/)
                ).toBeInTheDocument();
            });
            expect(updateBundleMock).not.toHaveBeenCalled();
        });

        it("fires the mutation when the user confirms the BLI approval modal", async () => {
            blisSlice = {
                services_components: { create: [], update: [], delete: [] },
                budget_line_items: { create: [], update: [], delete: [] },
                hasFinancialSnapshotChanges: true,
                bliChangeMessages: "• BL 1 Amount: $100.00 to $200.00"
            };
            nextBundleResult = {
                resolveWith: { change_request_ids: [99], failed_notification_change_request_ids: [] }
            };
            const { store } = renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => {
                expect(
                    screen.getByText(/Budget changes require approval from your Division Director/)
                ).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole("button", { name: "Send to Approval" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            await waitFor(() => {
                expect(store.getState().alert.heading).toBe("Changes Sent to Approval");
            });
        });

        it("skips the BLI modal and fires directly when user is a superuser", async () => {
            blisSlice = {
                services_components: { create: [], update: [], delete: [] },
                budget_line_items: { create: [], update: [], delete: [] },
                hasFinancialSnapshotChanges: true,
                bliChangeMessages: "• BL 1 Amount: $100.00 to $200.00"
            };
            // Render with a superuser in auth state
            const store = configureStore({
                reducer: { auth: authSlice, alert: alertSlice },
                preloadedState: {
                    auth: { activeUser: { id: 1, roles: [], is_superuser: true } },
                    alert: { isActive: false, type: "", heading: "", message: "" }
                }
            });
            render(
                <Provider store={store}>
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
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            // No modal should have appeared
            expect(
                screen.queryByText(/Budget changes require approval from your Division Director/)
            ).not.toBeInTheDocument();
        });
    });

    describe("fireBundleSave alert branches", () => {
        it("shows 'Changes Sent to Approval' when response has change_request_ids", async () => {
            nextBundleResult = {
                resolveWith: { change_request_ids: [101], failed_notification_change_request_ids: [] }
            };
            blisSlice = {
                services_components: { create: [], update: [], delete: [] },
                budget_line_items: { create: [], update: [], delete: [] },
                hasFinancialSnapshotChanges: false,
                bliChangeMessages: "• BL 1 Amount: $100.00 to $200.00"
            };
            const { store } = renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            await waitFor(() => {
                expect(store.getState().alert.heading).toBe("Changes Sent to Approval");
            });
        });

        it("shows a warning alert when failed_notification_change_request_ids is non-empty", async () => {
            nextBundleResult = {
                resolveWith: { change_request_ids: [101], failed_notification_change_request_ids: [101] }
            };
            const { store } = renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            await waitFor(() => {
                expect(store.getState().alert.type).toBe("warning");
                expect(store.getState().alert.heading).toBe("Changes Saved — Approval Request Failed");
            });
        });

        it("shows 'Changes Saved' when response has no change_request_ids", async () => {
            nextBundleResult = {
                resolveWith: { change_request_ids: [], failed_notification_change_request_ids: [] }
            };
            const { store } = renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            await waitFor(() => {
                expect(store.getState().alert.heading).toBe("Changes Saved");
            });
        });

        it("shows 'Changes Saved' when response is the legacy {ok: true} shape (no change_request_ids field)", async () => {
            // Regression guard: old resolveWith shape has no change_request_ids — must default to "Changes Saved"
            nextBundleResult = { resolveWith: { ok: true } };
            const { store } = renderPage();
            fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
            await waitFor(() => expect(updateBundleMock).toHaveBeenCalledTimes(1));
            await waitFor(() => {
                expect(store.getState().alert.heading).toBe("Changes Saved");
            });
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
