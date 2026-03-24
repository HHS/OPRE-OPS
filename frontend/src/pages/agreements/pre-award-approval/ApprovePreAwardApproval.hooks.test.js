import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../../../store";
import useApprovePreAwardApproval from "./ApprovePreAwardApproval.hooks";

// Mock the API hooks
vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
    useUpdateProcurementTrackerStepMutation: vi.fn(),
    useGetDocumentsByAgreementIdQuery: vi.fn(),
    useGetProcurementTrackersByAgreementIdQuery: vi.fn()
}));

// Mock other hooks
vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../../helpers/budgetLines.helpers", () => ({
    groupByServicesComponent: vi.fn()
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";

const wrapper = ({ children }) => (
    <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
    </Provider>
);

describe("useApprovePreAwardApproval", () => {
    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        display_name: "Agreement 001",
        budget_line_items: [
            {
                id: 1,
                status: "IN_EXECUTION",
                can: {
                    portfolio: {
                        division: {
                            division_director_id: 100,
                            deputy_division_director_id: 101
                        }
                    }
                }
            }
        ]
    };

    const mockStep5 = {
        id: 5,
        step_number: 5,
        approval_requested: true,
        requestor_notes: "Please review",
        approval_status: null
    };

    const mockTrackerData = {
        data: [
            {
                status: "ACTIVE",
                steps: [{ step_number: 1 }, { step_number: 2 }, mockStep5]
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        useGetAgreementByIdQuery.mockReturnValue({
            data: mockAgreement,
            isLoading: false
        });

        useGetServicesComponentsListQuery.mockReturnValue({
            data: []
        });

        useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);

        useGetDocumentsByAgreementIdQuery.mockReturnValue({
            data: { documents: [] }
        });

        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: mockTrackerData
        });

        useGetUserFullNameFromId.mockReturnValue("John Doe");

        useAlert.mockReturnValue({
            setAlert: vi.fn()
        });

        groupByServicesComponent.mockReturnValue([]);
    });

    it("should return initial state correctly", () => {
        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.agreement).toEqual(mockAgreement);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reviewerNotes).toBe("");
        expect(result.current.showModal).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
        expect(result.current.submitError).toBe("");
    });

    it("should filter executing budget lines correctly", () => {
        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.executingBudgetLines).toHaveLength(1);
        expect(result.current.executingBudgetLines[0].status).toBe("IN_EXECUTION");
    });

    it("should extract step 5 data correctly", () => {
        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.requestorNotes).toBe("Please review");
    });

    it("should identify approval as not processed when status is null", () => {
        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.approvalAlreadyProcessed).toBe(false);
    });

    it("should identify approval as already processed when status is APPROVED", () => {
        const processedStep5 = { ...mockStep5, approval_status: "APPROVED" };
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: {
                data: [
                    {
                        status: "ACTIVE",
                        steps: [processedStep5]
                    }
                ]
            }
        });

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.approvalAlreadyProcessed).toBe(true);
    });

    it("should grant permission to BUDGET_TEAM users", () => {
        // Mock Redux store state for BUDGET_TEAM user
        const mockStore = {
            ...store,
            getState: () => ({
                auth: {
                    activeUser: {
                        id: 200,
                        roles: [{ name: "BUDGET_TEAM" }]
                    }
                }
            })
        };

        const customWrapper = ({ children }) => (
            <Provider store={mockStore}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper: customWrapper });

        expect(result.current.hasPermission).toBe(true);
    });

    it("should grant permission to SYSTEM_OWNER users", () => {
        const mockStore = {
            ...store,
            getState: () => ({
                auth: {
                    activeUser: {
                        id: 200,
                        roles: [{ name: "SYSTEM_OWNER" }]
                    }
                }
            })
        };

        const customWrapper = ({ children }) => (
            <Provider store={mockStore}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper: customWrapper });

        expect(result.current.hasPermission).toBe(true);
    });

    it("should grant permission to REVIEWER_APPROVER who is division director", () => {
        const mockStore = {
            ...store,
            getState: () => ({
                auth: {
                    activeUser: {
                        id: 100, // matches division_director_id
                        roles: [{ name: "REVIEWER_APPROVER" }]
                    }
                }
            })
        };

        const customWrapper = ({ children }) => (
            <Provider store={mockStore}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper: customWrapper });

        expect(result.current.hasPermission).toBe(true);
    });

    it("should grant permission to REVIEWER_APPROVER who is deputy division director", () => {
        const mockStore = {
            ...store,
            getState: () => ({
                auth: {
                    activeUser: {
                        id: 101, // matches deputy_division_director_id
                        roles: [{ name: "REVIEWER_APPROVER" }]
                    }
                }
            })
        };

        const customWrapper = ({ children }) => (
            <Provider store={mockStore}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper: customWrapper });

        expect(result.current.hasPermission).toBe(true);
    });

    it("should deny permission to users without required roles", () => {
        const mockStore = {
            ...store,
            getState: () => ({
                auth: {
                    activeUser: {
                        id: 999,
                        roles: [{ name: "VIEWER" }]
                    }
                }
            })
        };

        const customWrapper = ({ children }) => (
            <Provider store={mockStore}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper: customWrapper });

        expect(result.current.hasPermission).toBe(false);
    });

    it("should filter pre-award memo documents correctly", () => {
        useGetDocumentsByAgreementIdQuery.mockReturnValue({
            data: {
                documents: [
                    { id: 1, document_type: "PRE_AWARD_CONSENSUS_MEMO", document_name: "Memo.pdf" },
                    { id: 2, document_type: "OTHER", document_name: "Other.pdf" }
                ]
            }
        });

        const { result } = renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(result.current.preAwardMemoDocuments).toHaveLength(1);
        expect(result.current.preAwardMemoDocuments[0].document_type).toBe("PRE_AWARD_CONSENSUS_MEMO");
    });

    it("should call groupByServicesComponent with executing budget lines", () => {
        renderHook(() => useApprovePreAwardApproval(1), { wrapper });

        expect(groupByServicesComponent).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ status: "IN_EXECUTION" })]),
            []
        );
    });
});
