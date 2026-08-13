import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../../store";
import useApproveAwardApproval from "./ApproveAwardApproval.hooks";

// Mock API hooks
vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
    useGetGrantNumbersListQuery: vi.fn(),
    useUpdateProcurementTrackerStepMutation: vi.fn(),
    useGetDocumentsByAgreementIdQuery: vi.fn(),
    useGetProcurementTrackersByAgreementIdQuery: vi.fn()
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    groupByServicesComponent: vi.fn(),
    groupByGrantNumber: vi.fn(),
    budgetLinesTotal: vi.fn()
}));

const mockNavigate = vi.fn();
const mockUseBlocker = vi.fn(() => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useBlocker: (...args) => mockUseBlocker(...args)
    };
});

import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useGetGrantNumbersListQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import { groupByServicesComponent, groupByGrantNumber, budgetLinesTotal } from "../../../helpers/budgetLines.helpers";

const mockStep6 = {
    id: 6,
    step_number: 6,
    requestor_notes: "Please review",
    approval_status: null
};

const mockTrackerData = {
    data: [{ status: "ACTIVE", steps: [mockStep6] }]
};

const createWrapper = (store) => {
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
};

const setup = () => {
    const store = setupStore({ auth: { activeUser: { id: 1, roles: [{ name: "BUDGET_TEAM" }] } } });
    return renderHook(() => useApproveAwardApproval(1), { wrapper: createWrapper(store) });
};

beforeEach(() => {
    vi.clearAllMocks();
    mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() });

    useGetAgreementByIdQuery.mockReturnValue({
        data: { id: 1, name: "Test Agreement", display_name: "Test Agreement", budget_line_items: [] },
        isLoading: false
    });
    useGetServicesComponentsListQuery.mockReturnValue({ data: [] });
    useGetGrantNumbersListQuery.mockReturnValue({ data: [] });
    useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);
    useGetDocumentsByAgreementIdQuery.mockReturnValue({ data: { documents: [] } });
    useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({ data: mockTrackerData });
    useGetUserFullNameFromId.mockReturnValue("Test User");
    useAlert.mockReturnValue({ setAlert: vi.fn() });
    groupByServicesComponent.mockReturnValue([]);
    groupByGrantNumber.mockReturnValue([]);
    budgetLinesTotal.mockReturnValue(0);
});

describe("useApproveAwardApproval — handleCancel modal", () => {
    it("opens cancel modal with correct review-flow copy", () => {
        const { result } = setup();

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.heading).toContain("exit the review process");
        expect(result.current.modalProps.actionButtonText).toBe("Cancel");
        expect(result.current.modalProps.secondaryButtonText).toBe("Continue Reviewing");
    });

    it("navigates away on handleConfirm", () => {
        const { result } = setup();

        act(() => {
            result.current.handleCancel();
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(mockNavigate).toHaveBeenCalledWith("/agreements?filter=change-requests");
    });

    it("closes modal on closeModal without navigating", () => {
        const { result } = setup();

        act(() => {
            result.current.handleCancel();
        });
        act(() => {
            result.current.modalProps.closeModal();
        });

        expect(result.current.showModal).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

describe("useApproveAwardApproval — navigation blocker", () => {
    let mockProceed;
    let mockReset;

    beforeEach(() => {
        mockProceed = vi.fn();
        mockReset = vi.fn();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: mockProceed, reset: mockReset });
    });

    it("does not block navigation when obligated date is empty", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });

        const { result } = setup();
        await waitFor(() => expect(result.current).toBeDefined());

        const shouldBlock = capturedCb({
            currentLocation: { pathname: "/agreements/1/review-award" },
            nextLocation: { pathname: "/agreements" }
        });
        expect(shouldBlock).toBe(false);
    });

    it("blocks navigation when obligated date has been entered", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });

        const { result } = setup();
        await waitFor(() => expect(result.current).toBeDefined());

        act(() => {
            result.current.setObligatedDate("2026-08-12");
        });

        await waitFor(() => {
            const shouldBlock = capturedCb({
                currentLocation: { pathname: "/agreements/1/review-award" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(true);
        });
    });

    it("shows 'Save changes before leaving?' copy when blocker fires", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.showBlockerModal).toBe(true);
            expect(result.current.blockerModalProps.heading).toBe("Save changes before leaving?");
            expect(result.current.blockerModalProps.actionButtonText).toBe("Go back");
            expect(result.current.blockerModalProps.secondaryButtonText).toBe("Leave without saving");
        });
    });

    it("resets blocker and hides modal on handleConfirm (Go back)", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });

        const { result } = setup();
        await waitFor(() => expect(result.current.showBlockerModal).toBe(true));

        act(() => {
            result.current.blockerModalProps.handleConfirm();
        });

        await waitFor(() => {
            expect(result.current.showBlockerModal).toBe(false);
            expect(mockReset).toHaveBeenCalled();
            expect(mockProceed).not.toHaveBeenCalled();
        });
    });

    it("proceeds with navigation and hides modal on handleSecondary (Leave without saving)", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });

        const { result } = setup();
        await waitFor(() => expect(result.current.showBlockerModal).toBe(true));

        await act(async () => {
            await result.current.blockerModalProps.handleSecondary();
        });

        await waitFor(() => {
            expect(result.current.showBlockerModal).toBe(false);
            expect(mockProceed).toHaveBeenCalled();
            expect(mockReset).not.toHaveBeenCalled();
        });
    });

    it("resets blocker and hides modal on closeModal (Escape)", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });

        const { result } = setup();
        await waitFor(() => expect(result.current.showBlockerModal).toBe(true));

        act(() => {
            result.current.blockerModalProps.closeModal();
        });

        await waitFor(() => {
            expect(result.current.showBlockerModal).toBe(false);
            expect(mockReset).toHaveBeenCalled();
            expect(mockProceed).not.toHaveBeenCalled();
        });
    });
});
