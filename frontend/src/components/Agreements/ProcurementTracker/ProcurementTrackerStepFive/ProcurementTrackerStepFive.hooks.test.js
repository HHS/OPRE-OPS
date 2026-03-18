import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepFive from "./ProcurementTrackerStepFive.hooks";
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

describe("useProcurementTrackerStepFive", () => {
    const mockPatchStepFive = vi.fn();
    const mockSetAlert = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockStepFiveData = {
        id: 5,
        task_completed_by: 123,
        date_completed: "2024-01-15",
        target_completion_date: "2024-02-20",
        notes: "Pre-award approval received"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateToMonthDayYear.mockReturnValue("January 15, 2024");
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepFive]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.isPreAwardComplete).toBe(false);
            expect(result.current.selectedUser).toBeUndefined();
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step5DateCompleted).toBe("");
            expect(result.current.step5Notes).toBe("");
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setIsPreAwardComplete).toBe("function");
            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setTargetCompletionDate).toBe("function");
            expect(typeof result.current.setStep5DateCompleted).toBe("function");
            expect(typeof result.current.setStep5Notes).toBe("function");
        });

        it("returns stepFiveData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepFiveData).toEqual(mockStepFiveData);
        });

        it("initializes modal state to false", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.showModal).toBe(false);
        });

        it("provides MemoizedDatePicker component", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.MemoizedDatePicker).toBeDefined();
        });
    });

    describe("State Updates", () => {
        it("updates isPreAwardComplete when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
            });

            expect(result.current.isPreAwardComplete).toBe(true);
        });

        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates targetCompletionDate when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            expect(result.current.targetCompletionDate).toBe("03/20/2024");
        });

        it("updates step5DateCompleted when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep5DateCompleted("02/15/2024");
            });

            expect(result.current.step5DateCompleted).toBe("02/15/2024");
        });

        it("updates step5Notes when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep5Notes("Test notes");
            });

            expect(result.current.step5Notes).toBe("Test notes");
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with getErrors method", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.runValidate).toBe("function");
        });

        it("runValidate can be called with name and value", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(() => {
                act(() => {
                    result.current.runValidate("dateCompleted", "01/15/2024");
                });
            }).not.toThrow();
        });

        it("runValidate can be called for targetCompletionDate field", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(() => {
                act(() => {
                    result.current.runValidate("targetCompletionDate", "03/20/2024");
                });
            }).not.toThrow();
        });
    });

    describe("Display Values", () => {
        it("step5CompletedByUserName fetches user name via hook", () => {
            renderHook(() => useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(123);
        });

        it("step5DateCompletedLabel formats date via helper", () => {
            renderHook(() => useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-01-15");
        });

        it("step5TargetCompletionDateLabel formats target date via helper", () => {
            renderHook(() => useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-02-20");
        });

        it("step5NotesLabel returns notes from stepFiveData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.step5NotesLabel).toBe("Pre-award approval received");
        });

        it("handles undefined stepFiveData gracefully", () => {
            renderHook(() => useProcurementTrackerStepFive(undefined));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(-1);
            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("");
        });

        it("handles null date fields gracefully", () => {
            const nullDateData = {
                ...mockStepFiveData,
                date_completed: null,
                target_completion_date: null
            };

            renderHook(() => useProcurementTrackerStepFive(nullDateData));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("");
        });
    });

    describe("handleTargetCompletionDateSubmit", () => {
        it("calls patchStepFive with correct payload for target completion date", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(5);
            });

            expect(mockPatchStepFive).toHaveBeenCalledWith({
                stepId: 5,
                data: {
                    target_completion_date: "2024-03-20"
                }
            });
        });

        it("clears targetCompletionDate after successful submission", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(5);
            });

            expect(result.current.targetCompletionDate).toBe("");
        });

        it("shows error alert on target completion date submission failure", async () => {
            const mockUnwrap = vi.fn().mockRejectedValue(new Error("API Error"));
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(5);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        });

        it("does not clear targetCompletionDate on submission failure", async () => {
            const mockUnwrap = vi.fn().mockRejectedValue(new Error("API Error"));
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("03/20/2024");
            });

            await act(async () => {
                await result.current.handleTargetCompletionDateSubmit(5);
            });

            expect(result.current.targetCompletionDate).toBe("03/20/2024");
        });
    });

    describe("handleStepFiveComplete", () => {
        it("calls patchStepFive with correct completion payload", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep5DateCompleted("02/20/2024");
                result.current.setStep5Notes("Approval received");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockPatchStepFive).toHaveBeenCalledWith({
                stepId: 5,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-02-20",
                    notes: "Approval received"
                }
            });
        });

        it("includes target_completion_date in payload if not already set", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const stepDataWithoutTarget = {
                ...mockStepFiveData,
                target_completion_date: null
            };

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(stepDataWithoutTarget, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
                result.current.setTargetCompletionDate("03/15/2024");
                result.current.setStep5Notes("Test");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockPatchStepFive).toHaveBeenCalledWith({
                stepId: 5,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-02-20",
                    notes: "Test",
                    target_completion_date: "2024-03-15"
                }
            });
        });

        it("does not include target_completion_date in payload if already set", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
                result.current.setStep5Notes("Test");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            const callArgs = mockPatchStepFive.mock.calls[0][0];
            expect(callArgs.data).not.toHaveProperty("target_completion_date");
        });

        it("trims notes before submission", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
                result.current.setStep5Notes("  Notes with spaces  ");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockPatchStepFive).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        notes: "Notes with spaces"
                    })
                })
            );
        });

        it("calls handleSetCompletedStepNumber with 5 after successful completion", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockHandleSetCompletedStepNumber).toHaveBeenCalledWith(5);
        });

        it("does not call handleSetCompletedStepNumber if undefined", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() => useProcurementTrackerStepFive(mockStepFiveData, undefined));

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockHandleSetCompletedStepNumber).not.toHaveBeenCalled();
        });

        it("shows error alert on step completion failure", async () => {
            const mockUnwrap = vi.fn().mockRejectedValue(new Error("API Error"));
            mockPatchStepFive.mockReturnValue({ unwrap: mockUnwrap });

            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setStep5DateCompleted("02/20/2024");
            });

            await act(async () => {
                await result.current.handleStepFiveComplete(5);
            });

            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
        });
    });

    describe("cancelStepFive", () => {
        it("resets all form fields", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setSelectedUser({ id: 456 });
                result.current.setTargetCompletionDate("03/20/2024");
                result.current.setStep5DateCompleted("02/20/2024");
                result.current.setStep5Notes("Test notes");
            });

            act(() => {
                result.current.cancelStepFive();
            });

            expect(result.current.isPreAwardComplete).toBe(false);
            expect(result.current.selectedUser).toBeUndefined();
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step5DateCompleted).toBe("");
            expect(result.current.step5Notes).toBe("");
        });
    });

    describe("cancelModalStep5", () => {
        it("sets showModal to true when called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStep5();
            });

            expect(result.current.showModal).toBe(true);
        });

        it("sets modalProps with correct heading and button text", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStep5();
            });

            expect(result.current.modalProps.heading).toBe(
                "Are you sure you want to cancel this task? Your input will not be saved."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Task");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue Editing");
        });

        it("modalProps handleConfirm calls cancelStepFive", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreAwardComplete(true);
                result.current.setStep5Notes("Test");
            });

            act(() => {
                result.current.cancelModalStep5();
            });

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(result.current.isPreAwardComplete).toBe(false);
            expect(result.current.step5Notes).toBe("");
        });
    });

    describe("Modal State Management", () => {
        it("provides setShowModal function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setShowModal).toBe("function");
        });

        it("setShowModal updates showModal state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepFive(mockStepFiveData, mockHandleSetCompletedStepNumber)
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
