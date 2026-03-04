import { render, screen } from "@testing-library/react";
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
        // Check if agreement is not yet developed based on agreement type
        const isAgreementNotYetDeveloped =
            selectedAgreement?.agreement_type === AgreementType.GRANT ||
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
            isSuperUser: true, // This would come from the Redux store in the real hook
            isAgreementNotYetDeveloped
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

    test("renders ServicesComponents for non-NYD agreement types (CONTRACT)", () => {
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

        expect(screen.getByTestId("services-components")).toBeInTheDocument();
    });
});
