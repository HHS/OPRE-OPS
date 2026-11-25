import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../store";
import useRequestAwardApproval from "./RequestAwardApproval.hooks";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetProcurementTrackersByAgreementIdQuery: vi.fn(),
    useUpdateProcurementTrackerStepMutation: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
    useGetVendorsQuery: vi.fn(),
    useUpdateBudgetLineItemMutation: vi.fn()
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn(() => "Test User")
}));

vi.mock("../../../helpers/utils", () => ({
    getLocalISODate: vi.fn(() => "2025-01-01"),
    formatDateForApi: vi.fn((d) => d)
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    groupByServicesComponent: vi.fn(() => [])
}));

vi.mock("../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants", () => ({
    PROCUREMENT_STEP_STATUS: { COMPLETE: "COMPLETE", SKIPPED: "SKIPPED" },
    PROCUREMENT_TRACKER_STATUS: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", COMPLETED: "COMPLETED" }
}));

vi.mock("./RequestAwardApproval.suite", () => {
    const mockSuite = vi.fn();
    mockSuite.run = vi.fn();
    mockSuite.get = vi.fn(() => ({
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false),
        isValid: vi.fn(() => true)
    }));
    mockSuite.reset = vi.fn();
    return { default: mockSuite };
});

const mockUseBlocker = vi.fn(() => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useBlocker: (...args) => mockUseBlocker(...args)
    };
});

import {
    useGetAgreementByIdQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetServicesComponentsListQuery,
    useGetVendorsQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";

const buildAgreement = (overrides = {}) => ({
    id: 1,
    name: "Test Agreement",
    agreement_type: "CONTRACT",
    budget_line_items: [],
    ...overrides
});

const setup = (agreementId = 1) => {
    const store = setupStore();
    const wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );

    useGetAgreementByIdQuery.mockReturnValue({ data: buildAgreement(), isLoading: false });
    useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({ data: [], isLoading: false });
    useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);
    useGetServicesComponentsListQuery.mockReturnValue({ data: [], isLoading: false });
    useGetVendorsQuery.mockReturnValue({ data: [], isLoading: false });
    useUpdateBudgetLineItemMutation.mockReturnValue([vi.fn(), {}]);

    return renderHook(() => useRequestAwardApproval(agreementId), { wrapper });
};

describe("useRequestAwardApproval — navigation blocker", () => {
    let mockProceed;
    let mockReset;

    beforeEach(() => {
        vi.clearAllMocks();
        mockProceed = vi.fn();
        mockReset = vi.fn();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: mockProceed, reset: mockReset });
    });

    it("does not block navigation when form is clean", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });
        const { result } = setup();
        await waitFor(() => expect(result.current).toBeDefined());
        const shouldBlock = capturedCb({
            currentLocation: { pathname: "/agreements/1/award" },
            nextLocation: { pathname: "/agreements/1/details" }
        });
        expect(shouldBlock).toBe(false);
    });

    it("blocks navigation when form has changes", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });
        const { result } = setup();
        await waitFor(() => expect(result.current).toBeDefined());
        act(() => {
            result.current.setNotes("some note");
        });
        await waitFor(() => {
            const shouldBlock = capturedCb({
                currentLocation: { pathname: "/agreements/1/award" },
                nextLocation: { pathname: "/agreements/1/details" }
            });
            expect(shouldBlock).toBe(true);
        });
    });

    it("shows correct award-specific copy when blocker fires", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup();
        await waitFor(() => {
            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(
                "Are you sure you want to cancel your award request? Your progress will not be saved."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Award");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue editing");
        });
    });

    it("proceeds with navigation and hides modal on handleConfirm", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup();
        await waitFor(() => expect(result.current.showModal).toBe(true));
        result.current.modalProps.handleConfirm();
        await waitFor(() => {
            expect(result.current.showModal).toBe(false);
            expect(mockProceed).toHaveBeenCalled();
            expect(mockReset).not.toHaveBeenCalled();
        });
    });

    it("resets blocker and hides modal on closeModal", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup();
        await waitFor(() => expect(result.current.showModal).toBe(true));
        result.current.modalProps.closeModal();
        await waitFor(() => {
            expect(result.current.showModal).toBe(false);
            expect(mockReset).toHaveBeenCalled();
            expect(mockProceed).not.toHaveBeenCalled();
        });
    });
});

describe("useRequestAwardApproval — additional award fields (OPS-5892)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("seeds agreementTitle from the agreement name and defaults modification # to Base", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));
        expect(result.current.modificationNumber).toBe("Base");
        expect(result.current.purchaseOrderNumber).toBe("");
        expect(result.current.taskOrderNumber).toBe("");
    });

    it("does not flag the blocker on a pristine seeded form (hasChanged regression)", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });
        const { result } = setup();
        // Wait for the title to seed from agreement.name before evaluating the predicate.
        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));
        const shouldBlock = capturedCb({
            currentLocation: { pathname: "/agreements/1/award" },
            nextLocation: { pathname: "/agreements/1/details" }
        });
        expect(shouldBlock).toBe(false);
    });

    it("blocks navigation once a new required field is edited", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });
        const { result } = setup();
        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));
        act(() => {
            result.current.setPurchaseOrderNumber("ODN-123");
        });
        await waitFor(() => {
            const shouldBlock = capturedCb({
                currentLocation: { pathname: "/agreements/1/award" },
                nextLocation: { pathname: "/agreements/1/details" }
            });
            expect(shouldBlock).toBe(true);
        });
    });

    it("includes the new award fields in the step PATCH payload on submit", async () => {
        const store = setupStore();
        const wrapper = ({ children }) => (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const updateStep = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
        useGetAgreementByIdQuery.mockReturnValue({ data: buildAgreement(), isLoading: false });
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: { data: [{ status: "ACTIVE", steps: [{ step_number: 6, id: 60 }] }] },
            isLoading: false
        });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([updateStep, {}]);
        useGetServicesComponentsListQuery.mockReturnValue({ data: [], isLoading: false });
        useGetVendorsQuery.mockReturnValue({ data: [{ id: 7, name: "Vendor 7" }], isLoading: false });
        useUpdateBudgetLineItemMutation.mockReturnValue([vi.fn(), {}]);

        const { result } = renderHook(() => useRequestAwardApproval(1), { wrapper });
        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));

        act(() => {
            result.current.setSelectedVendor({ id: 7, name: "Vendor 7" });
            result.current.setContractNumber("C-1");
            result.current.setAwardAmount("1000");
            result.current.setAwardDate("01/01/2025");
            result.current.setAgreementTitle("Signed Award Title");
            result.current.setModificationNumber("P00002");
            result.current.setPurchaseOrderNumber("ODN-9");
            result.current.setTaskOrderNumber("TO-4");
        });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(updateStep).toHaveBeenCalledWith(
            expect.objectContaining({
                stepId: 60,
                data: expect.objectContaining({
                    agreement_title: "Signed Award Title",
                    modification_number: "P00002",
                    purchase_order_number: "ODN-9",
                    task_order_number: "TO-4"
                })
            })
        );
    });
});

describe("useRequestAwardApproval — reseeding after a declined request (OPS-5892)", () => {
    /**
     * Render the hook with a step 6 that already holds a previous submission's values,
     * as it does when the Budget Team declines and the COR returns to resubmit.
     */
    const setupWithStep6 = (step6Overrides, trackersOverride) => {
        const store = setupStore();
        const wrapper = ({ children }) => (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        useGetAgreementByIdQuery.mockReturnValue({ data: buildAgreement(), isLoading: false });
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: {
                data: trackersOverride ?? [{ status: "ACTIVE", steps: [{ step_number: 6, id: 60, ...step6Overrides }] }]
            },
            isLoading: false
        });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);
        useGetServicesComponentsListQuery.mockReturnValue({ data: [], isLoading: false });
        useGetVendorsQuery.mockReturnValue({ data: [], isLoading: false });
        useUpdateBudgetLineItemMutation.mockReturnValue([vi.fn(), {}]);

        return renderHook(() => useRequestAwardApproval(1), { wrapper });
    };

    it("starts a contract mod's award on the next Modification #, never Base (OPS-6513)", async () => {
        const initialAward = {
            id: 1,
            status: "COMPLETED",
            award_type: "NEW_AWARD",
            created_on: "2025-01-01T00:00:00",
            steps: [{ step_number: 6, id: 10, modification_number: "Base" }]
        };
        const earlierMod = {
            id: 2,
            status: "COMPLETED",
            award_type: "MODIFICATION",
            agreement_mod_id: 5,
            created_on: "2026-01-01T00:00:00",
            steps: [{ step_number: 6, id: 20, modification_number: "P00001" }]
        };
        const currentMod = {
            id: 3,
            status: "ACTIVE",
            award_type: "MODIFICATION",
            agreement_mod_id: 6,
            created_on: "2026-11-02T00:00:00",
            steps: [{ step_number: 6, id: 30, modification_number: null }]
        };

        const { result } = setupWithStep6(undefined, [currentMod, earlierMod, initialAward]);

        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));
        expect(result.current.modificationNumber).toBe("P00002");
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("restores previously submitted values instead of wiping them back to defaults", async () => {
        const { result } = setupWithStep6({
            agreement_title: "Previously Proposed Title",
            modification_number: "P00003",
            purchase_order_number: "ODN-77",
            task_order_number: "TO-88"
        });

        await waitFor(() => expect(result.current.agreementTitle).toBe("Previously Proposed Title"));
        expect(result.current.modificationNumber).toBe("P00003");
        expect(result.current.purchaseOrderNumber).toBe("ODN-77");
        expect(result.current.taskOrderNumber).toBe("TO-88");
    });

    it("does not flag the blocker on a form freshly seeded from a declined request", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });

        const { result } = setupWithStep6({
            agreement_title: "Previously Proposed Title",
            modification_number: "P00003",
            purchase_order_number: "ODN-77",
            task_order_number: "TO-88"
        });
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));

        const shouldBlock = capturedCb({
            currentLocation: { pathname: "/agreements/1/award" },
            nextLocation: { pathname: "/agreements/1/details" }
        });
        expect(shouldBlock).toBe(false);
    });

    it("falls back to Base when a stored modification # is an empty string", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });

        const { result } = setupWithStep6({ modification_number: "", purchase_order_number: "" });
        await waitFor(() => expect(result.current.agreementTitle).toBe("Test Agreement"));

        // An empty stored value must not leave the <select> on a value it has no option for,
        // and must not make an untouched form look dirty.
        expect(result.current.modificationNumber).toBe("Base");
        expect(
            capturedCb({
                currentLocation: { pathname: "/agreements/1/award" },
                nextLocation: { pathname: "/agreements/1/details" }
            })
        ).toBe(false);
    });

    it("ignores whitespace-only edits, which submit as trimmed no-ops", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });

        const { result } = setupWithStep6({ purchase_order_number: "ODN-77" });
        await waitFor(() => expect(result.current.purchaseOrderNumber).toBe("ODN-77"));

        act(() => {
            result.current.setPurchaseOrderNumber("ODN-77  ");
        });

        await waitFor(() => expect(result.current.purchaseOrderNumber).toBe("ODN-77  "));
        expect(
            capturedCb({
                currentLocation: { pathname: "/agreements/1/award" },
                nextLocation: { pathname: "/agreements/1/details" }
            })
        ).toBe(false);
    });
});

describe("useRequestAwardApproval — CLINs required only on the lines this award covers (OPS-6513)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    // An awarded contract with a mod: the original award's Obligated line, a Planned line that
    // belongs to no award yet, and the mod's own Executing line. Only the mod's line has no CLIN
    // picked yet in the "mod" cases below.
    const obligatedLine = { id: 101, status: "OBLIGATED", clin_id: null };
    const plannedLine = { id: 102, status: "PLANNED", clin_id: null };
    const modLine = { id: 103, status: "IN_EXECUTION", clin_id: null };
    const modTracker = {
        id: 2,
        status: "ACTIVE",
        award_type: "MODIFICATION",
        agreement_mod_id: 9,
        budget_line_item_ids: [modLine.id],
        steps: [{ step_number: 6, id: 60 }]
    };

    const render = (trackers, budgetLineItems) => {
        const store = setupStore();
        const wrapper = ({ children }) => (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
        useGetAgreementByIdQuery.mockReturnValue({
            data: buildAgreement({ budget_line_items: budgetLineItems }),
            isLoading: false
        });
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({ data: { data: trackers }, isLoading: false });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);
        useGetServicesComponentsListQuery.mockReturnValue({ data: [], isLoading: false });
        useGetVendorsQuery.mockReturnValue({ data: [], isLoading: false });
        useUpdateBudgetLineItemMutation.mockReturnValue([vi.fn(), {}]);
        return renderHook(() => useRequestAwardApproval(1), { wrapper });
    };

    it("a mod's award isn't blocked by other lines on the agreement that have no CLIN", async () => {
        const { result } = render([modTracker], [obligatedLine, plannedLine, { ...modLine, clin_id: 7 }]);
        await waitFor(() => expect(result.current.allBudgetLines).toHaveLength(3));
        expect(result.current.hasMissingCLINs).toBe(false);
    });

    it("a mod's award still needs a CLIN on its own line, and picking one clears it", async () => {
        const { result } = render([modTracker], [obligatedLine, plannedLine, modLine]);
        await waitFor(() => expect(result.current.allBudgetLines).toHaveLength(3));
        expect(result.current.hasMissingCLINs).toBe(true);

        act(() => result.current.setClinAssignments({ [modLine.id]: 7 }));
        expect(result.current.hasMissingCLINs).toBe(false);
    });

    it("the initial award still needs a CLIN on every non-Draft line", async () => {
        const initialTracker = { id: 1, status: "ACTIVE", steps: [{ step_number: 6, id: 60 }] };
        const { result } = render([initialTracker], [{ ...modLine, clin_id: 7 }, plannedLine]);
        await waitFor(() => expect(result.current.allBudgetLines).toHaveLength(2));
        expect(result.current.hasMissingCLINs).toBe(true);
    });
});
