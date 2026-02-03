import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach, afterEach } from "vitest";
import useProcurementTrackerStepOne from "./ProcurementTrackerStepOne.hooks";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import useAlert from "../../../../hooks/use-alert.hooks";

vi.mock("../../../../api/opsAPI");
vi.mock("../../../../hooks/user.hooks");
vi.mock("../../../../helpers/utils");
vi.mock("../../../../hooks/use-alert.hooks", () => ({
    default: vi.fn(() => ({
        setAlert: vi.fn()
    }))
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

describe("useProcurementTrackerStepOne", () => {
    const mockPatchStepOne = vi.fn();
    const mockUnwrap = vi.fn();
    const mockStepOneData = {
        id: 1,
        task_completed_by: 123,
        date_completed: "2024-01-15",
        notes: "Test notes"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockPatchStepOne.mockReturnValue({ unwrap: mockUnwrap });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepOne]);
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateForApi.mockReturnValue("2024-01-15");
        formatDateToMonthDayYear.mockReturnValue("January 15, 2024");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(result.current.isPreSolicitationPackageSent).toBe(false);
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.step1DateCompleted).toBe("");
            expect(result.current.step1Notes).toBe("");
        });

        it("provides MemoizedDatePicker component", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(result.current.MemoizedDatePicker).toBeDefined();
            expect(typeof result.current.MemoizedDatePicker).toBe("object");
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(typeof result.current.setIsPreSolicitationPackageSent).toBe("function");
            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setStep1DateCompleted).toBe("function");
            expect(typeof result.current.setStep1Notes).toBe("function");
        });
    });

    describe("State Updates", () => {
        it("updates isPreSolicitationPackageSent when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
            });

            expect(result.current.isPreSolicitationPackageSent).toBe(true);
        });

        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates step1DateCompleted when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setStep1DateCompleted("2024-03-20");
            });

            expect(result.current.step1DateCompleted).toBe("2024-03-20");
        });

        it("updates step1Notes when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setStep1Notes("New notes");
            });

            expect(result.current.step1Notes).toBe("New notes");
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with getErrors method", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(typeof result.current.runValidate).toBe("function");
        });

        it("runValidate can be called with name and value", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.runValidate("users_combobox", 123);
            });

            // The function should execute without error
            expect(result.current.runValidate).toBeDefined();
        });
    });

    describe("Display Values", () => {
        it("step1CompletedByUserName fetches user name via hook", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(123);
            expect(result.current.step1CompletedByUserName).toBe("John Doe");
        });

        it("step1DateCompletedLabel formats date via helper", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-01-15");
            expect(result.current.step1DateCompletedLabel).toBe("January 15, 2024");
        });

        it("step1NotesLabel displays raw notes from stepOneData", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(result.current.step1NotesLabel).toBe("Test notes");
        });

        it("handles undefined/null stepOneData gracefully", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(undefined));

            expect(result.current.step1NotesLabel).toBeUndefined();
            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(undefined);
            expect(formatDateToMonthDayYear).toHaveBeenCalledWith(undefined);
        });
    });

    describe("Validation Logic - disableStep1Buttons", () => {
        it("is disabled when checkbox unchecked", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            expect(result.current.disableStep1Buttons).toBe(true);
        });

        it("is disabled when checkbox checked but no user selected", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setStep1DateCompleted("2024-03-20");
            });

            expect(result.current.disableStep1Buttons).toBe(true);
        });

        it("is disabled when checkbox checked and user selected but no date", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
            });

            expect(result.current.disableStep1Buttons).toBe(true);
        });

        it("is enabled when all required fields filled", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            expect(result.current.disableStep1Buttons).toBe(false);
        });

        it("handles user object without id", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            expect(result.current.disableStep1Buttons).toBe(true);
        });

        it("reverts to disabled when checkbox unchecked after being checked", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            expect(result.current.disableStep1Buttons).toBe(false);

            act(() => {
                result.current.setIsPreSolicitationPackageSent(false);
            });

            expect(result.current.disableStep1Buttons).toBe(true);
        });
    });

    describe("Async Operation - handleStep1Complete Success", () => {
        beforeEach(() => {
            mockUnwrap.mockResolvedValue({ success: true });
            vi.spyOn(console, "log").mockImplementation(() => {});
        });

        it("calls API with correct payload", async () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
                result.current.setStep1Notes("Test notes");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(mockPatchStepOne).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-01-15",
                    notes: "Test notes"
                }
            });
        });

        it("logs success message to console", async () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(console.log).toHaveBeenCalledWith("Procurement Tracker Step 1 Updated");
        });

        it("trims whitespace from notes", async () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
                result.current.setStep1Notes("  Test notes with spaces  ");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(mockPatchStepOne).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-01-15",
                    notes: "Test notes with spaces"
                }
            });
        });

        it("handles empty selectedUser gracefully", async () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setStep1DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(mockPatchStepOne).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: undefined,
                    date_completed: "2024-01-15",
                    notes: ""
                }
            });
        });

        it("handles empty notes (whitespace only)", async () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
                result.current.setStep1Notes("   ");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(mockPatchStepOne).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-01-15",
                    notes: ""
                }
            });
        });
    });

    describe("Error Handling", () => {
        let mockSetAlert;

        beforeEach(() => {
            vi.spyOn(console, "error").mockImplementation(() => {});
            mockSetAlert = vi.fn();
            useAlert.mockReturnValue({ setAlert: mockSetAlert });
        });

        it("handles API error with console.error and setAlert", async () => {
            const mockError = new Error("API Error");
            mockUnwrap.mockRejectedValue(mockError);

            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(console.error).toHaveBeenCalledWith("Failed to update Procurement Tracker Step 1", mockError);
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        });

        it("handles API error gracefully", async () => {
            const mockError = new Error("API Error");
            mockUnwrap.mockRejectedValue(mockError);

            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(console.error).toHaveBeenCalledWith("Failed to update Procurement Tracker Step 1", mockError);
            expect(mockSetAlert).toHaveBeenCalled();
        });
    });

    describe("Cancel Functionality", () => {
        it("cancelModalStep1 sets up modal with correct properties", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
                result.current.setStep1Notes("Test notes");
            });

            expect(result.current.showModal).toBe(false);

            act(() => {
                result.current.cancelModalStep1();
            });

            // After cancelModalStep1, modal should be shown
            expect(result.current.showModal).toBe(true);

            // Modal should have correct properties
            expect(result.current.modalProps.heading).toContain("Are you sure you want to cancel");
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Task");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue Editing");
            expect(typeof result.current.modalProps.handleConfirm).toBe("function");
        });

        it("modal handleConfirm resets all form state to initial values", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("2024-03-20");
                result.current.setStep1Notes("Test notes");
            });

            expect(result.current.isPreSolicitationPackageSent).toBe(true);

            act(() => {
                result.current.cancelModalStep1();
            });

            // Call the handleConfirm function from the modal
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(result.current.isPreSolicitationPackageSent).toBe(false);
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.step1DateCompleted).toBe("");
            expect(result.current.step1Notes).toBe("");
        });

        it("can call cancelModalStep1 multiple times", () => {
            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.cancelModalStep1();
                result.current.cancelModalStep1();
            });

            // Modal should be shown after multiple calls
            expect(result.current.showModal).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("maintains state independence across hook instances", () => {
            const { result: result1 } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));
            const { result: result2 } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result1.current.setIsPreSolicitationPackageSent(true);
            });

            expect(result1.current.isPreSolicitationPackageSent).toBe(true);
            expect(result2.current.isPreSolicitationPackageSent).toBe(false);
        });

        it("verifies formatDateForApi called with correct format", async () => {
            mockUnwrap.mockResolvedValue({ success: true });
            vi.spyOn(console, "log").mockImplementation(() => {});

            const { result } = renderHook(() => useProcurementTrackerStepOne(mockStepOneData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep1DateCompleted("03/20/2024");
            });

            await act(async () => {
                await result.current.handleStep1Complete(1);
            });

            expect(formatDateForApi).toHaveBeenCalledWith("03/20/2024");
        });
    });
});
