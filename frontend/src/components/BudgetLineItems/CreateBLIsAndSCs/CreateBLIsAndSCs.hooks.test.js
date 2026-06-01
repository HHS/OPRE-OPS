import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCreateBLIsAndSCs from "./CreateBLIsAndSCs.hooks";

const setAlertMock = vi.fn();
const navigateMock = vi.fn();
const useSelectorMock = vi.fn();

const addAgreementMock = vi.fn();
const deleteAgreementMock = vi.fn();
const updateBudgetLineItemMock = vi.fn();
const addBudgetLineItemMock = vi.fn();
const deleteBudgetLineItemMock = vi.fn();
const deleteServicesComponentMock = vi.fn();
const addServicesComponentMock = vi.fn();
const updateServicesComponentMock = vi.fn();

const goBackMock = vi.fn();
const setIsEditModeMock = vi.fn();
const editAgreementMockData = {
    agreement: { id: 1, team_members: [] },
    services_components: [{ id: 11, number: 1 }],
    deleted_services_components_ids: []
};

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useBlocker: () => ({
            state: "unblocked",
            proceed: vi.fn(),
            reset: vi.fn(),
            nextLocation: "/agreements/1"
        })
    };
});

vi.mock("../../../api/opsAPI", () => ({
    useAddAgreementMutation: () => [addAgreementMock],
    useDeleteAgreementMutation: () => [deleteAgreementMock],
    useUpdateBudgetLineItemMutation: () => [updateBudgetLineItemMock],
    useAddBudgetLineItemMutation: () => [addBudgetLineItemMock],
    useDeleteBudgetLineItemMutation: () => [deleteBudgetLineItemMock],
    useDeleteServicesComponentMutation: () => [deleteServicesComponentMock],
    useAddServicesComponentMutation: () => [addServicesComponentMock],
    useUpdateServicesComponentMutation: () => [updateServicesComponentMock]
}));

vi.mock("../../../helpers/agreement.helpers", () => ({
    cleanAgreementForApi: vi.fn(() => ({ cleanData: {} })),
    cleanBudgetLineItemForApi: vi.fn((bli) => ({ id: bli.id, data: bli })),
    cleanBudgetLineItemsForApi: vi.fn((blis) => blis),
    formatTeamMember: vi.fn((tm) => tm),
    isNotDevelopedYet: vi.fn((agreementType) => ["GRANT", "IAA", "DIRECT_OBLIGATION"].includes(agreementType))
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    BLI_STATUS: { DRAFT: "DRAFT", PLANNED: "PLANNED", EXECUTING: "EXECUTING" },
    BLILabel: vi.fn((bli) => `${bli?.id ?? "Unknown"}`),
    budgetLinesTotal: vi.fn((blis) => blis.reduce((sum, bli) => sum + (bli.amount ?? 0), 0)),
    getNonDRAFTBudgetLines: vi.fn((blis) => blis.filter((bli) => bli.status !== "DRAFT")),
    groupByServicesComponent: vi.fn((blis) => blis.map((bli) => ({ budgetLines: [bli], servicesComponentNumber: 1 })))
}));

vi.mock("../../../helpers/scrollToTop.helper", () => ({
    scrollToTop: vi.fn()
}));

vi.mock("../../../helpers/utils", () => ({
    formatDateForApi: vi.fn(() => "2026-01-01"),
    formatDateForScreen: vi.fn(() => "01/01/2026"),
    renderField: vi.fn(() => "field")
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/useGetAllCans", () => ({
    useGetAllCans: () => ({ cans: [{ id: 22, display_name: "CAN 22" }] })
}));

vi.mock("../../../hooks/user.hooks", () => ({
    useGetLoggedInUserFullName: () => "Reviewer User"
}));

const useEditAgreementMock = vi.fn(() => editAgreementMockData);
vi.mock("../../Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => useEditAgreementMock()
}));

vi.mock("../BudgetLinesForm/datePickerSuite", () => {
    const suite = vi.fn();
    suite.get = vi.fn(() => ({
        hasErrors: () => false,
        getErrors: () => []
    }));
    suite.reset = vi.fn();
    return { default: suite };
});

vi.mock("../BudgetLinesForm/suite", () => {
    const suite = vi.fn();
    suite.get = vi.fn(() => ({
        getErrors: () => ({}),
        hasErrors: () => false
    }));
    suite.reset = vi.fn();
    return { default: suite };
});

vi.mock("./suite", () => {
    const suite = vi.fn();
    suite.get = vi.fn(() => ({
        getErrors: () => ({}),
        hasErrors: () => false,
        isValid: () => true
    }));
    suite.run = vi.fn(() => ({
        getErrors: () => ({}),
        hasErrors: () => false,
        isValid: () => true
    }));
    suite.reset = vi.fn();
    return { default: suite };
});

describe("useCreateBLIsAndSCs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSelectorMock.mockImplementation((selector) =>
            selector({
                auth: {
                    activeUser: {
                        id: 1,
                        is_superuser: false,
                        roles: [{ name: "VIEWER_EDITOR" }]
                    }
                }
            })
        );
        deleteAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    });

    const renderSubject = (overrides = {}) =>
        renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                {
                    id: 1,
                    agreement_type: "GRANT",
                    display_name: "AGR-1",
                    ...overrides.selectedAgreement
                },
                {
                    fee_percentage: 5,
                    abbr: "PSC"
                },
                setIsEditModeMock,
                overrides.workflow ?? "none",
                true,
                overrides.canUserEditBudgetLines ?? false,
                "Save & Exit",
                1
            )
        );

    it("flags not-yet-developed agreement types", () => {
        const { result } = renderSubject();
        expect(result.current.isAgreementNotYetDeveloped).toBe(true);
    });

    it("adds a budget line and raises success toast", () => {
        const { result } = renderSubject();

        act(() => {
            result.current.setServicesComponentNumber(1);
            result.current.setSelectedCan({ id: 22, display_name: "CAN 22" });
            result.current.setEnteredAmount(1000);
            result.current.setNeedByDate("01/01/2026");
            result.current.setEnteredDescription("Test budget line");
        });

        act(() => {
            result.current.handleAddBLI({ preventDefault: vi.fn() });
        });

        expect(result.current.tempBudgetLines).toHaveLength(1);
        expect(result.current.tempBudgetLines[0].amount).toBe(1000);
        expect(result.current.tempBudgetLines[0].agreement).toEqual({
            procurement_shop: { fee_percentage: 5, abbr: "PSC", current_fee: { fee: 5 } }
        });
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                isToastMessage: true
            })
        );
    });

    it("opens cancel modal and navigates to budget lines on confirm", () => {
        const { result } = renderSubject();

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.actionButtonText).toBe("Cancel Edits");

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(setIsEditModeMock).toHaveBeenCalledWith(false);
        expect(navigateMock).toHaveBeenCalledWith("/agreements/1/budget-lines");
    });

    it("uses the latest review-mode suite result for page validation", async () => {
        const suiteModule = await import("./suite");
        const reviewErrors = {
            "Budget line item (temp-id)": ["This is required information"]
        };
        suiteModule.default.run.mockImplementation(() => ({
            getErrors: () => reviewErrors,
            hasErrors: () => true,
            isValid: () => false
        }));

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                true,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                {
                    id: 1,
                    agreement_type: "GRANT",
                    display_name: "AGR-1"
                },
                {
                    fee_percentage: 5,
                    abbr: "PSC"
                },
                setIsEditModeMock,
                "agreement",
                true,
                true,
                "Save & Exit",
                1
            )
        );

        expect(suiteModule.default.run).toHaveBeenCalledWith({ budgetLines: [] });
        expect(result.current.budgetLinePageErrorsExist).toBe(true);
    });

    it("does not send UI-only fields in services_components when creating a new agreement", async () => {
        useEditAgreementMock.mockReturnValue({
            agreement: { team_members: [] },
            services_components: [
                {
                    number: 1,
                    optional: false,
                    description: "Base period",
                    period_start: "2026-01-01",
                    period_end: "2026-12-31",
                    display_title: "Base Period 1",
                    has_changed: true,
                    popStartDate: "01/01/2026",
                    popEndDate: "12/31/2026",
                    mode: "edit"
                }
            ],
            deleted_services_components_ids: []
        });

        addAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 99 }) });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { agreement_type: "CONTRACT", display_name: "AGR-NEW" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                false,
                "Save & Exit",
                1
            )
        );

        await act(async () => {
            await result.current.handleSave(false);
        });

        expect(addAgreementMock).toHaveBeenCalled();
        const payload = addAgreementMock.mock.calls[0][0];
        const sc = payload.services_components[0];

        expect(sc).not.toHaveProperty("has_changed");
        expect(sc).not.toHaveProperty("popStartDate");
        expect(sc).not.toHaveProperty("popEndDate");
        expect(sc).not.toHaveProperty("mode");
        expect(sc).toHaveProperty("number", 1);
        expect(sc).toHaveProperty("ref", "Base Period 1");
    });

    it("does not send UI-only fields in services_components when editing an existing agreement", async () => {
        useEditAgreementMock.mockReturnValue({
            agreement: { id: 42, team_members: [] },
            services_components: [
                {
                    number: 1,
                    optional: false,
                    description: "New SC",
                    period_start: "2026-01-01",
                    period_end: "2026-12-31",
                    display_title: "Base Period 1",
                    popStartDate: "01/01/2026",
                    popEndDate: "12/31/2026",
                    mode: "add"
                },
                {
                    id: 77,
                    number: 2,
                    optional: true,
                    description: "Existing SC",
                    period_start: "2026-06-01",
                    period_end: "2027-05-31",
                    display_title: "Option Period 2",
                    created_on: "2026-01-15",
                    has_changed: true,
                    popStartDate: "06/01/2026",
                    popEndDate: "05/31/2027",
                    mode: "edit"
                }
            ],
            deleted_services_components_ids: []
        });

        addServicesComponentMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 88, number: 1 }) });
        updateServicesComponentMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 77, number: 2 }) });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 42, agreement_type: "CONTRACT", display_name: "AGR-42" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                false,
                "Save & Exit",
                1
            )
        );

        await act(async () => {
            await result.current.handleSave(false);
        });

        expect(addServicesComponentMock).toHaveBeenCalled();
        const createdSc = addServicesComponentMock.mock.calls[0][0];
        expect(createdSc).not.toHaveProperty("has_changed");
        expect(createdSc).not.toHaveProperty("popStartDate");
        expect(createdSc).not.toHaveProperty("popEndDate");
        expect(createdSc).not.toHaveProperty("mode");
        expect(createdSc).not.toHaveProperty("display_title");
        expect(createdSc).toHaveProperty("number", 1);

        expect(updateServicesComponentMock).toHaveBeenCalled();
        const updateCall = updateServicesComponentMock.mock.calls[0][0];
        expect(updateCall.data).not.toHaveProperty("has_changed");
        expect(updateCall.data).not.toHaveProperty("popStartDate");
        expect(updateCall.data).not.toHaveProperty("popEndDate");
        expect(updateCall.data).not.toHaveProperty("mode");
        expect(updateCall.data).not.toHaveProperty("display_title");
        expect(updateCall.data).toHaveProperty("number", 2);
    });
});
