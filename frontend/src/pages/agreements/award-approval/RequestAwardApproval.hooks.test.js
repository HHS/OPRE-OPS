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
    PROCUREMENT_STEP_STATUS: { COMPLETE: "COMPLETE" }
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
