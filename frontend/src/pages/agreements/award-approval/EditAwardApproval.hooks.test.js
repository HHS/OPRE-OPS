import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../store";
import useEditAwardApproval from "./EditAwardApproval.hooks";

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
    formatDateForApi: vi.fn((d) => d)
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    groupByServicesComponent: vi.fn(() => [])
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

const VENDORS = [{ id: 10, name: "Vendor 10", duns: "123456789" }];

const buildAgreement = (overrides = {}) => ({
    id: 1,
    name: "Current Agreement Name",
    agreement_type: "CONTRACT",
    budget_line_items: [],
    ...overrides
});

/**
 * A step 6 as returned once a COR has submitted an award approval request.
 */
const buildStep6 = (overrides = {}) => ({
    id: 60,
    step_number: 6,
    vendor_id: 10,
    contract_number: "GS-123",
    award_amount: 1500000,
    award_date: "2024-09-30",
    requestor_notes: "COR notes",
    agreement_title: "Submitted Award Title",
    modification_number: "P00003",
    purchase_order_number: "ODN-77",
    task_order_number: "TO-88",
    ...overrides
});

const BUDGET_TEAM_STATE = { auth: { activeUser: { id: 1, roles: [{ name: "BUDGET_TEAM" }] } } };

/**
 * Render the hook with a fully-populated step 6, as the Budget Team sees it on the edit page.
 * @param {Object} [options]
 * @param {Object} [options.step6] - step 6 overrides, or null to omit step 6 entirely.
 * @param {Object} [options.agreement] - agreement overrides.
 * @param {Function} [options.updateStep] - mock for the step PATCH mutation trigger.
 * @param {Object} [options.preloadedState] - Redux preloaded state.
 */
const setup = ({ step6 = {}, agreement = {}, updateStep, preloadedState = BUDGET_TEAM_STATE } = {}) => {
    const store = setupStore(preloadedState);
    const wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );

    const steps = step6 === null ? [] : [buildStep6(step6)];

    useGetAgreementByIdQuery.mockReturnValue({ data: buildAgreement(agreement), isLoading: false });
    useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
        data: { data: [{ status: "ACTIVE", steps }] },
        isLoading: false
    });
    useUpdateProcurementTrackerStepMutation.mockReturnValue([
        updateStep ?? vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
        {}
    ]);
    useGetServicesComponentsListQuery.mockReturnValue({ data: [], isLoading: false });
    useGetVendorsQuery.mockReturnValue({ data: VENDORS, isLoading: false });
    useUpdateBudgetLineItemMutation.mockReturnValue([vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}]);

    return renderHook(() => useEditAwardApproval(1), { wrapper });
};

describe("useEditAwardApproval — permissions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("grants access to the Budget Team", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.hasPermission).toBe(true));
    });

    it("denies access to a user without Budget Team or System Owner", async () => {
        const { result } = setup({
            preloadedState: { auth: { activeUser: { id: 2, roles: [{ name: "USER" }] } } }
        });
        await waitFor(() => expect(result.current.hasPermission).toBe(false));
    });
});

describe("useEditAwardApproval — seeding the additional award fields (OPS-5892)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("seeds all four fields from the submitted step 6 values", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.agreementTitle).toBe("Submitted Award Title"));
        expect(result.current.modificationNumber).toBe("P00003");
        expect(result.current.purchaseOrderNumber).toBe("ODN-77");
        expect(result.current.taskOrderNumber).toBe("TO-88");
    });

    it("seeds the existing award information fields alongside them", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.contractNumber).toBe("GS-123"));
        expect(result.current.selectedVendor?.id).toBe(10);
        expect(result.current.awardAmount).toBe("1500000");
        expect(result.current.awardDate).toBe("09/30/2024");
        expect(result.current.notes).toBe("COR notes");
    });

    it("falls back to the agreement name when a legacy row has no stored agreement title", async () => {
        const { result } = setup({ step6: { agreement_title: null } });
        await waitFor(() => expect(result.current.agreementTitle).toBe("Current Agreement Name"));
    });

    it("falls back to Base when a legacy row has no stored modification #", async () => {
        const { result } = setup({ step6: { modification_number: null } });
        await waitFor(() => expect(result.current.agreementTitle).toBe("Submitted Award Title"));
        expect(result.current.modificationNumber).toBe("Base");
    });
});

describe("useEditAwardApproval — hasChanged against seeded values (OPS-5892)", () => {
    const NAVIGATION = {
        currentLocation: { pathname: "/agreements/1/edit-award" },
        nextLocation: { pathname: "/agreements/1/review-award" }
    };

    /**
     * Capture the useBlocker predicate so hasChanged can be evaluated directly.
     */
    const setupWithBlockerPredicate = (options) => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: vi.fn(), reset: vi.fn() };
        });
        const view = setup(options);
        return { ...view, shouldBlock: () => capturedCb(NAVIGATION) };
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("does not flag a pristine seeded page as dirty", async () => {
        const { result, shouldBlock } = setupWithBlockerPredicate();
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));
        expect(shouldBlock()).toBe(false);
    });

    it("does not flag a pristine page seeded from the agreement-name fallback", async () => {
        const { result, shouldBlock } = setupWithBlockerPredicate({ step6: { agreement_title: null } });
        await waitFor(() => expect(result.current.agreementTitle).toBe("Current Agreement Name"));
        expect(shouldBlock()).toBe(false);
    });

    it.each([
        ["agreementTitle", "setAgreementTitle", "Revised Award Title"],
        ["modificationNumber", "setModificationNumber", "P00009"],
        ["purchaseOrderNumber", "setPurchaseOrderNumber", "ODN-99"],
        ["taskOrderNumber", "setTaskOrderNumber", "TO-99"]
    ])("flags the page dirty once %s is edited", async (_field, setter, value) => {
        const { result, shouldBlock } = setupWithBlockerPredicate();
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));

        act(() => {
            result.current[setter](value);
        });

        await waitFor(() => expect(shouldBlock()).toBe(true));
    });

    it("ignores whitespace-only edits, which save as trimmed no-ops", async () => {
        const { result, shouldBlock } = setupWithBlockerPredicate();
        await waitFor(() => expect(result.current.purchaseOrderNumber).toBe("ODN-77"));

        act(() => {
            result.current.setPurchaseOrderNumber("  ODN-77  ");
        });

        await waitFor(() => expect(result.current.purchaseOrderNumber).toBe("  ODN-77  "));
        expect(shouldBlock()).toBe(false);
    });
});

describe("useEditAwardApproval — save", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });
    });

    it("includes the four new award fields in the step PATCH payload", async () => {
        const updateStep = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
        const { result } = setup({ updateStep });
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));

        act(() => {
            result.current.setAgreementTitle("  Revised Award Title  ");
            result.current.setModificationNumber("P00009");
            result.current.setPurchaseOrderNumber("  ODN-99  ");
            result.current.setTaskOrderNumber("  TO-99  ");
        });

        await act(async () => {
            await result.current.handleSave();
        });

        expect(updateStep).toHaveBeenCalledWith({
            stepId: 60,
            data: expect.objectContaining({
                agreement_title: "Revised Award Title",
                modification_number: "P00009",
                purchase_order_number: "ODN-99",
                task_order_number: "TO-99"
            })
        });
    });

    it("does not re-submit the request — no approval fields in the payload", async () => {
        const updateStep = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
        const { result } = setup({ updateStep });
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));

        await act(async () => {
            await result.current.handleSave();
        });

        const payload = updateStep.mock.calls[0][0].data;
        expect(payload).not.toHaveProperty("approval_requested");
        expect(payload).not.toHaveProperty("approval_status");
    });

    it("reports an error and skips the PATCH when step 6 is missing", async () => {
        const updateStep = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
        const { result } = setup({ step6: null, updateStep });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleSave();
        });

        expect(updateStep).not.toHaveBeenCalled();
        expect(result.current.submitError).toBe("Step 6 not found for this agreement.");
    });

    it("surfaces a save failure and clears the submitting state", async () => {
        const updateStep = vi.fn(() => ({ unwrap: () => Promise.reject({ data: { message: "Boom" } }) }));
        const { result } = setup({ updateStep });
        await waitFor(() => expect(result.current.taskOrderNumber).toBe("TO-88"));

        await act(async () => {
            await result.current.handleSave();
        });

        expect(result.current.submitError).toBe("Boom");
        expect(result.current.isSubmitting).toBe(false);
    });
});
