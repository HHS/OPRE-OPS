import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCreateBLIsAndSCs, { isDeletionRoutedToApproval } from "./CreateBLIsAndSCs.hooks";

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
const addGrantNumberMock = vi.fn();
const updateGrantNumberMock = vi.fn();
const deleteGrantNumberMock = vi.fn();
const useGetVersionQueryMock = vi.fn();

const goBackMock = vi.fn();
const setIsEditModeMock = vi.fn();
const editAgreementMockData = {
    agreement: { id: 1, team_members: [] },
    services_components: [{ id: 11, number: 1 }],
    deleted_services_components_ids: [],
    grant_numbers: [],
    deleted_grant_numbers_ids: [],
    budget_line_items: [],
    deleted_budget_line_items_ids: []
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
    useUpdateServicesComponentMutation: () => [updateServicesComponentMock],
    useAddGrantNumberMutation: () => [addGrantNumberMock],
    useUpdateGrantNumberMutation: () => [updateGrantNumberMock],
    useDeleteGrantNumberMutation: () => [deleteGrantNumberMock],
    useGetVersionQuery: (...args) => useGetVersionQueryMock(...args)
}));

vi.mock("../../../helpers/agreement.helpers", () => ({
    cleanAgreementForApi: vi.fn(() => ({ cleanData: {} })),
    cleanBudgetLineItemForApi: vi.fn((bli) => ({ id: bli.id, data: bli })),
    cleanBudgetLineItemsForApi: vi.fn((blis) => blis),
    formatTeamMember: vi.fn((tm) => tm),
    isNotDevelopedYet: vi.fn((agreementType) => ["IAA", "DIRECT_OBLIGATION"].includes(agreementType))
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    BLI_STATUS: { DRAFT: "DRAFT", PLANNED: "PLANNED", EXECUTING: "IN_EXECUTION" },
    BLILabel: vi.fn((bli) => `${bli?.id ?? "Unknown"}`),
    budgetLinesTotal: vi.fn((blis) => blis.reduce((sum, bli) => sum + (bli.amount ?? 0), 0)),
    getNonDRAFTBudgetLines: vi.fn((blis) => blis.filter((bli) => bli.status !== "DRAFT")),
    groupByServicesComponent: vi.fn((blis) => blis.map((bli) => ({ budgetLines: [bli], servicesComponentNumber: 1 }))),
    groupByGrantNumber: vi.fn((blis) => blis.map((bli) => ({ budgetLines: [bli], grantNumberNumber: 1 })))
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
    useGetLoggedInUserFullName: () => "Reviewer User",
    useIsUserBudgetTeam: () => false
}));

const useEditAgreementMock = vi.fn(() => editAgreementMockData);
// dispatchMock applies the real reducer so context state evolves during tests
// (e.g. DELETE_BUDGET_LINE_ITEM moves a BLI into deleted_budget_line_items_ids).
const dispatchMock = vi.fn();
vi.mock("../../Agreements/AgreementEditor/AgreementEditorContext.hooks", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useEditAgreement: () => useEditAgreementMock(),
        useEditAgreementDispatch: () => (action) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const next = actual.editAgreementReducer(useEditAgreementMock(), action);
            useEditAgreementMock.mockReturnValue(next);
            dispatchMock(action);
        }
    };
});

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
        // vi.clearAllMocks() clears call history but not a mockReturnValue set by a prior test —
        // restore the module default here so tests that don't override useEditAgreementMock
        // themselves aren't affected by whatever the previous test configured it to return.
        useEditAgreementMock.mockImplementation(() => editAgreementMockData);
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
        // Default: capability OFF and version query resolved.
        useGetVersionQueryMock.mockReturnValue({
            data: { version: "1.0.0", skip_cr_for_draft_planned: false },
            isSuccess: true
        });
    });

    const renderSubject = (overrides = {}) => {
        // BLIs live in context (budget_line_items), not the budgetLines prop. Seed them
        // in the mock so tempBudgetLines is populated from context on mount.
        if (overrides.budgetLines?.length) {
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: overrides.budgetLines.map((bli) => ({
                    ...bli,
                    services_component_number: bli.services_component_id ? 1 : 0,
                    serviceComponentGroupingLabel: bli.services_component_id ? "1" : "0"
                })),
                deleted_budget_line_items_ids: []
            });
        }
        return renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                overrides.budgetLines ?? [],
                vi.fn(),
                goBackMock,
                "continueOverRide" in overrides ? overrides.continueOverRide : vi.fn(),
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
    };

    it("flags not-yet-developed agreement types", () => {
        const { result } = renderSubject();
        expect(result.current.isAgreementNotYetDeveloped).toBe(false);
    });

    it("resets validation suites on mount and unmount so stale errors do not leak (issue #5894)", async () => {
        const [pageSuite, budgetSuite, dateSuite] = await Promise.all([
            import("./suite"),
            import("../BudgetLinesForm/suite"),
            import("../BudgetLinesForm/datePickerSuite")
        ]);

        const { unmount } = renderSubject();

        // reset runs on mount to clear any result left by a prior mount/session
        expect(pageSuite.default.reset).toHaveBeenCalledTimes(1);
        expect(budgetSuite.default.reset).toHaveBeenCalledTimes(1);
        expect(dateSuite.default.reset).toHaveBeenCalledTimes(1);

        unmount();

        // and again on unmount, leaving suites clean for the next consumer
        expect(pageSuite.default.reset).toHaveBeenCalledTimes(2);
        expect(budgetSuite.default.reset).toHaveBeenCalledTimes(2);
        expect(dateSuite.default.reset).toHaveBeenCalledTimes(2);
    });

    it("clears a stale page-suite result left by a prior session on mount (issue #5894)", async () => {
        const pageSuite = (await import("./suite")).default;

        // Model the module-level singleton as actually stateful: a prior session left it
        // "dirty", so get() surfaces Budget line item errors until reset() is called.
        // This makes the assertion depend on the reset + state repaint working, not merely
        // on reset() having been invoked (the previous test's weakness).
        let dirty = true;
        const staleResult = {
            getErrors: () => ({ "Budget line item (stale-1)": ["This is required information"] }),
            hasErrors: () => true,
            isValid: () => false
        };
        const cleanResult = {
            getErrors: () => ({}),
            hasErrors: () => false,
            isValid: () => true
        };
        pageSuite.get.mockImplementation(() => (dirty ? staleResult : cleanResult));
        pageSuite.reset.mockImplementation(() => {
            dirty = false;
        });

        const { result } = renderSubject();

        // After the mount effect resets the suite and repaints from clean state,
        // the stale page errors must be gone without any user interaction.
        await waitFor(() => expect(result.current.budgetLinePageErrorsExist).toBe(false));
        expect(result.current.pageErrors).toEqual([]);
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

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "ADD_BUDGET_LINE_ITEM",
            payload: expect.objectContaining({ amount: 1000 })
        });
        expect(dispatchMock.mock.calls[0][0].payload.agreement).toEqual({
            procurement_shop: { fee_percentage: 5, abbr: "PSC", current_fee: { fee: 5 } }
        });
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                isToastMessage: true
            })
        );
    });

    it("marks a duplicated budget line editable so its row icons stay enabled (issue #6020)", () => {
        // tempBudgetLines is sourced from useEditAgreement()'s budget_line_items, which dispatch()
        // would normally update via the AgreementEditorContext reducer. dispatch is mocked here, so
        // it doesn't mutate anything — simulate the reducer by feeding each dispatched payload back
        // into useEditAgreementMock and re-rendering.
        const { result, rerender } = renderSubject();

        // Seed a budget line to duplicate.
        act(() => {
            result.current.setServicesComponentNumber(1);
            result.current.setSelectedCan({ id: 22, display_name: "CAN 22" });
            result.current.setEnteredAmount(1000);
            result.current.setNeedByDate("01/01/2026");
            result.current.setEnteredDescription("Original budget line");
        });
        act(() => {
            result.current.handleAddBLI({ preventDefault: vi.fn() });
        });

        const original = dispatchMock.mock.calls[0][0].payload;
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            budget_line_items: [original]
        });
        rerender();

        act(() => {
            result.current.handleDuplicateBudgetLine(original.id);
        });

        const duplicate = dispatchMock.mock.calls[1][0].payload;
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            budget_line_items: [original, duplicate]
        });
        rerender();

        expect(result.current.tempBudgetLines).toHaveLength(2);
        // Without _meta.isEditable the row renders the disabled edit/delete/duplicate icons.
        expect(duplicate._meta).toEqual({ isEditable: true });
        expect(duplicate.id).not.toBe(original.id);
        expect(duplicate.amount).toBe(original.amount);
    });

    it("still requires DD approval for a Planned financial change when the capability is OFF", async () => {
        const plannedLine = {
            id: 501,
            status: "PLANNED",
            in_review: false,
            financialSnapshotChanged: true
        };
        // tempBudgetLines is sourced from useEditAgreement()'s budget_line_items, so seed the
        // context mock (not the budgetLines prop) for the flag-scoping logic to see the line.
        useEditAgreementMock.mockReturnValue({ ...editAgreementMockData, budget_line_items: [plannedLine] });
        const { result } = renderSubject();

        await waitFor(() => {
            expect(result.current.tempBudgetLines).toHaveLength(1);
        });
        expect(result.current.requiresFinancialApproval).toBe(true);
    });

    it("applies a Planned financial change immediately (no DD approval) when the capability is ON", async () => {
        useGetVersionQueryMock.mockReturnValue({
            data: { version: "1.0.0", skip_cr_for_draft_planned: true },
            isSuccess: true
        });
        const plannedLine = {
            id: 501,
            status: "PLANNED",
            in_review: false,
            financialSnapshotChanged: true
        };
        useEditAgreementMock.mockReturnValue({ ...editAgreementMockData, budget_line_items: [plannedLine] });
        const { result } = renderSubject();

        await waitFor(() => {
            expect(result.current.tempBudgetLines).toHaveLength(1);
        });
        // Capability ON + all changed lines PLANNED → applies directly, no approval UX.
        expect(result.current.requiresFinancialApproval).toBe(false);
    });

    it("still requires DD approval when a changed line is IN_EXECUTION even with the capability ON", async () => {
        useGetVersionQueryMock.mockReturnValue({
            data: { version: "1.0.0", skip_cr_for_draft_planned: true },
            isSuccess: true
        });
        const executingLine = {
            id: 502,
            status: "EXECUTING",
            in_review: false,
            financialSnapshotChanged: true
        };
        useEditAgreementMock.mockReturnValue({ ...editAgreementMockData, budget_line_items: [executingLine] });
        const { result } = renderSubject();

        await waitFor(() => {
            expect(result.current.tempBudgetLines).toHaveLength(1);
        });
        // A non-PLANNED changed line is out of the flag's scope → approval still required.
        expect(result.current.requiresFinancialApproval).toBe(true);
    });

    it("edits a budget line, matching the original by id rather than a stale array index", () => {
        // tempBudgetLines and the `budgetLines` prop are independently-ordered arrays that can
        // drift out of index-alignment after any add/delete/duplicate — put the target BLI at a
        // different position in each to prove the lookup is id-based, not index-based (issue: the
        // old handleEditBLI indexed `budgetLines[budgetLineBeingEdited]` using an index derived
        // from a lookup into the unrelated tempBudgetLines array).
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            budget_line_items: [
                { id: "extra-1", amount: 1, date_needed: "2026-01-01", can_id: 1, status: "DRAFT" },
                { id: "target", amount: 500, date_needed: "2026-01-01", can_id: 1, status: "DRAFT" }
            ]
        });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [
                    { id: "target", amount: 500, date_needed: "2026-01-01", can_id: 1, status: "DRAFT" },
                    { id: "extra-1", amount: 1, date_needed: "2026-01-01", can_id: 1, status: "DRAFT" }
                ],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 1, agreement_type: "GRANT", display_name: "AGR-1" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                true,
                "Save & Exit",
                1
            )
        );

        act(() => {
            result.current.handleSetBudgetLineForEditingById("target");
        });

        act(() => {
            result.current.setEnteredAmount(999);
        });

        act(() => {
            result.current.handleEditBLI({ preventDefault: vi.fn() });
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: expect.objectContaining({
                id: "target",
                financialSnapshot: expect.objectContaining({ originalAmount: 500 })
            })
        });
    });

    it("preserves a sub-component grouping label on edit when the SC number is unchanged (regression)", () => {
        // The BLI belongs to a sub-component SC ("2-A"), which is only representable via
        // serviceComponentGroupingLabel — services_component_number alone can't carry the
        // sub-component suffix. Editing an unrelated field (amount) must not clobber that
        // label with a bare "2", or addServiceComponentIdToBLI will fail to match the SC on
        // save and silently null out services_component_id.
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            budget_line_items: [
                {
                    id: "target",
                    amount: 500,
                    date_needed: "2026-01-01",
                    can_id: 1,
                    status: "DRAFT",
                    services_component_number: 2,
                    serviceComponentGroupingLabel: "2-A"
                }
            ]
        });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [
                    {
                        id: "target",
                        amount: 500,
                        date_needed: "2026-01-01",
                        can_id: 1,
                        status: "DRAFT",
                        services_component_number: 2,
                        serviceComponentGroupingLabel: "2-A"
                    }
                ],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 1, agreement_type: "CONTRACT", display_name: "AGR-1" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                true,
                "Save & Exit",
                1
            )
        );

        act(() => {
            result.current.handleSetBudgetLineForEditingById("target");
        });

        act(() => {
            result.current.setEnteredAmount(999);
        });

        act(() => {
            result.current.handleEditBLI({ preventDefault: vi.fn() });
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: expect.objectContaining({
                id: "target",
                services_component_number: 2,
                serviceComponentGroupingLabel: "2-A"
            })
        });
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

    it("validates each BLI against its current services component's PoP window (derived live)", async () => {
        const suiteModule = await import("./suite");
        suiteModule.default.run.mockImplementation(() => ({
            getErrors: () => ({}),
            hasErrors: () => false,
            isValid: () => true
        }));

        // A BLI linked to SC id 11, which carries a PoP window on the current services components.
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            services_components: [{ id: 11, number: 1, period_start: "2044-01-01", period_end: "2044-12-31" }],
            budget_line_items: [
                {
                    id: "bli-1",
                    services_component_id: 11,
                    date_needed: "2044-06-15",
                    can_id: 5,
                    amount: 100,
                    in_review: false
                }
            ]
        });

        renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                true,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 1, agreement_type: "CONTRACT", display_name: "AGR-1" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "agreement",
                true,
                true,
                "Save & Exit",
                1
            )
        );

        // The suite must receive the BLI enriched with its SC's PoP window, derived live from
        // the current services components (not baked into editor state) so SC edits stay in sync.
        expect(suiteModule.default.run).toHaveBeenCalledWith({
            budgetLines: [
                expect.objectContaining({
                    id: "bli-1",
                    sc_period_start: "2044-01-01",
                    sc_period_end: "2044-12-31"
                })
            ]
        });
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
            deleted_services_components_ids: [],
            grant_numbers: [],
            deleted_grant_numbers_ids: [],
            budget_line_items: [],
            deleted_budget_line_items_ids: []
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
            deleted_services_components_ids: [],
            grant_numbers: [],
            deleted_grant_numbers_ids: [],
            budget_line_items: [],
            deleted_budget_line_items_ids: []
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

    describe("delete routed to approval (issue #5819 / PR #5832)", () => {
        // BLI_STATUS is mocked above as { DRAFT: "DRAFT", PLANNED: "PLANNED", EXECUTING: "IN_EXECUTION" }.
        const superUserState = {
            auth: { activeUser: { id: 1, is_superuser: true, roles: [{ name: "SYSTEM_OWNER" }] } }
        };

        // A budget line as it would arrive from the API (has created_on → treated as existing).
        const existingBli = (status) => ({
            id: 100,
            status,
            created_on: "2026-01-15",
            amount: 1000,
            services_component_id: 11,
            can: { id: 22, display_name: "CAN 22" },
            can_id: 22,
            date_needed: "2026-01-01"
        });

        const deleteFirstTempBudgetLine = (result) => {
            const bliId = result.current.tempBudgetLines[0].id;
            act(() => {
                result.current.handleDeleteBudgetLine(bliId);
            });
            act(() => {
                result.current.modalProps.handleConfirm();
            });
        };

        it("deleting a PLANNED line queues an approval message, not 'successfully deleted'", () => {
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [existingBli("PLANNED")]
            });
            const { result } = renderSubject();
            setAlertMock.mockClear();

            deleteFirstTempBudgetLine(result);

            expect(setAlertMock).toHaveBeenCalledTimes(1);
            const alert = setAlertMock.mock.calls[0][0];
            expect(alert.type).toBe("success");
            expect(alert.isToastMessage).toBe(true);
            expect(alert.message).toMatch(/approval/i);
            expect(alert.message).not.toMatch(/successfully deleted/i);
        });

        it("deleting a DRAFT line still reports an immediate deletion", () => {
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [existingBli("DRAFT")]
            });
            const { result } = renderSubject();
            setAlertMock.mockClear();

            deleteFirstTempBudgetLine(result);

            expect(setAlertMock).toHaveBeenCalledTimes(1);
            const alert = setAlertMock.mock.calls[0][0];
            expect(alert.message).toMatch(/successfully deleted/i);
            expect(alert.message).not.toMatch(/approval/i);
        });

        it("a super user's PLANNED delete reports an immediate deletion (hard delete)", () => {
            useSelectorMock.mockImplementation((selector) => selector(superUserState));
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [existingBli("PLANNED")]
            });
            const { result } = renderSubject();
            setAlertMock.mockClear();

            deleteFirstTempBudgetLine(result);

            const alert = setAlertMock.mock.calls[0][0];
            expect(alert.message).toMatch(/successfully deleted/i);
        });

        it("saving after a PLANNED delete shows 'Changes Sent to Approval', not 'Agreement Updated'", async () => {
            deleteBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
            updateBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
            // That shared data's services_component has no created_on, so the flow treats it as new and
            // calls addServicesComponent().unwrap() before the BLI work; mock it so the save completes.
            addServicesComponentMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 11, number: 1 }) });
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [existingBli("PLANNED")]
            });
            const { result, rerender } = renderSubject({
                // showSuccessMessage looks up each deleted id in the `budgetLines` prop (the
                // original, pre-edit list) to read its status — must include the line being deleted.
                budgetLines: [existingBli("PLANNED")],
                selectedAgreement: { id: 1, agreement_type: "CONTRACT" },
                continueOverRide: undefined
            });
            deleteFirstTempBudgetLine(result);
            // The delete handler dispatches DELETE_BUDGET_LINE_ITEM; dispatch is mocked and does not
            // mutate state, so simulate the reducer removing the line from budget_line_items and
            // recording its bare id in deleted_budget_line_items_ids (mirrors the real
            // AgreementEditorContext reducer, which stores action.payload.id), then rerender so
            // handleSave's closure sees the update before the save reads deletedBudgetLines.
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [],
                deleted_budget_line_items_ids: [existingBli("PLANNED").id]
            });
            rerender();
            setAlertMock.mockClear();

            await act(async () => {
                await result.current.handleSave(false);
            });

            const successCall = setAlertMock.mock.calls.map((c) => c[0]).find((a) => a.type === "success" && a.heading);
            expect(successCall).toBeDefined();
            expect(successCall.heading).toBe("Changes Sent to Approval");
            expect(deleteBudgetLineItemMock).toHaveBeenCalled();
        });

        it("saving after a DRAFT delete shows 'Agreement Updated'", async () => {
            deleteBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
            updateBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
            // That shared data's services_component has no created_on, so the flow treats it as new and
            // calls addServicesComponent().unwrap() before the BLI work; mock it so the save completes.
            addServicesComponentMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 11, number: 1 }) });
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [existingBli("DRAFT")]
            });
            const { result, rerender } = renderSubject({
                // showSuccessMessage looks up each deleted id in the `budgetLines` prop (the
                // original, pre-edit list) to read its status — must include the line being deleted.
                budgetLines: [existingBli("DRAFT")],
                selectedAgreement: { id: 1, agreement_type: "CONTRACT" },
                continueOverRide: undefined
            });
            deleteFirstTempBudgetLine(result);
            // See the PLANNED-delete test above for why this simulates the reducer directly and
            // rerenders so handleSave's closure sees the update.
            useEditAgreementMock.mockReturnValue({
                ...editAgreementMockData,
                budget_line_items: [],
                deleted_budget_line_items_ids: [existingBli("DRAFT").id]
            });
            rerender();
            setAlertMock.mockClear();

            await act(async () => {
                await result.current.handleSave(false);
            });

            const successCall = setAlertMock.mock.calls.map((c) => c[0]).find((a) => a.type === "success" && a.heading);
            expect(successCall).toBeDefined();
            expect(successCall.heading).toBe("Agreement Updated");
        });
    });

    it("flushes grant number create, update, and delete to the API when editing an existing grant agreement", async () => {
        useEditAgreementMock.mockReturnValue({
            agreement: { id: 42, team_members: [] },
            services_components: [],
            deleted_services_components_ids: [],
            grant_numbers: [
                {
                    number: 1,
                    description: "New GN",
                    period_start: "2026-01-01",
                    period_end: "2026-12-31",
                    display_title: "Grant 1",
                    popStartDate: "01/01/2026",
                    popEndDate: "12/31/2026",
                    mode: "add"
                },
                {
                    id: 55,
                    number: 2,
                    description: "Existing GN",
                    period_start: "2026-06-01",
                    period_end: "2027-05-31",
                    display_title: "Grant 2",
                    created_on: "2026-01-15",
                    has_changed: true,
                    popStartDate: "06/01/2026",
                    popEndDate: "05/31/2027",
                    mode: "edit"
                }
            ],
            deleted_grant_numbers_ids: [99],
            budget_line_items: [],
            deleted_budget_line_items_ids: []
        });

        addGrantNumberMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 66, number: 1 }) });
        updateGrantNumberMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 55, number: 2 }) });
        deleteGrantNumberMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 42, agreement_type: "GRANT", display_name: "AGR-42" },
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

        // New grant number created without UI-only fields.
        expect(addGrantNumberMock).toHaveBeenCalled();
        const createdGn = addGrantNumberMock.mock.calls[0][0];
        expect(createdGn).not.toHaveProperty("has_changed");
        expect(createdGn).not.toHaveProperty("popStartDate");
        expect(createdGn).not.toHaveProperty("popEndDate");
        expect(createdGn).not.toHaveProperty("mode");
        expect(createdGn).not.toHaveProperty("display_title");
        expect(createdGn).toHaveProperty("number", 1);

        // Changed grant number PATCHed.
        expect(updateGrantNumberMock).toHaveBeenCalled();
        const updateGnCall = updateGrantNumberMock.mock.calls[0][0];
        expect(updateGnCall.id).toBe(55);
        expect(updateGnCall.data).not.toHaveProperty("has_changed");
        expect(updateGnCall.data).toHaveProperty("number", 2);

        // Removed grant number deleted.
        expect(deleteGrantNumberMock).toHaveBeenCalledWith(99);
    });

    it("reassigns a grant BLI to the selected grant number on edit (regression: stale grant_number_id)", () => {
        // A persisted BLI linked to grant number #1 (grant_number_id 10). The user opens it for
        // editing and picks grant number #2 (id 20) in the dropdown. handleEditBLI must stamp the
        // NEW grant_number_id — spreading the original BLI alone would keep the stale id 10, and
        // both save paths key off grant_number_id (the non-bundle addGrantNumberIdToBLI resolves
        // by id; the bundle dirty-check compares it), silently dropping the reassignment.
        const targetBli = {
            id: "target",
            amount: 500,
            date_needed: "2026-01-01",
            can_id: 1,
            status: "DRAFT",
            grant_number_id: 10,
            grant_number_number: 1
        };
        useEditAgreementMock.mockReturnValue({
            ...editAgreementMockData,
            grant_numbers: [
                { id: 10, number: 1, created_on: "2026-01-01" },
                { id: 20, number: 2, created_on: "2026-01-01" }
            ],
            budget_line_items: [targetBli]
        });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [targetBli],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 1, agreement_type: "GRANT", display_name: "AGR-1" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                true,
                "Save & Exit",
                1
            )
        );

        act(() => {
            result.current.handleSetBudgetLineForEditingById("target");
        });

        // Simulate the grant-number dropdown reassigning the BLI to grant number #2.
        act(() => {
            result.current.setGrantNumberNumber(2);
        });

        act(() => {
            result.current.handleEditBLI({ preventDefault: vi.fn() });
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: expect.objectContaining({
                id: "target",
                grant_number_number: 2,
                grant_number_id: 20
            })
        });
    });

    it("disassociates a grant BLI (saves with grant_number_id: null) when its grant number can't be resolved", async () => {
        // Grant agreement with a BLI that references grant number 7, which is no longer present
        // in grant_numbers (deleted mid-edit). The save should succeed and disassociate the BLI,
        // mirroring how addServiceComponentIdToBLI silently nulls an unresolved SC link.
        useEditAgreementMock.mockReturnValue({
            agreement: { id: 42, team_members: [] },
            services_components: [],
            deleted_services_components_ids: [],
            grant_numbers: [],
            deleted_grant_numbers_ids: [],
            budget_line_items: [],
            deleted_budget_line_items_ids: []
        });

        addBudgetLineItemMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });

        const { result } = renderHook(() =>
            useCreateBLIsAndSCs(
                true,
                false,
                [],
                vi.fn(),
                goBackMock,
                vi.fn(),
                { id: 42, agreement_type: "GRANT", display_name: "AGR-42" },
                { fee_percentage: 5, abbr: "PSC" },
                setIsEditModeMock,
                "none",
                true,
                false,
                "Save & Exit",
                1
            )
        );

        // Inject a NEW grant BLI (no created_on) carrying a grant_number_number that no persisted
        // grant number resolves to. This routes through addGrantNumberIdToBLI during creation.
        act(() => {
            result.current.tempBudgetLines.push({
                id: 100,
                grant_number_number: 7,
                amount: 500,
                status: "DRAFT"
            });
        });

        await act(async () => {
            await result.current.handleSave(false);
        });

        // BLI is saved with grant_number_id: null — disassociated, not errored.
        expect(addBudgetLineItemMock).toHaveBeenCalledWith(expect.objectContaining({ grant_number_id: null }));
        expect(setAlertMock).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });
});

describe("isDeletionRoutedToApproval", () => {
    // Uses the real BLI_STATUS values (EXECUTING === "IN_EXECUTION"), mirrored in the mock above.
    it("returns true for a non-super user deleting a PLANNED line", () => {
        expect(isDeletionRoutedToApproval({ status: "PLANNED" }, false)).toBe(true);
    });

    it("returns true for a non-super user deleting an IN_EXECUTION line", () => {
        expect(isDeletionRoutedToApproval({ status: "IN_EXECUTION" }, false)).toBe(true);
    });

    it("returns false for a DRAFT line", () => {
        expect(isDeletionRoutedToApproval({ status: "DRAFT" }, false)).toBe(false);
    });

    it("returns false for OBLIGATED / PLANNED_MOD (not approval-routed deletes)", () => {
        expect(isDeletionRoutedToApproval({ status: "OBLIGATED" }, false)).toBe(false);
        expect(isDeletionRoutedToApproval({ status: "PLANNED_MOD" }, false)).toBe(false);
    });

    it("returns false for a super user regardless of status", () => {
        expect(isDeletionRoutedToApproval({ status: "PLANNED" }, true)).toBe(false);
        expect(isDeletionRoutedToApproval({ status: "IN_EXECUTION" }, true)).toBe(false);
    });

    it("returns false for a null/undefined budget line", () => {
        expect(isDeletionRoutedToApproval(undefined, false)).toBe(false);
        expect(isDeletionRoutedToApproval(null, false)).toBe(false);
    });
});
