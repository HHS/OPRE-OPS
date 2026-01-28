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

        const { result } = renderHook(() => useAgreementProcurementTracker());

        // eslint-disable-next-line vitest/no-unneeded-async-expect-function
        await expect(async () => {
            await act(async () => {
                await result.current.handleStep1Complete(101);
            });
        }).rejects.toThrow("API Error");
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

    it("maintains state independence across hook instances", () => {
        const { result: result1 } = renderHook(() => useAgreementProcurementTracker());
        const { result: result2 } = renderHook(() => useAgreementProcurementTracker());

        act(() => {
            result1.current.setStep1Notes("Notes from instance 1");
        });

        expect(result1.current.step1Notes).toBe("Notes from instance 1");
        expect(result2.current.step1Notes).toBe("");
    });
});
