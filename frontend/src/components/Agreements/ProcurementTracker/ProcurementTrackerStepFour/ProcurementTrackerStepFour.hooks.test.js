import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepFour from "./ProcurementTrackerStepFour.hooks";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateToMonthDayYear } from "../../../../helpers/utils";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

vi.mock("../../../../hooks/user.hooks");
vi.mock("../../../../helpers/utils", () => ({
    formatDateToMonthDayYear: vi.fn((date) => date),
    formatDateForApi: vi.fn((date) => {
        if (!date) return undefined;
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = date.split("/");
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
        return date;
    })
}));
vi.mock("../../../../api/opsAPI", () => ({
    useUpdateProcurementTrackerStepMutation: vi.fn()
}));
vi.mock("../../../../hooks/use-alert.hooks", () => ({
    default: vi.fn()
}));
vi.mock("./suite", () => {
    const mockSuite = vi.fn();
    mockSuite.get = vi.fn(() => ({
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false),
        isValid: vi.fn(() => true)
    }));
    mockSuite.reset = vi.fn();
    return { default: mockSuite };
});

describe("useProcurementTrackerStepFour", () => {
    const mockPatchStepFour = vi.fn();
    const mockSetAlert = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockStepFourData = {
        id: 1,
        task_completed_by: 123,
        date_completed: "2024-03-15",
        target_completion_date: "2024-03-10",
        notes: "Vendor selected after evaluation"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateToMonthDayYear.mockReturnValue("March 15, 2024");
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepFour]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });
        mockPatchStepFour.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({})
        });
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isEvaluationComplete).toBe(false);
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step4DateCompleted).toBe("");
            expect(result.current.step4Notes).toBe("");
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setIsEvaluationComplete).toBe("function");
            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setTargetCompletionDate).toBe("function");
            expect(typeof result.current.setStep4DateCompleted).toBe("function");
            expect(typeof result.current.setStep4Notes).toBe("function");
        });

        it("returns stepFourData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepFourData).toEqual(mockStepFourData);
        });

        it("returns derived data labels", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.step4CompletedByUserName).toBe("John Doe");
            expect(result.current.step4DateCompletedLabel).toBeDefined();
            expect(result.current.step4TargetCompletionDateLabel).toBeDefined();
            expect(result.current.step4NotesLabel).toBe("Vendor selected after evaluation");
        });
    });

    describe("State Updates", () => {
        it("updates isEvaluationComplete when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsEvaluationComplete(true);
            });

            expect(result.current.isEvaluationComplete).toBe(true);
        });

        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates targetCompletionDate when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            expect(result.current.targetCompletionDate).toBe("03/20/2024");
        });

        it("updates step4DateCompleted when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep4DateCompleted("03/20/2024");
            });

            expect(result.current.step4DateCompleted).toBe("03/20/2024");
        });

        it("updates step4Notes when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep4Notes("Evaluation notes");
            });

            expect(result.current.step4Notes).toBe("Evaluation notes");
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with required methods", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
            expect(typeof result.current.validatorRes.hasErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.runValidate).toBe("function");
        });
    });

    describe("handleTargetCompletionDateSubmit", () => {
        it("calls API with correct payload", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(1);
            });

            expect(mockPatchStepFour).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    target_completion_date: "2024-03-20"
                }
            });
        });

        it("shows success alert when API call succeeds", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(1);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "success",
                heading: "Success",
                message: "Target completion date saved successfully."
            });
        });

        it("shows error alert when API call fails", async () => {
            mockPatchStepFour.mockReturnValue({
                unwrap: vi.fn().mockRejectedValue(new Error("API Error"))
            });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(1);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        });
    });

    describe("handleStepFourComplete", () => {
        it("calls API with correct payload including all required fields", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour({}, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
                result.current.setStep4Notes("Evaluation complete");
                result.current.setTargetCompletionDate("03/15/2024");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            expect(mockPatchStepFour).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-03-20",
                    notes: "Evaluation complete",
                    target_completion_date: "2024-03-15"
                }
            });
        });

        it("excludes target_completion_date if already set", async () => {
            const dataWithTargetDate = {
                ...mockStepFourData,
                target_completion_date: "2024-03-10"
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(dataWithTargetDate, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
                result.current.setStep4Notes("Evaluation complete");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            const callArgs = mockPatchStepFour.mock.calls[0][0];
            expect(callArgs.data.target_completion_date).toBeUndefined();
        });

        it("trims notes before submission", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour({}, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
                result.current.setStep4Notes("  Notes with spaces  ");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            const callArgs = mockPatchStepFour.mock.calls[0][0];
            expect(callArgs.data.notes).toBe("Notes with spaces");
        });

        it("calls handleSetCompletedStepNumber with 4 after successful completion", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour({}, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            expect(mockHandleSetCompletedStepNumber).toHaveBeenCalledWith(4);
        });

        it("shows success alert when step completion succeeds", async () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour({}, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "success",
                heading: "Success",
                message: "Step 4 completed successfully."
            });
        });

        it("shows error alert when API call fails", async () => {
            mockPatchStepFour.mockReturnValue({
                unwrap: vi.fn().mockRejectedValue(new Error("API Error"))
            });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFour({}, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep4DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFourComplete(1);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
        });
    });

    describe("Cancel Functionality", () => {
        it("cancelStepFour resets all state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            // Set some state
            act(() => {
                result.current.setIsEvaluationComplete(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setTargetCompletionDate("03/20/2024");
                result.current.setStep4DateCompleted("03/20/2024");
                result.current.setStep4Notes("Notes");
            });

            // Call cancel
            act(() => {
                result.current.cancelStepFour();
            });

            // Verify state is reset
            expect(result.current.isEvaluationComplete).toBe(false);
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step4DateCompleted).toBe("");
            expect(result.current.step4Notes).toBe("");
        });
    });

    describe("Modal Functionality", () => {
        it("cancelModalStep4 opens modal with correct props", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStep4();
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(
                "Are you sure you want to cancel this task? Your input will not be saved."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Task");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue Editing");
            expect(typeof result.current.modalProps.handleConfirm).toBe("function");
        });

        it("modal handleConfirm calls cancelStepFour", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFour(mockStepFourData, mockHandleSetCompletedStepNumber)
            );

            // Set some state
            act(() => {
                result.current.setIsEvaluationComplete(true);
                result.current.setStep4Notes("Notes");
            });

            // Open modal
            act(() => {
                result.current.cancelModalStep4();
            });

            // Execute modal confirm
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            // Verify state was reset
            expect(result.current.isEvaluationComplete).toBe(false);
            expect(result.current.step4Notes).toBe("");
        });
    });
});
