import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateToMonthDayYear } from "../../../../helpers/utils";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

vi.mock("../../../../hooks/user.hooks");
vi.mock("../../../../helpers/utils");
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

describe("useProcurementTrackerStepTwo", () => {
    const mockPatchStepTwo = vi.fn();
    const mockSetAlert = vi.fn();
    const mockStepTwoData = {
        id: 1,
        task_completed_by: 123,
        date_completed: "2024-01-15"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        formatDateToMonthDayYear.mockReturnValue("January 15, 2024");
        useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepTwo]);
        useAlert.mockReturnValue({ setAlert: mockSetAlert });
    });

    describe("State Initialization", () => {
        it("initializes with correct default state", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(result.current.selectedUser).toEqual({});
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step2DateCompleted).toBe("");
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setTargetCompletionDate).toBe("function");
            expect(typeof result.current.setStep2DateCompleted).toBe("function");
        });

        it("returns stepTwoData", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(result.current.stepTwoData).toEqual(mockStepTwoData);
        });
    });

    describe("State Updates", () => {
        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates targetCompletionDate when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            act(() => {
                result.current.setTargetCompletionDate("2024-03-20");
            });

            expect(result.current.targetCompletionDate).toBe("2024-03-20");
        });

        it("updates step2DateCompleted when setter is called", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            act(() => {
                result.current.setStep2DateCompleted("2024-03-20");
            });

            expect(result.current.step2DateCompleted).toBe("2024-03-20");
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with getErrors method", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(typeof result.current.runValidate).toBe("function");
        });

        it("runValidate can be called with name and value", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(() => {
                act(() => {
                    result.current.runValidate("dateCompleted", "01/15/2024");
                });
            }).not.toThrow();
        });
    });

    describe("Display Values", () => {
        it("step2CompletedByUserName fetches user name via hook", () => {
            renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(123);
        });

        it("step2DateCompletedLabel formats date via helper", () => {
            renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-01-15");
        });

        it("handles undefined/null stepTwoData gracefully", () => {
            renderHook(() => useProcurementTrackerStepTwo(undefined));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(undefined);
            expect(formatDateToMonthDayYear).toHaveBeenCalledWith(undefined);
        });
    });

    describe("Edge Cases", () => {
        it("maintains state independence across hook instances", () => {
            const { result: result1 } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));
            const { result: result2 } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            act(() => {
                result1.current.setTargetCompletionDate("2024-04-01");
            });

            expect(result1.current.targetCompletionDate).toBe("2024-04-01");
            expect(result2.current.targetCompletionDate).toBe("");
        });

        it("handles stepTwoData without task_completed_by", () => {
            const stepDataWithoutUser = { ...mockStepTwoData, task_completed_by: null };
            renderHook(() => useProcurementTrackerStepTwo(stepDataWithoutUser));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(null);
        });

        it("handles stepTwoData without date_completed", () => {
            const stepDataWithoutDate = { ...mockStepTwoData, date_completed: null };
            renderHook(() => useProcurementTrackerStepTwo(stepDataWithoutDate));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith(null);
        });

        it("updates multiple fields in sequence", () => {
            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setTargetCompletionDate("2024-03-20");
                result.current.setStep2DateCompleted("2024-03-15");
            });

            expect(result.current.selectedUser).toEqual({ id: 456, full_name: "Jane Smith" });
            expect(result.current.targetCompletionDate).toBe("2024-03-20");
            expect(result.current.step2DateCompleted).toBe("2024-03-15");
        });
    });
});
