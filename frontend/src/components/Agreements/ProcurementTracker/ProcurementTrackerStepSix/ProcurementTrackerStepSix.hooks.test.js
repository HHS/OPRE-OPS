import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepSix from "./ProcurementTrackerStepSix.hooks";
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
    mockSuite.run = vi.fn();
    mockSuite.get = vi.fn(() => ({
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false),
        isValid: vi.fn(() => true)
    }));
    mockSuite.reset = vi.fn();
    return { default: mockSuite };
});

describe("useProcurementTrackerStepSix", () => {
    const mockPatchStepSix = vi.fn();
    const mockSetAlert = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockStepSixData = {
        id: 6,
        task_completed_by: 123,
        date_completed: "2024-01-15",
        target_completion_date: "2024-02-20",
        notes: "Award received and uploaded"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateToMonthDayYear.mockReturnValue("January 15, 2024");
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepSix]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isAwardCheckboxChecked).toBe(false);
            expect(result.current.selectedUser).toBeUndefined();
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.stepSixDateCompleted).toBe("");
            expect(result.current.stepSixNotes).toBe("Award received and uploaded"); // Notes initialize from existing stepData.notes
            expect(result.current.isSubmitting).toBe(false);
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setIsAwardCheckboxChecked).toBe("function");
            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setTargetCompletionDate).toBe("function");
            expect(typeof result.current.setStepSixDateCompleted).toBe("function");
            expect(typeof result.current.setStepSixNotes).toBe("function");
        });

        it("returns stepSixData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepSixCompletedByUserName).toBe("John Doe");
            expect(result.current.stepSixDateCompletedLabel).toBe("January 15, 2024");
        });

        it("initializes modal state to false", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.showModal).toBe(false);
        });

        it("provides MemoizedDatePicker component", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.MemoizedDatePicker).toBeDefined();
        });

        it("initializes isAwardCheckboxChecked to true when approval_requested is true", () => {
            const stepDataWithApproval = {
                ...mockStepSixData,
                approval_requested: true
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(stepDataWithApproval, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isAwardCheckboxChecked).toBe(true);
        });

        it("initializes isAwardCheckboxChecked to false when approval_requested is false", () => {
            const stepDataWithoutApproval = {
                ...mockStepSixData,
                approval_requested: false
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(stepDataWithoutApproval, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isAwardCheckboxChecked).toBe(false);
        });

        it("initializes isAwardCheckboxChecked to false when approval_requested is null", () => {
            const stepDataWithNullApproval = {
                ...mockStepSixData,
                approval_requested: null
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(stepDataWithNullApproval, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isAwardCheckboxChecked).toBe(false);
        });

        it("initializes isAwardCheckboxChecked to false when approval_requested is undefined", () => {
            const stepDataWithUndefinedApproval = {
                ...mockStepSixData,
                approval_requested: undefined
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(stepDataWithUndefinedApproval, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isAwardCheckboxChecked).toBe(false);
        });
    });

    describe("State Updates", () => {
        it("updates isAwardCheckboxChecked when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsAwardCheckboxChecked(true);
            });

            expect(result.current.isAwardCheckboxChecked).toBe(true);
        });

        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            const testUser = { id: 1, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(testUser);
            });

            expect(result.current.selectedUser).toEqual(testUser);
        });

        it("updates targetCompletionDate when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("02/15/2024");
            });

            expect(result.current.targetCompletionDate).toBe("02/15/2024");
        });

        it("updates stepSixDateCompleted when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            expect(result.current.stepSixDateCompleted).toBe("02/15/2024");
        });

        it("updates stepSixNotes when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStepSixNotes("Test notes");
            });

            expect(result.current.stepSixNotes).toBe("Test notes");
        });

        it("syncs isAwardCheckboxChecked when approval_requested prop changes to true", () => {
            const initialStepData = {
                ...mockStepSixData,
                approval_requested: false
            };

            const { result, rerender } = renderHook(
                ({ stepSixData }) => useProcurementTrackerStepSix(stepSixData, mockHandleSetCompletedStepNumber),
                { initialProps: { stepSixData: initialStepData } }
            );

            expect(result.current.isAwardCheckboxChecked).toBe(false);

            // Change prop to true
            const updatedStepData = {
                ...mockStepSixData,
                approval_requested: true
            };

            rerender({ stepSixData: updatedStepData });

            expect(result.current.isAwardCheckboxChecked).toBe(true);
        });

        it("syncs isAwardCheckboxChecked when approval_requested prop changes to false", () => {
            const initialStepData = {
                ...mockStepSixData,
                approval_requested: true
            };

            const { result, rerender } = renderHook(
                ({ stepSixData }) => useProcurementTrackerStepSix(stepSixData, mockHandleSetCompletedStepNumber),
                { initialProps: { stepSixData: initialStepData } }
            );

            expect(result.current.isAwardCheckboxChecked).toBe(true);

            // Change prop to false
            const updatedStepData = {
                ...mockStepSixData,
                approval_requested: false
            };

            rerender({ stepSixData: updatedStepData });

            expect(result.current.isAwardCheckboxChecked).toBe(false);
        });

        it("does not sync isAwardCheckboxChecked when approval_requested is null", () => {
            const initialStepData = {
                ...mockStepSixData,
                approval_requested: true
            };

            const { result, rerender } = renderHook(
                ({ stepSixData }) => useProcurementTrackerStepSix(stepSixData, mockHandleSetCompletedStepNumber),
                { initialProps: { stepSixData: initialStepData } }
            );

            expect(result.current.isAwardCheckboxChecked).toBe(true);

            // Change prop to null - should not sync
            const updatedStepData = {
                ...mockStepSixData,
                approval_requested: null
            };

            rerender({ stepSixData: updatedStepData });

            // Should remain true (no sync)
            expect(result.current.isAwardCheckboxChecked).toBe(true);
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with getErrors method", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.runValidate).toBe("function");
        });

        it("runValidate can be called with name and value", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.runValidate("dateCompleted", "02/15/2024");
            });

            // Should not throw
            expect(true).toBe(true);
        });

        it("runValidate can be called for targetCompletionDate field", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.runValidate("targetCompletionDate", "02/15/2024");
            });

            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe("Display Values", () => {
        it("stepSixCompletedByUserName fetches user name via hook", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(123);
            expect(result.current.stepSixCompletedByUserName).toBe("John Doe");
        });

        it("stepSixDateCompletedLabel formats date via helper", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-01-15");
            expect(result.current.stepSixDateCompletedLabel).toBe("January 15, 2024");
        });

        it("stepSixTargetCompletionDateLabel formats target date via helper", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-02-20");
            expect(result.current.stepSixTargetCompletionDateLabel).toBeDefined();
        });

        it("stepSixNotesLabel returns notes from stepSixData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepSixNotesLabel).toBe("Award received and uploaded");
        });

        it("handles undefined stepSixData gracefully", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(undefined, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepSixCompletedByUserName).toBeDefined();
            expect(result.current.stepSixDateCompletedLabel).toBeDefined();
        });

        it("handles null date fields gracefully", () => {
            const dataWithNullDates = {
                ...mockStepSixData,
                date_completed: null,
                target_completion_date: null
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(dataWithNullDates, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepSixDateCompletedLabel).toBeDefined();
            expect(result.current.stepSixTargetCompletionDateLabel).toBeDefined();
        });
    });

    describe("handleTargetCompletionDateSubmit", () => {
        it("calls patchStepSix with correct payload for target completion date", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("02/15/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(6);
            });

            expect(mockPatchStepSix).toHaveBeenCalledWith({
                stepId: 6,
                data: {
                    target_completion_date: "2024-02-15"
                }
            });
        });

        it("clears targetCompletionDate after successful submission", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("02/15/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(6);
            });

            expect(result.current.targetCompletionDate).toBe("");
        });

        it("shows error alert on target completion date submission failure", async () => {
            const error = new Error("API Error");
            const unwrapMock = vi.fn().mockRejectedValue(error);
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("02/15/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(6);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        });

        it("does not clear targetCompletionDate on submission failure", async () => {
            const error = new Error("API Error");
            const unwrapMock = vi.fn().mockRejectedValue(error);
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("02/15/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(6);
            });

            expect(result.current.targetCompletionDate).toBe("02/15/2024");
        });
    });

    describe("handleStepSixComplete", () => {
        it("calls patchStepSix with correct completion payload", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
                result.current.setStepSixNotes("Award completed");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            expect(mockPatchStepSix).toHaveBeenCalledWith({
                stepId: 6,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 100,
                    date_completed: "2024-02-15",
                    notes: "Award completed"
                }
            });
        });

        it("includes target_completion_date in payload if not already set", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const dataWithoutTargetDate = {
                ...mockStepSixData,
                target_completion_date: undefined
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(dataWithoutTargetDate, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
                result.current.setTargetCompletionDate("03/01/2024");
                result.current.setStepSixNotes("Award completed");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            expect(mockPatchStepSix).toHaveBeenCalledWith({
                stepId: 6,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 100,
                    date_completed: "2024-02-15",
                    notes: "Award completed",
                    target_completion_date: "2024-03-01"
                }
            });
        });

        it("does not include target_completion_date in payload if already set", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
                result.current.setTargetCompletionDate("03/01/2024");
                result.current.setStepSixNotes("Award completed");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            const callArgs = mockPatchStepSix.mock.calls[0][0];
            expect(callArgs.data).not.toHaveProperty("target_completion_date");
        });

        it("trims notes before submission", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
                result.current.setStepSixNotes("  Award completed  ");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            const callArgs = mockPatchStepSix.mock.calls[0][0];
            expect(callArgs.data.notes).toBe("Award completed");
        });

        it("calls handleSetCompletedStepNumber(6) on successful completion", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            // Step 6 notifies the parent so the accordion/scroll state updates correctly
            expect(mockHandleSetCompletedStepNumber).toHaveBeenCalledWith(6);
        });

        it("does not call handleSetCompletedStepNumber if undefined", async () => {
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() => useProcurementTrackerStepSix(mockStepSixData, undefined));

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            // Test passes if no error is thrown when handleSetCompletedStepNumber is undefined
            expect(mockPatchStepSix).toHaveBeenCalledTimes(1);
        });

        it("shows error alert on step completion failure", async () => {
            const error = new Error("API Error");
            const unwrapMock = vi.fn().mockRejectedValue(error);
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
        });

        it("keeps isSubmitting true after a successful patch", async () => {
            // Guards the intentional no-reset: isSubmitting must stay true until the RTK Query
            // refetch flips stepStatus to COMPLETED and the form unmounts. Resetting it early
            // (e.g. via setTimeout) would re-enable the button and allow a duplicate PATCH.
            const unwrapMock = vi.fn().mockResolvedValue({});
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            expect(result.current.isSubmitting).toBe(false);

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            expect(result.current.isSubmitting).toBe(true);
        });

        it("resets isSubmitting to false on patch failure", async () => {
            // Ensures the form re-enables so the user can correct and resubmit after an error.
            const error = new Error("API Error");
            const unwrapMock = vi.fn().mockRejectedValue(error);
            mockPatchStepSix.mockReturnValue({ unwrap: unwrapMock });

            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 100 });
                result.current.setStepSixDateCompleted("02/15/2024");
            });

            await act(async () => {
                await result.current.handleStepSixComplete(6);
            });

            expect(result.current.isSubmitting).toBe(false);
        });
    });

    describe("cancelStepSix", () => {
        it("resets all form fields", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsAwardCheckboxChecked(true);
                result.current.setSelectedUser({ id: 100 });
                result.current.setTargetCompletionDate("02/15/2024");
                result.current.setStepSixDateCompleted("02/15/2024");
                result.current.setStepSixNotes("Test notes");
            });

            act(() => {
                result.current.cancelModalStepSix();
            });

            // Modal should be shown
            expect(result.current.showModal).toBe(true);

            // Call the confirm handler
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(result.current.isAwardCheckboxChecked).toBe(false);
            expect(result.current.selectedUser).toBeUndefined();
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.stepSixDateCompleted).toBe("");
            expect(result.current.stepSixNotes).toBe(mockStepSixData.notes);
            expect(result.current.showModal).toBe(false);
        });
    });

    describe("cancelModalStepSix", () => {
        it("sets showModal to true when called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStepSix();
            });

            expect(result.current.showModal).toBe(true);
        });

        it("sets modalProps with correct heading and button text", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStepSix();
            });

            expect(result.current.modalProps.heading).toBe(
                "Are you sure you want to cancel this task? Your input will not be saved."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Task");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue Editing");
        });

        it("modalProps handleConfirm calls cancelStepSix", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStepSixNotes("Test notes");
                result.current.cancelModalStepSix();
            });

            expect(result.current.stepSixNotes).toBe("Test notes");

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(result.current.stepSixNotes).toBe(mockStepSixData.notes);
        });
    });

    describe("Modal State Management", () => {
        it("provides setShowModal function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setShowModal).toBe("function");
        });

        it("setShowModal updates showModal state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setShowModal(true);
            });

            expect(result.current.showModal).toBe(true);

            act(() => {
                result.current.setShowModal(false);
            });

            expect(result.current.showModal).toBe(false);
        });
    });

    describe("onDirtyChange / hasChanges", () => {
        it("does not call onDirtyChange on clean mount when approval_requested is false", () => {
            const onDirtyChange = vi.fn();
            renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber, onDirtyChange)
            );
            expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        });

        it("does not call onDirtyChange(true) on mount when approval_requested is already true", () => {
            const onDirtyChange = vi.fn();
            renderHook(() =>
                useProcurementTrackerStepSix(
                    { ...mockStepSixData, approval_requested: true },
                    mockHandleSetCompletedStepNumber,
                    onDirtyChange
                )
            );
            // checkbox is seeded to true from server, but should not count as a user change
            expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        });

        it("calls onDirtyChange(true) when a user is selected", () => {
            const onDirtyChange = vi.fn();
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber, onDirtyChange)
            );
            act(() => {
                result.current.setSelectedUser({ id: 42 });
            });
            expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        });

        it("calls onDirtyChange(true) when target completion date is entered", () => {
            const onDirtyChange = vi.fn();
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber, onDirtyChange)
            );
            act(() => {
                result.current.setTargetCompletionDate("01/01/2025");
            });
            expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        });

        it("calls onDirtyChange(true) when date completed is entered", () => {
            const onDirtyChange = vi.fn();
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber, onDirtyChange)
            );
            act(() => {
                result.current.setStepSixDateCompleted("01/15/2025");
            });
            expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        });

        it("calls onDirtyChange(false) after cancelStepSix resets all fields", () => {
            const onDirtyChange = vi.fn();
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber, onDirtyChange)
            );
            act(() => {
                result.current.setSelectedUser({ id: 42 });
            });
            expect(onDirtyChange).toHaveBeenLastCalledWith(true);
            act(() => {
                result.current.cancelStepSix();
            });
            expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        });

        it("does not call onDirtyChange when prop is not provided", () => {
            // should not throw
            const { result } = renderHook(() =>
                useProcurementTrackerStepSix(mockStepSixData, mockHandleSetCompletedStepNumber)
            );
            act(() => {
                result.current.setSelectedUser({ id: 1 });
            });
            expect(result.current.selectedUser).toEqual({ id: 1 });
        });
    });
});
