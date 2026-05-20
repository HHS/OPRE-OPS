import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../../store";
import useReviewBudgetTeamRequisition from "./ReviewBudgetTeamRequisition.hooks";

// Mock the API hooks
vi.mock("../../../api/opsAPI", () => ({
    useUpdateProcurementTrackerStepMutation: vi.fn()
}));

// Mock other hooks
vi.mock("../../../hooks/use-alert.hooks", () => ({
    default: vi.fn()
}));

vi.mock("./usePreAwardApprovalData", () => ({
    default: vi.fn()
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import usePreAwardApprovalData from "./usePreAwardApprovalData";

// Helper to create test store with auth state
const createStoreWithAuth = (roles = [{ name: "BUDGET_TEAM" }]) => {
    const store = setupStore();
    store.dispatch({
        type: "auth/setActiveUser",
        payload: {
            activeUser: {
                id: 1,
                email: "test@example.com",
                roles: roles
            }
        }
    });
    return store;
};

describe("useReviewBudgetTeamRequisition", () => {
    let mockUpdateProcurementTrackerStep;
    let mockSetAlert;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUpdateProcurementTrackerStep = vi.fn();
        mockSetAlert = vi.fn();

        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockUpdateProcurementTrackerStep, {}]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });

        // Default mock for usePreAwardApprovalData
        usePreAwardApprovalData.mockReturnValue({
            agreement: { id: 1, name: "Test Agreement" },
            isLoading: false,
            allBudgetLines: [],
            executingTotal: 0,
            projectOfficerName: "",
            alternateProjectOfficerName: "",
            servicesComponents: [],
            groupedBudgetLinesByServicesComponent: [],
            preAwardMemoDocuments: [],
            step5: null,
            preAwardRequestorName: "",
            preAwardApprovalRequestedDate: ""
        });
    });

    const wrapper = ({ children }) => (
        <Provider store={createStoreWithAuth()}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );

    describe("Draft value loading", () => {
        it("should convert backend date format (YYYY-MM-DD) to display format (MM/DD/YYYY)", async () => {
            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: "REQ-12345",
                    requisition_date: "2026-05-21", // Backend format
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-12345");
                expect(result.current.requisitionDate).toBe("05/21/2026"); // Display format
            });
        });

        it("should load requisition number from draft", async () => {
            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: "REQ-99999",
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-99999");
                expect(result.current.requisitionDate).toBe("");
            });
        });
    });

    describe("handleSaveDraft", () => {
        it("should convert date to API format (YYYY-MM-DD) when saving draft", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({});
            mockUpdateProcurementTrackerStep.mockReturnValue({ unwrap: mockUnwrap });

            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            // Set values in display format
            result.current.setRequisitionNumber("REQ-12345");
            result.current.setRequisitionDate("05/21/2026"); // Display format

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-12345");
                expect(result.current.requisitionDate).toBe("05/21/2026");
            });

            // Save draft
            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(mockUpdateProcurementTrackerStep).toHaveBeenCalledWith({
                    stepId: 1,
                    data: {
                        is_draft: true,
                        requisition_number: "REQ-12345",
                        requisition_date: "2026-05-21" // API format
                    }
                });
            });
        });

        it("should include is_draft flag when saving draft", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({});
            mockUpdateProcurementTrackerStep.mockReturnValue({ unwrap: mockUnwrap });

            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            result.current.setRequisitionNumber("REQ-12345");

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-12345");
            });

            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(mockUpdateProcurementTrackerStep).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            is_draft: true
                        })
                    })
                );
            });
        });

        it("should only send fields that have values", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({});
            mockUpdateProcurementTrackerStep.mockReturnValue({ unwrap: mockUnwrap });

            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            // Only set requisition number, not date
            result.current.setRequisitionNumber("REQ-12345");

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-12345");
            });

            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(mockUpdateProcurementTrackerStep).toHaveBeenCalledWith({
                    stepId: 1,
                    data: {
                        is_draft: true,
                        requisition_number: "REQ-12345"
                        // requisition_date should NOT be in the payload
                    }
                });
            });
        });
    });

    describe("handleApprove", () => {
        it("should convert date to API format (YYYY-MM-DD) when approving", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({});
            mockUpdateProcurementTrackerStep.mockReturnValue({ unwrap: mockUnwrap });

            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            result.current.setRequisitionNumber("REQ-12345");
            result.current.setRequisitionDate("05/21/2026"); // Display format
            result.current.setAttestationChecked(true);

            await waitFor(() => {
                expect(result.current.isFormValid()).toBe(true);
            });

            // Trigger approve (opens modal)
            await result.current.handleApprove();

            await waitFor(() => {
                expect(result.current.showModal).toBe(true);
            });

            // Confirm approval
            await result.current.modalProps.handleConfirm();

            await waitFor(() => {
                expect(mockUpdateProcurementTrackerStep).toHaveBeenCalledWith({
                    stepId: 1,
                    data: {
                        requisition_number: "REQ-12345",
                        requisition_date: "2026-05-21" // API format
                    }
                });
            });
        });

        it("should NOT include is_draft flag when approving", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({});
            mockUpdateProcurementTrackerStep.mockReturnValue({ unwrap: mockUnwrap });

            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            result.current.setRequisitionNumber("REQ-12345");
            result.current.setRequisitionDate("05/21/2026");
            result.current.setAttestationChecked(true);

            await waitFor(() => {
                expect(result.current.isFormValid()).toBe(true);
            });

            await result.current.handleApprove();

            await waitFor(() => {
                expect(result.current.showModal).toBe(true);
                expect(result.current.modalProps.handleConfirm).toBeDefined();
            });

            await result.current.modalProps.handleConfirm();

            await waitFor(() => {
                const callArgs = mockUpdateProcurementTrackerStep.mock.calls[0][0];
                expect(callArgs.data.is_draft).toBeUndefined();
            });
        });
    });

    describe("Form validation", () => {
        it("should validate date format correctly", async () => {
            usePreAwardApprovalData.mockReturnValue({
                agreement: { id: 1, name: "Test Agreement" },
                isLoading: false,
                allBudgetLines: [],
                executingTotal: 0,
                projectOfficerName: "",
                alternateProjectOfficerName: "",
                servicesComponents: [],
                groupedBudgetLinesByServicesComponent: [],
                preAwardMemoDocuments: [],
                step5: {
                    id: 1,
                    requisition_number: null,
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            result.current.setRequisitionNumber("REQ-12345");
            result.current.setRequisitionDate("05/21/2026"); // Valid format
            result.current.setAttestationChecked(true);

            await waitFor(() => {
                expect(result.current.isFormValid()).toBe(true);
            });

            // Invalid date format should fail validation
            result.current.setRequisitionDate("2026-05-21"); // Backend format, not display format

            await waitFor(() => {
                expect(result.current.isFormValid()).toBe(false);
            });
        });
    });
});
