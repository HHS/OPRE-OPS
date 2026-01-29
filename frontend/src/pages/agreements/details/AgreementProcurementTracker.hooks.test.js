import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useAgreementProcurementTracker from "./AgreementProcurementTracker.hooks";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";

// Mock the API hook
vi.mock("../../../api/opsAPI", () => ({
    useUpdateProcurementTrackerStepMutation: vi.fn()
}));

// Mock formatDateForApi helper
vi.mock("../../../helpers/utils", () => ({
    formatDateForApi: vi.fn((date) => date)
}));

describe("useAgreementProcurementTracker", () => {
    let mockPatchStepOne;
    let mockUnwrap;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnwrap = vi.fn().mockResolvedValue({ data: {} });
        mockPatchStepOne = vi.fn().mockReturnValue({
            unwrap: mockUnwrap
        });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepOne, { isLoading: false }]);

        // Mock console.log
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    it("initializes with correct default state", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());

        expect(result.current.isPreSolicitationPackageSent).toBe(false);
        expect(result.current.selectedUser).toEqual({});
        expect(result.current.step1DateCompleted).toBe("");
        expect(result.current.step1Notes).toBe("");
    });

    it("provides setIsPreSolicitationPackageSent function", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());

        act(() => {
            result.current.setIsPreSolicitationPackageSent(true);
        });

        expect(result.current.isPreSolicitationPackageSent).toBe(true);
    });

    it("provides setSelectedUser function", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const testUser = { id: 1, full_name: "Test User", email: "test@example.com" };

        act(() => {
            result.current.setSelectedUser(testUser);
        });

        expect(result.current.selectedUser).toEqual(testUser);
    });

    it("provides setStep1DateCompleted function", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const testDate = "2024-01-15";

        act(() => {
            result.current.setStep1DateCompleted(testDate);
        });

        expect(result.current.step1DateCompleted).toBe(testDate);
    });

    it("provides setStep1Notes function", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const testNotes = "Test notes for step 1";

        act(() => {
            result.current.setStep1Notes(testNotes);
        });

        expect(result.current.step1Notes).toBe(testNotes);
    });

    it("provides MemoizedDatePicker component", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());

        expect(result.current.MemoizedDatePicker).toBeDefined();
        expect(typeof result.current.MemoizedDatePicker).toBe("object");
    });

    it("handleStep1Complete calls API with correct payload", async () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const stepId = 101;
        const testUser = { id: 5, full_name: "John Doe", email: "john@example.com" };
        const testDate = "2024-01-15";
        const testNotes = "Completed successfully";

        act(() => {
            result.current.setSelectedUser(testUser);
            result.current.setStep1DateCompleted(testDate);
            result.current.setStep1Notes(testNotes);
        });

        await act(async () => {
            await result.current.handleStep1Complete(stepId);
        });

        expect(mockPatchStepOne).toHaveBeenCalledWith({
            stepId: 101,
            data: {
                status: "COMPLETED",
                task_completed_by: 5,
                date_completed: "2024-01-15",
                notes: "Completed successfully"
            }
        });

        expect(mockUnwrap).toHaveBeenCalled();
    });

    it("handleStep1Complete logs success message", async () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const consoleLogSpy = vi.spyOn(console, "log");

        await act(async () => {
            await result.current.handleStep1Complete(101);
        });

        await waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalledWith("Procurement Tracker Step 1 Updated");
        });
    });

    it("handleStep1Complete handles empty selectedUser", async () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const stepId = 101;

        await act(async () => {
            await result.current.handleStep1Complete(stepId);
        });

        expect(mockPatchStepOne).toHaveBeenCalledWith({
            stepId: 101,
            data: {
                status: "COMPLETED",
                task_completed_by: undefined,
                date_completed: "",
                notes: ""
            }
        });
    });

    it("handleStep1Complete handles API error gracefully", async () => {
        const mockError = new Error("API Error");
        const mockUnwrapError = vi.fn().mockRejectedValue(mockError);
        const mockPatchStepOneError = vi.fn().mockReturnValue({
            unwrap: mockUnwrapError
        });
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepOneError, { isLoading: false }]);

        // Mock window.alert
        const mockAlert = vi.fn();
        vi.stubGlobal("alert", mockAlert);

        // Mock console.error
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useAgreementProcurementTracker());

        await act(async () => {
            await result.current.handleStep1Complete(101);
        });

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update Procurement Tracker Step 1", mockError);

        // Verify alert was called
        expect(mockAlert).toHaveBeenCalledWith("Unable to update Procurement Tracker Step 1. Please try again.");

        // Cleanup
        consoleErrorSpy.mockRestore();
        vi.unstubAllGlobals();
    });

    it("handleStep1Complete with all fields populated", async () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const stepId = 201;
        const testUser = { id: 10, full_name: "Jane Smith", email: "jane@example.com" };
        const testDate = "2024-02-20";
        const testNotes = "All documents reviewed and approved";

        act(() => {
            result.current.setIsPreSolicitationPackageSent(true);
            result.current.setSelectedUser(testUser);
            result.current.setStep1DateCompleted(testDate);
            result.current.setStep1Notes(testNotes);
        });

        await act(async () => {
            await result.current.handleStep1Complete(stepId);
        });

        expect(mockPatchStepOne).toHaveBeenCalledWith({
            stepId: 201,
            data: {
                status: "COMPLETED",
                task_completed_by: 10,
                date_completed: "2024-02-20",
                notes: "All documents reviewed and approved"
            }
        });
    });

    it("handleStep1Complete trims whitespace from notes", async () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());
        const stepId = 201;
        const testUser = { id: 10, full_name: "Jane Smith", email: "jane@example.com" };
        const testDate = "2024-02-20";
        const testNotesWithWhitespace = "  Notes with whitespace  ";

        act(() => {
            result.current.setIsPreSolicitationPackageSent(true);
            result.current.setSelectedUser(testUser);
            result.current.setStep1DateCompleted(testDate);
            result.current.setStep1Notes(testNotesWithWhitespace);
        });

        await act(async () => {
            await result.current.handleStep1Complete(stepId);
        });

        expect(mockPatchStepOne).toHaveBeenCalledWith({
            stepId: 201,
            data: {
                status: "COMPLETED",
                task_completed_by: 10,
                date_completed: "2024-02-20",
                notes: "Notes with whitespace"
            }
        });
    });

    it("maintains state independence across hook instances", () => {
        const { result: result1 } = renderHook(() => useAgreementProcurementTracker());
        const { result: result2 } = renderHook(() => useAgreementProcurementTracker());

        act(() => {
            result1.current.setStep1Notes("Notes from instance 1");
        });

        expect(result1.current.step1Notes).toBe("Notes from instance 1");
        expect(result2.current.step1Notes).toBe("");
    });

    describe("cancelStep1", () => {
        it("resets all step 1 form state to initial values", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            // Set all form values
            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 1, full_name: "Test User", email: "test@example.com" });
                result.current.setStep1DateCompleted("2024-01-15");
                result.current.setStep1Notes("Some notes here");
            });

            // Verify values are set
            expect(result.current.isPreSolicitationPackageSent).toBe(true);
            expect(result.current.selectedUser).toEqual({
                id: 1,
                full_name: "Test User",
                email: "test@example.com"
            });
            expect(result.current.step1DateCompleted).toBe("2024-01-15");
            expect(result.current.step1Notes).toBe("Some notes here");

            // Call cancelStep1
            act(() => {
                result.current.cancelStep1();
            });

            // Verify all values are reset
            expect(result.current.isPreSolicitationPackageSent).toBe(false);
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.step1DateCompleted).toBe("");
            expect(result.current.step1Notes).toBe("");
        });
    });

    describe("disableStep1Continue", () => {
        it("is true when checkbox is not checked", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            expect(result.current.disableStep1Continue).toBe(true);
        });

        it("is true when checkbox is checked but no user is selected", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setStep1DateCompleted("2024-01-15");
            });

            expect(result.current.disableStep1Continue).toBe(true);
        });

        it("is true when checkbox is checked and user is selected but no date", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 1, full_name: "Test User" });
            });

            expect(result.current.disableStep1Continue).toBe(true);
        });

        it("is false when all required fields are filled", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 1, full_name: "Test User" });
                result.current.setStep1DateCompleted("2024-01-15");
            });

            expect(result.current.disableStep1Continue).toBe(false);
        });

        it("is true when checkbox is unchecked after being checked", () => {
            const { result } = renderHook(() => useAgreementProcurementTracker());

            act(() => {
                result.current.setIsPreSolicitationPackageSent(true);
                result.current.setSelectedUser({ id: 1, full_name: "Test User" });
                result.current.setStep1DateCompleted("2024-01-15");
            });

            expect(result.current.disableStep1Continue).toBe(false);

            act(() => {
                result.current.setIsPreSolicitationPackageSent(false);
            });

            expect(result.current.disableStep1Continue).toBe(true);
        });
    });

    it("exports STEP_STATUSES constants", () => {
        const { result } = renderHook(() => useAgreementProcurementTracker());

        expect(result.current.STEP_STATUSES).toEqual({
            PENDING: "PENDING",
            COMPLETED: "COMPLETED"
        });
    });
});
