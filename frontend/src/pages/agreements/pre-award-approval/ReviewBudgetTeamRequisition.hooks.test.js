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
        useNavigate: () => vi.fn(),
        useBlocker: () => ({ state: "unblocked" })
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

    describe("canSaveDraft", () => {
        it("should be false when fields are empty and step5 has no prior values", () => {
            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            expect(result.current.canSaveDraft).toBe(false);
        });

        it("should be true when requisitionNumber is entered", async () => {
            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            result.current.setRequisitionNumber("REQ-001");
            await waitFor(() => {
                expect(result.current.canSaveDraft).toBe(true);
            });
        });

        it("should be true when requisitionDate is entered", async () => {
            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            result.current.setRequisitionDate("05/21/2026");
            await waitFor(() => {
                expect(result.current.canSaveDraft).toBe(true);
            });
        });

        it("should be true when step5 has a prior requisition_number", async () => {
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
                    requisition_number: "REQ-SAVED",
                    requisition_date: null,
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            await waitFor(() => {
                expect(result.current.canSaveDraft).toBe(true);
            });
        });

        it("should be false when requisitionNumber is whitespace only and step5 has no prior values", async () => {
            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            result.current.setRequisitionNumber("   ");
            await waitFor(() => {
                expect(result.current.canSaveDraft).toBe(false);
            });
        });

        it("should return to false after user clears both fields with no prior step5 values", async () => {
            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            result.current.setRequisitionNumber("REQ-001");
            await waitFor(() => expect(result.current.canSaveDraft).toBe(true));

            result.current.setRequisitionNumber("");
            await waitFor(() => expect(result.current.canSaveDraft).toBe(false));
        });

        it("should be true when step5 has a prior requisition_date", async () => {
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
                    requisition_date: "2026-05-21",
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
            await waitFor(() => {
                expect(result.current.canSaveDraft).toBe(true);
            });
        });
    });

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

        it("should send null for empty fields to allow clearing saved values", async () => {
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
                        requisition_number: "REQ-12345",
                        requisition_date: null
                    }
                });
            });
        });

        // NOTE: This path cannot be reached via normal UI flow — the Save Draft button is
        // disabled by `canSaveDraft` before the user can click it. This test documents
        // the handler's internal defense-in-depth guard in case `canSaveDraft` regresses.
        it("should block save when both fields empty and no prior values", async () => {
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

            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(result.current.submitError).toBe("Enter a Requisition # or Date to save a draft.");
                expect(mockUpdateProcurementTrackerStep).not.toHaveBeenCalled();
            });
        });

        it("should allow saving with both fields empty when prior values exist (clears them)", async () => {
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
                    requisition_number: "REQ-001",
                    requisition_date: "2026-05-21",
                    requisition_approved_by: null
                },
                preAwardRequestorName: "",
                preAwardApprovalRequestedDate: ""
            });

            const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

            // Wait for useEffect to populate fields from step5
            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-001");
            });

            // Clear both fields
            result.current.setRequisitionNumber("");
            result.current.setRequisitionDate("");

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("");
                expect(result.current.requisitionDate).toBe("");
            });

            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(mockUpdateProcurementTrackerStep).toHaveBeenCalledWith({
                    stepId: 1,
                    data: {
                        is_draft: true,
                        requisition_number: null,
                        requisition_date: null
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

        it("should reject invalid date format via isFormValid check", async () => {
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
            result.current.setRequisitionDate("invalid"); // Invalid format - formatDateForApi returns null
            result.current.setAttestationChecked(true);

            await waitFor(() => {
                expect(result.current.requisitionNumber).toBe("REQ-12345");
                expect(result.current.requisitionDate).toBe("invalid");
                expect(result.current.attestationChecked).toBe(true);
                // isFormValid should return false because formatDateForApi returns null
                expect(result.current.isFormValid()).toBe(false);
            });

            // Call handleApprove - should fail due to isFormValid check
            await result.current.handleApprove();

            await waitFor(() => {
                // Error message comes from isFormValid failing (formatDateForApi returned null)
                expect(result.current.submitError).toBe(
                    "Please fill in all required fields and check the attestation."
                );
                expect(result.current.showModal).toBe(false);
            });
        });

        describe("handleDateChange", () => {
            beforeEach(() => {
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
                    step5: { id: 1, requisition_number: null, requisition_date: null, requisition_approved_by: null },
                    preAwardRequestorName: "",
                    preAwardApprovalRequestedDate: ""
                });
            });

            it("sets requisitionDateError when value is entered but invalid", async () => {
                const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
                result.current.handleDateChange({ target: { value: "not-a-date" } });
                await waitFor(() => {
                    expect(result.current.requisitionDateError).toEqual(["Date must be MM/DD/YYYY"]);
                });
            });

            it("sets requisitionDateError for plausible-looking but invalid dates like qq/qq/qq", async () => {
                const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
                result.current.handleDateChange({ target: { value: "qq/qq/qq" } });
                await waitFor(() => {
                    // Error shown in UI
                    expect(result.current.requisitionDateError).toEqual(["Date must be MM/DD/YYYY"]);
                    // Approve button must also be disabled — isFormValid must return false
                    expect(result.current.isFormValid()).toBe(false);
                });
            });

            it("blocks handleSaveDraft for plausible-looking but invalid dates like qq/qq/qq", async () => {
                const mockUnwrap = vi.fn().mockResolvedValue({});
                useUpdateProcurementTrackerStepMutation.mockReturnValue([
                    vi.fn().mockReturnValue({ unwrap: mockUnwrap }),
                    {}
                ]);
                const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });

                result.current.handleDateChange({ target: { value: "qq/qq/qq" } });
                await waitFor(() => expect(result.current.requisitionDate).toBe("qq/qq/qq"));

                await result.current.handleSaveDraft();

                await waitFor(() => {
                    expect(result.current.submitError).toBe("Invalid date format. Please use MM/DD/YYYY format.");
                    expect(mockUnwrap).not.toHaveBeenCalled();
                });
            });

            it("clears requisitionDateError when value becomes valid", async () => {
                const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
                result.current.handleDateChange({ target: { value: "not-a-date" } });
                await waitFor(() => expect(result.current.requisitionDateError).toEqual(["Date must be MM/DD/YYYY"]));
                result.current.handleDateChange({ target: { value: "05/21/2026" } });
                await waitFor(() => {
                    expect(result.current.requisitionDateError).toEqual([]);
                    expect(result.current.requisitionDate).toBe("05/21/2026");
                });
            });

            it("clears requisitionDateError when field is emptied", async () => {
                const { result } = renderHook(() => useReviewBudgetTeamRequisition(1), { wrapper });
                result.current.handleDateChange({ target: { value: "bad" } });
                await waitFor(() => expect(result.current.requisitionDateError).toEqual(["Date must be MM/DD/YYYY"]));
                result.current.handleDateChange({ target: { value: "" } });
                await waitFor(() => {
                    expect(result.current.requisitionDateError).toEqual([]);
                });
            });
        });

        it("should reject invalid date format in handleSaveDraft", async () => {
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

            result.current.setRequisitionDate("invalid-date-format");

            await waitFor(() => {
                expect(result.current.requisitionDate).toBe("invalid-date-format");
            });

            await result.current.handleSaveDraft();

            await waitFor(() => {
                expect(result.current.submitError).toBe("Invalid date format. Please use MM/DD/YYYY format.");
                expect(mockUpdateProcurementTrackerStep).not.toHaveBeenCalled();
            });
        });
    });
});
