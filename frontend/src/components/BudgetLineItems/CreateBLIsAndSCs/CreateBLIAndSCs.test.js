/* eslint-disable testing-library/no-node-access */
// Note: reaching from the accordion button to its enclosing .usa-accordion__heading via
// .closest() is necessary to assert error-border classes on the header, which has no
// accessible query of its own.
import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { test, describe, expect, vi } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import CreateBLIsAndSCs from "./CreateBLIsAndSCs"; // replace with your component
import authSlice from "../../../components/Auth/authSlice";
import alertSlice from "../../../components/UI/Alert/alertSlice";
import { agreement } from "../../../tests/data";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { USER_ROLES } from "../../Users/User.constants";
import { AgreementType } from "../../../pages/agreements/agreements.constants";

vi.mock("../../ServicesComponents", () => ({
    __esModule: true,
    default: () => <div data-testid="services-components" />
}));

vi.mock("../../GrantNumbers", () => ({
    __esModule: true,
    default: () => <div data-testid="grant-numbers" />
}));

// Stub the budget-lines form: when the user can edit, it renders and pulls in the
// EditAgreement context (via AllGrantNumberSelect) that these unit tests don't provide.
vi.mock("../BudgetLinesForm", () => ({
    __esModule: true,
    default: () => <div data-testid="budget-lines-form" />
}));

// Stub the budget-lines table: its rows use RTK-Query hooks that need the API
// middleware, which the lightweight test store here doesn't wire up.
vi.mock("../BudgetLinesTable", () => ({
    __esModule: true,
    default: () => <div data-testid="budget-lines-table" />
}));

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

const mockFn = TestApplicationContext.helpers().mockFn;
const setIncludeDrafts = mockFn;
const setIsEditMode = mockFn;

const createMockStore = (userRoles = []) => {
    return configureStore({
        reducer: {
            auth: authSlice,
            alert: alertSlice
        },
        preloadedState: {
            auth: {
                activeUser: {
                    id: 1,
                    roles: userRoles
                }
            },
            alert: {
                isActive: false,
                type: "",
                heading: "",
                message: ""
            }
        }
    });
};

// Mock the useCreateBLIsAndSCs hook to return isSuperUser
vi.mock("./CreateBLIsAndSCs.hooks", () => ({
    __esModule: true,
    default: vi.fn((...args) => {
        const selectedAgreement = args[6];
        // Mirror the real hook's isNotDevelopedYet: only DIRECT_OBLIGATION and IAA are
        // not-yet-developed. GRANT is developed and editable, so it must not be treated as NYD.
        const isAgreementNotYetDeveloped =
            selectedAgreement?.agreement_type === AgreementType.DIRECT_OBLIGATION ||
            selectedAgreement?.agreement_type === AgreementType.IAA;

        // Mock implementation that returns isSuperUser based on Redux state
        return {
            blocker: { state: "unblocked" },
            activeBudgetLine: null,
            addBudgetLine: mockFn,
            addServicesComponent: mockFn,
            budgetFormSuite: {
                hasErrors: () => false,
                getErrors: () => [],
                get: () => ({ hasErrors: () => false })
            },
            budgetLineForEditing: null,
            canAddBudgetLine: true,
            canAddServicesComponent: true,
            canFundsBeDistributed: true,
            canProceed: true,
            changeServicesComponent: mockFn,
            createBudgetLineFromServicesComponent: mockFn,
            createLineItem: mockFn,
            deleteBudgetLine: mockFn,
            deleteServicesComponent: mockFn,
            duplicateBudgetLine: mockFn,
            duplicateServicesComponent: mockFn,
            editBudgetLine: mockFn,
            editServicesComponent: mockFn,
            enteredComments: "",
            enteredAmount: "",
            enteredDescription: "",
            handleEditBudgetLine: mockFn,
            handleDeleteBudgetLine: mockFn,
            handleDuplicateBudgetLine: mockFn,
            handleEditBLI: mockFn,
            handleResetForm: mockFn,
            handleSetBudgetLineForEditingById: mockFn,
            handleAddBLI: mockFn,
            handleSetNeedByDate: mockFn,
            handleSetPeriodEnd: mockFn,
            handleSetPeriodStart: mockFn,
            handleToggleModal: mockFn,
            isApproveBudgetLinesMode: false,
            isEditMode: false,
            isReviewMode: false,
            isEditing: false,
            modalProps: {},
            pageErrors: [],
            needByDate: "",
            datePickerSuite: { get: () => ({ hasErrors: () => false, getErrors: () => [] }) },
            periodEnd: "",
            periodStart: "",
            runningTotals: { budgetLines: 0, fees: 0, total: 0 },
            saveBudgetLine: mockFn,
            selectedCan: null,
            servicesComponents: [],
            servicesComponentNumber: "",
            servicesComponentForEditing: null,
            servicesComponentId: null,
            setEnteredComments: mockFn,
            setEnteredAmount: mockFn,
            setEnteredDescription: mockFn,
            setNeedByDate: mockFn,
            setSelectedCan: mockFn,
            setServicesComponentForEditing: mockFn,
            setServicesComponentId: mockFn,
            setServicesComponentNumber: mockFn,
            setHasUnsavedChanges: mockFn,
            showModal: false,
            hasUnsavedChanges: false,
            handleCancel: mockFn,
            handleGoBack: mockFn,
            handleSave: mockFn,
            setShowModal: mockFn,
            setShowSaveChangesModal: mockFn,
            subTotalForCards: mockFn,
            tempBudgetLines: [],
            totalsForCards: mockFn,
            feesForCards: mockFn,
            budgetLinesForCards: [],
            groupedBudgetLinesByServicesComponent: [],
            groupedBudgetLinesByGrantNumber: [],
            isSuperUser: true, // This would come from the Redux store in the real hook
            isAgreementNotYetDeveloped,
            res: { isValid: () => true, hasErrors: () => false, getErrors: () => ({}) }
        };
    })
}));

describe("CreateBLIsAndSCs", () => {
    test("renders without crashing", () => {
        const mockStore = createMockStore();
        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={agreement.budget_line_items}
                        selectedResearchProject={agreement}
                        selectedAgreement={agreement}
                        selectedProcurementShop={agreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );
        // Verify the component renders without throwing
        expect(document.body).toBeInTheDocument();
    });

    test("renders with super user context", () => {
        const mockStore = createMockStore([USER_ROLES.SUPER_USER]);
        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={agreement.budget_line_items}
                        selectedResearchProject={agreement}
                        selectedAgreement={agreement}
                        selectedProcurementShop={agreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );
        // Verify the component renders without throwing
        expect(document.body).toBeInTheDocument();
    });

    test("renders with regular user context", () => {
        const mockStore = createMockStore([USER_ROLES.VIEWER_EDITOR]);
        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={agreement.budget_line_items}
                        selectedResearchProject={agreement}
                        selectedAgreement={agreement}
                        selectedProcurementShop={agreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );
        // Verify the component renders without throwing
        expect(document.body).toBeInTheDocument();
    });

    test("does not render ServicesComponents for NYD agreement types (GRANT)", () => {
        const mockStore = createMockStore();
        const grantAgreement = { ...agreement, agreement_type: AgreementType.GRANT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={grantAgreement.budget_line_items}
                        selectedResearchProject={grantAgreement}
                        selectedAgreement={grantAgreement}
                        selectedProcurementShop={grantAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("services-components")).not.toBeInTheDocument();
    });

    test("does not render ServicesComponents for NYD agreement types (DIRECT_OBLIGATION)", () => {
        const mockStore = createMockStore();
        const directObligationAgreement = { ...agreement, agreement_type: AgreementType.DIRECT_OBLIGATION };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={directObligationAgreement.budget_line_items}
                        selectedResearchProject={directObligationAgreement}
                        selectedAgreement={directObligationAgreement}
                        selectedProcurementShop={directObligationAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("services-components")).not.toBeInTheDocument();
    });

    test("does not render ServicesComponents for NYD agreement types (IAA)", () => {
        const mockStore = createMockStore();
        const iaaAgreement = { ...agreement, agreement_type: AgreementType.IAA };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={iaaAgreement.budget_line_items}
                        selectedResearchProject={iaaAgreement}
                        selectedAgreement={iaaAgreement}
                        selectedProcurementShop={iaaAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("services-components")).not.toBeInTheDocument();
    });

    test("renders ServicesComponents for non-NYD agreement types (CONTRACT) when the user can edit", () => {
        const mockStore = createMockStore();
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={contractAgreement.budget_line_items}
                        selectedResearchProject={contractAgreement}
                        selectedAgreement={contractAgreement}
                        selectedProcurementShop={contractAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={true}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByTestId("services-components")).toBeInTheDocument();
    });

    test("hides ServicesComponents editing for a CONTRACT when the user cannot edit budget lines (lifecycle-locked)", () => {
        const mockStore = createMockStore();
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={contractAgreement.budget_line_items}
                        selectedResearchProject={contractAgreement}
                        selectedAgreement={contractAgreement}
                        selectedProcurementShop={contractAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("services-components")).not.toBeInTheDocument();
    });

    test("hides GrantNumbers editing for a GRANT when the user cannot edit budget lines (lifecycle-locked)", () => {
        const mockStore = createMockStore();
        const grantAgreement = { ...agreement, agreement_type: AgreementType.GRANT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={grantAgreement.budget_line_items}
                        selectedResearchProject={grantAgreement}
                        selectedAgreement={grantAgreement}
                        selectedProcurementShop={grantAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("grant-numbers")).not.toBeInTheDocument();
    });

    test("renders GrantNumbers editing for a GRANT when the user can edit budget lines", () => {
        const mockStore = createMockStore();
        const grantAgreement = { ...agreement, agreement_type: AgreementType.GRANT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={grantAgreement.budget_line_items}
                        selectedResearchProject={grantAgreement}
                        selectedAgreement={grantAgreement}
                        selectedProcurementShop={grantAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={true}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByTestId("grant-numbers")).toBeInTheDocument();
    });

    test("hideFooterButtons hides the Cancel/Continue action row", () => {
        const mockStore = createMockStore();
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={contractAgreement.budget_line_items}
                        selectedResearchProject={contractAgreement}
                        selectedAgreement={contractAgreement}
                        selectedProcurementShop={contractAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                        hideFooterButtons={true}
                    />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByTestId("continue-btn")).not.toBeInTheDocument();
        expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
    });

    test("runs handleSave and reports ok via onSaved when saveTrigger increments", async () => {
        const mockStore = createMockStore();
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };
        const handleSave = vi.fn().mockResolvedValue(undefined);
        const useCreateBLIsAndSCs = (await import("./CreateBLIsAndSCs.hooks")).default;
        // Wrap the existing default mock to keep all the fields (totals, suites, etc.)
        // but inject our handleSave so we can observe the trigger-driven call.
        const origImpl = vi.mocked(useCreateBLIsAndSCs).getMockImplementation();
        vi.mocked(useCreateBLIsAndSCs).mockImplementation((...args) => ({
            ...origImpl(...args),
            handleSave
        }));

        const onSaved = vi.fn();
        const renderWithTrigger = (saveTrigger) => (
            <Provider store={mockStore}>
                <BrowserRouter>
                    <CreateBLIsAndSCs
                        budgetLines={contractAgreement.budget_line_items}
                        selectedAgreement={contractAgreement}
                        selectedProcurementShop={contractAgreement.procurement_shop}
                        isEditMode={true}
                        continueBtnText="Save Changes"
                        wizardSteps={wizardSteps}
                        workflow="none"
                        currentStep={1}
                        isReviewMode={false}
                        canUserEditBudgetLines={false}
                        setIsEditMode={setIsEditMode}
                        includeDrafts={true}
                        setIncludeDrafts={setIncludeDrafts}
                        saveTrigger={saveTrigger}
                        onSaved={onSaved}
                    />
                </BrowserRouter>
            </Provider>
        );
        const { rerender } = render(renderWithTrigger(0));
        expect(onSaved).not.toHaveBeenCalled();

        rerender(renderWithTrigger(1));
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ok: true }));
        expect(handleSave).toHaveBeenCalledWith(false, true, true);

        // Restore the default mock so other tests aren't affected.
        vi.mocked(useCreateBLIsAndSCs).mockImplementation(origImpl);
    });

    describe("unassociated services component error state (review mode)", () => {
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };

        const renderWithUnassociatedGroup = async ({ isReviewMode, servicesComponentNumber, budgetLines }) => {
            const mockStore = createMockStore();
            const useCreateBLIsAndSCs = (await import("./CreateBLIsAndSCs.hooks")).default;
            const origImpl = vi.mocked(useCreateBLIsAndSCs).getMockImplementation();
            vi.mocked(useCreateBLIsAndSCs).mockImplementation((...args) => ({
                ...origImpl(...args),
                isReviewMode,
                groupedBudgetLinesByServicesComponent: [
                    {
                        serviceComponentGroupingLabel: String(servicesComponentNumber),
                        servicesComponentNumber,
                        budgetLines
                    }
                ]
            }));

            const utils = render(
                <Provider store={mockStore}>
                    <BrowserRouter>
                        <CreateBLIsAndSCs
                            budgetLines={budgetLines}
                            selectedResearchProject={contractAgreement}
                            selectedAgreement={contractAgreement}
                            selectedProcurementShop={contractAgreement.procurement_shop}
                            isEditMode={true}
                            continueBtnText="Save Changes"
                            wizardSteps={wizardSteps}
                            workflow="agreement"
                            currentStep={1}
                            isReviewMode={isReviewMode}
                            canUserEditBudgetLines={true}
                            setIsEditMode={setIsEditMode}
                            includeDrafts={true}
                            setIncludeDrafts={setIncludeDrafts}
                            hideFooterButtons={true}
                        />
                    </BrowserRouter>
                </Provider>
            );

            return { ...utils, restore: () => vi.mocked(useCreateBLIsAndSCs).mockImplementation(origImpl) };
        };

        test("shows the required-info message and red header border for the unassociated bucket in review mode", async () => {
            const bli = { ...agreement.budget_line_items[0], services_component_id: null };
            const { restore } = await renderWithUnassociatedGroup({
                isReviewMode: true,
                servicesComponentNumber: 0,
                budgetLines: [bli]
            });

            expect(screen.getByText("This is required information")).toBeInTheDocument();
            const heading = screen
                .getByRole("button", { name: /BLs not associated with a Services Component/ })
                .closest(".usa-accordion__heading");
            expect(heading).toHaveClass("border-2px");
            expect(heading).toHaveClass("border-secondary-dark");

            restore();
        });

        test("does not flag a bucket that has a real services component in review mode", async () => {
            const bli = { ...agreement.budget_line_items[0], services_component_id: 5 };
            const { restore } = await renderWithUnassociatedGroup({
                isReviewMode: true,
                servicesComponentNumber: 1,
                budgetLines: [bli]
            });

            expect(screen.queryByText("This is required information")).not.toBeInTheDocument();
            // The accordion heading is the one wrapping the expand/collapse button.
            const heading = screen
                .getByRole("button", { name: /Services Component 1/ })
                .closest(".usa-accordion__heading");
            expect(heading).not.toHaveClass("border-2px");
            expect(heading).not.toHaveClass("border-secondary-dark");

            restore();
        });

        test("does not flag the unassociated bucket outside review mode (create wizard in progress)", async () => {
            const bli = { ...agreement.budget_line_items[0], services_component_id: null };
            const { restore } = await renderWithUnassociatedGroup({
                isReviewMode: false,
                servicesComponentNumber: 0,
                budgetLines: [bli]
            });

            const heading = screen
                .getByRole("button", { name: /BLs not associated with a Services Component/ })
                .closest(".usa-accordion__heading");
            expect(heading).not.toHaveClass("border-2px");
            expect(heading).not.toHaveClass("border-secondary-dark");

            restore();
        });
    });

    describe("getSlice bundle export", () => {
        const contractAgreement = { ...agreement, agreement_type: AgreementType.CONTRACT };

        // Render CreateBLIsAndSCs with the hook overridden to supply a specific
        // servicesComponents/tempBudgetLines state, then return the getSlice() output the
        // review-flow edit page reads on Save.
        const getSliceFor = async ({ servicesComponents, tempBudgetLines, budgetLines }) => {
            const mockStore = createMockStore();
            const useCreateBLIsAndSCs = (await import("./CreateBLIsAndSCs.hooks")).default;
            const origImpl = vi.mocked(useCreateBLIsAndSCs).getMockImplementation();
            vi.mocked(useCreateBLIsAndSCs).mockImplementation((...args) => ({
                ...origImpl(...args),
                isEditMode: true,
                servicesComponents,
                tempBudgetLines
            }));

            const bundleSliceRef = createRef();
            render(
                <Provider store={mockStore}>
                    <BrowserRouter>
                        <CreateBLIsAndSCs
                            budgetLines={budgetLines}
                            selectedResearchProject={contractAgreement}
                            selectedAgreement={contractAgreement}
                            selectedProcurementShop={contractAgreement.procurement_shop}
                            isEditMode={true}
                            continueBtnText="Save Changes"
                            wizardSteps={wizardSteps}
                            workflow="agreement"
                            currentStep={1}
                            isReviewMode={true}
                            canUserEditBudgetLines={true}
                            setIsEditMode={setIsEditMode}
                            includeDrafts={true}
                            setIncludeDrafts={setIncludeDrafts}
                            bundleSliceRef={bundleSliceRef}
                            hideFooterButtons={true}
                        />
                    </BrowserRouter>
                </Provider>
            );

            const slice = bundleSliceRef.current.getSlice();
            vi.mocked(useCreateBLIsAndSCs).mockImplementation(origImpl);
            return slice;
        };

        // Regression: resolving a missing SC (services_component_id null/0) by picking a
        // services component. The edit form only stamps services_component_number, so the
        // dirty check must resolve the SC link BEFORE comparing — otherwise the newly-assigned
        // SC looks unchanged and the BLI is silently dropped from budget_line_items.update.
        test("includes a BLI whose only change is a newly-assigned services component", async () => {
            const baseline = { ...agreement.budget_line_items[0], id: 42, services_component_id: null };
            // The in-progress edit: SC number now points at persisted SC id 7, but
            // services_component_id is still null (handleEditBLI never stamps it).
            const edited = {
                ...baseline,
                services_component_number: 3,
                serviceComponentGroupingLabel: "3"
            };
            const servicesComponents = [{ id: 7, number: 3, created_on: "2024-05-27T19:20:46.105099Z" }];

            const slice = await getSliceFor({
                servicesComponents,
                tempBudgetLines: [edited],
                budgetLines: [baseline]
            });

            const updated = slice.budget_line_items.update;
            expect(updated).toHaveLength(1);
            expect(updated[0]).toMatchObject({ id: 42, services_component_id: 7 });
        });

        test("drops a genuinely unchanged BLI from the update bucket", async () => {
            const baseline = { ...agreement.budget_line_items[0], id: 42, services_component_id: 7 };
            const servicesComponents = [{ id: 7, number: 3, created_on: "2024-05-27T19:20:46.105099Z" }];
            // Same SC assignment as the baseline, expressed via the UI-only number field.
            const edited = { ...baseline, services_component_number: 3, serviceComponentGroupingLabel: "3" };

            const slice = await getSliceFor({
                servicesComponents,
                tempBudgetLines: [edited],
                budgetLines: [baseline]
            });

            expect(slice.budget_line_items.update).toHaveLength(0);
        });
    });
});
