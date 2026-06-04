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
            expect(result.current.stepSixNotes).toBe("");
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
            const { result } = renderHook(() => useProcurementTrackerStepSix(undefined, mockHandleSetCompletedStepNumber));

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

        it("calls handleSetCompletedStepNumber with 6 after successful completion", async () => {
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

            // Should not throw
            expect(true).toBe(true);
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
            expect(result.current.stepSixNotes).toBe("");
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

            expect(result.current.modalProps.heading).toBe("Are you sure you want to cancel Step 6?");
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Step 6");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue Step 6");
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

            expect(result.current.stepSixNotes).toBe("");
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
});
