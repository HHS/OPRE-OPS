import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepThree from "./ProcurementTrackerStepThree.hooks";
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

describe("useProcurementTrackerStepThree", () => {
    const mockPatchStepThree = vi.fn();
    const mockSetAlert = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockStepThreeData = {
        id: 1,
        task_completed_by: 123,
        date_completed: "01/15/2024",
        solicitation_period_start_date: "02/01/2024",
        solicitation_period_end_date: "02/28/2024",
        notes: "Test notes"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateToMonthDayYear.mockReturnValue("January 15, 2024");
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.selectedUser).toEqual({});
            expect(result.current.step3DateCompleted).toBe("");
            expect(result.current.solicitationPeriodStartDate).toBe("");
            expect(result.current.solicitationPeriodEndDate).toBe("");
            expect(result.current.step3Notes).toBe("");
            expect(result.current.isSolicitationClosed).toBe(false);
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setStep3DateCompleted).toBe("function");
            expect(typeof result.current.setSolicitationPeriodStartDate).toBe("function");
            expect(typeof result.current.setSolicitationPeriodEndDate).toBe("function");
            expect(typeof result.current.setStep3Notes).toBe("function");
            expect(typeof result.current.setIsSolicitationClosed).toBe("function");
        });

        it("returns stepThreeData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepThreeData).toEqual(mockStepThreeData);
        });

        it("returns formatted labels for read-only view", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.step3CompletedByUserName).toBeDefined();
            expect(result.current.step3DateCompletedLabel).toBeDefined();
            expect(result.current.solicitationStartDateLabel).toBeDefined();
            expect(result.current.solicitationEndDateLabel).toBeDefined();
            expect(result.current.step3NotesLabel).toBe("Test notes");
        });

        it("handles undefined/null stepThreeData gracefully", () => {
            renderHook(() => useProcurementTrackerStepThree(undefined, mockHandleSetCompletedStepNumber));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(undefined);
            expect(formatDateToMonthDayYear).toHaveBeenCalledWith(undefined);
        });
    });

    describe("State Updates", () => {
        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates step3DateCompleted when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep3DateCompleted("03/20/2024");
            });

            expect(result.current.step3DateCompleted).toBe("03/20/2024");
        });

        it("updates solicitation period dates when setters are called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
            });

            expect(result.current.solicitationPeriodStartDate).toBe("03/01/2024");
            expect(result.current.solicitationPeriodEndDate).toBe("03/31/2024");
        });

        it("updates step3Notes when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep3Notes("Updated notes");
            });

            expect(result.current.step3Notes).toBe("Updated notes");
        });

        it("updates isSolicitationClosed when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsSolicitationClosed(true);
            });

            expect(result.current.isSolicitationClosed).toBe(true);
        });
    });

    describe("Async Operations - handleStep3Complete", () => {
        it("calls handleSetCompletedStepNumber with 3 after successful step completion", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(mockHandleSetCompletedStepNumber).toHaveBeenCalledWith(3);
        });

        it("does not call handleSetCompletedStepNumber if function not provided", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() => useProcurementTrackerStepThree(mockStepThreeData, undefined));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            // Should not throw an error
            expect(result.current).toBeDefined();
        });

        it("includes solicitation dates in payload when not already saved", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const stepDataWithoutDates = { id: 1 };
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(stepDataWithoutDates, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
                result.current.setStep3Notes("Test notes");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(mockPatchStepThree).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-03-20",
                    notes: "Test notes",
                    solicitation_period_start_date: "2024-03-01",
                    solicitation_period_end_date: "2024-03-31"
                }
            });
        });

        it("excludes solicitation dates from payload when already saved", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
                result.current.setStep3Notes("Test notes");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(mockPatchStepThree).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-03-20",
                    notes: "Test notes"
                }
            });
        });

        it("trims notes before submission", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
                result.current.setStep3Notes("  Test notes with spaces  ");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(mockPatchStepThree).toHaveBeenCalledWith({
                stepId: 1,
                data: expect.objectContaining({
                    notes: "Test notes with spaces"
                })
            });
        });

        it("logs success message after successful completion", async () => {
            const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(consoleLogSpy).toHaveBeenCalledWith("Procurement Tracker Step 3 Updated");
            consoleLogSpy.mockRestore();
        });

        it("handles API errors and shows alert", async () => {
            const mockError = new Error("API Error");
            const mockUnwrap = vi.fn().mockRejectedValue(mockError);
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update Procurement Tracker Step 3", mockError);
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
            consoleErrorSpy.mockRestore();
        });

        it("does not call handleSetCompletedStepNumber on error", async () => {
            const mockError = new Error("API Error");
            const mockUnwrap = vi.fn().mockRejectedValue(mockError);
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);
            vi.spyOn(console, "error").mockImplementation(() => {});

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep3Complete(1);
            });

            expect(mockHandleSetCompletedStepNumber).not.toHaveBeenCalled();
        });
    });

    describe("Async Operations - handleSolicitationDatesSubmit", () => {
        it("submits solicitation dates successfully", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
            });

            await act(async () => {
                await result.current.handleSolicitationDatesSubmit(1);
            });

            expect(mockPatchStepThree).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    solicitation_period_start_date: "2024-03-01",
                    solicitation_period_end_date: "2024-03-31"
                }
            });
        });

        it("logs success message after successful solicitation dates submission", async () => {
            const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
            });

            await act(async () => {
                await result.current.handleSolicitationDatesSubmit(1);
            });

            expect(consoleLogSpy).toHaveBeenCalledWith("Procurement Tracker Step 3 solicitation dates updated");
            consoleLogSpy.mockRestore();
        });

        it("handles API errors for solicitation dates submission", async () => {
            const mockError = new Error("API Error");
            const mockUnwrap = vi.fn().mockRejectedValue(mockError);
            mockPatchStepThree.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepThree]);
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
            });

            await act(async () => {
                await result.current.handleSolicitationDatesSubmit(1);
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Failed to update Procurement Tracker Step 3 solicitation dates",
                mockError
            );
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the solicitation period dates. Please try again."
            });
            consoleErrorSpy.mockRestore();
        });
    });

    describe("Modal and Cancel Operations", () => {
        it("opens cancel confirmation modal", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.cancelModalStep3();
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps).toEqual({
                heading: "Are you sure you want to cancel this task? Your input will not be saved.",
                actionButtonText: "Cancel Task",
                secondaryButtonText: "Continue Editing",
                handleConfirm: expect.any(Function)
            });
        });

        it("resets form state when cancel is confirmed", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepThree(mockStepThreeData, mockHandleSetCompletedStepNumber)
            );

            // Set some state
            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep3DateCompleted("03/20/2024");
                result.current.setSolicitationPeriodStartDate("03/01/2024");
                result.current.setSolicitationPeriodEndDate("03/31/2024");
                result.current.setStep3Notes("Test notes");
                result.current.setIsSolicitationClosed(true);
            });

            // Open modal and execute cancel
            act(() => {
                result.current.cancelModalStep3();
            });

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            // Verify state is reset
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.step3DateCompleted).toBe("");
            expect(result.current.solicitationPeriodStartDate).toBe("");
            expect(result.current.solicitationPeriodEndDate).toBe("");
            expect(result.current.step3Notes).toBe("");
            expect(result.current.isSolicitationClosed).toBe(false);
        });
    });
});
