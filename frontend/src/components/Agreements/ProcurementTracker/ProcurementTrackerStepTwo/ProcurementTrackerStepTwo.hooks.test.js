import { renderHook, act } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
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
vi.mock("../../../../api/opsAPI", () => ({
    useUpdateProcurementTrackerStepMutation: vi.fn(() => [vi.fn(), {}])
}));
vi.mock("../../../../hooks/use-alert.hooks", () => ({
    default: vi.fn(() => ({ setAlert: vi.fn() }))
}));

describe("useProcurementTrackerStepTwo", () => {
    const mockPatchStepTwo = vi.fn();
    const mockSetAlert = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
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
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.selectedUser).toEqual({});
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step2DateCompleted).toBe("");
        });

        it("returns all setter functions", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.setSelectedUser).toBe("function");
            expect(typeof result.current.setTargetCompletionDate).toBe("function");
            expect(typeof result.current.setStep2DateCompleted).toBe("function");
        });

        it("returns stepTwoData", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.stepTwoData).toEqual(mockStepTwoData);
        });
    });

    describe("State Updates", () => {
        it("updates selectedUser when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );
            const mockUser = { id: 456, full_name: "Jane Smith" };

            act(() => {
                result.current.setSelectedUser(mockUser);
            });

            expect(result.current.selectedUser).toEqual(mockUser);
        });

        it("updates targetCompletionDate when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setTargetCompletionDate("2024-03-20");
            });

            expect(result.current.targetCompletionDate).toBe("2024-03-20");
        });

        it("updates step2DateCompleted when setter is called", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setStep2DateCompleted("2024-03-20");
            });

            expect(result.current.step2DateCompleted).toBe("2024-03-20");
        });
    });

    describe("Validation Functionality", () => {
        it("provides validatorRes with getErrors method", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(result.current.validatorRes).toBeDefined();
            expect(typeof result.current.validatorRes.getErrors).toBe("function");
        });

        it("provides runValidate function", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(typeof result.current.runValidate).toBe("function");
        });

        it("runValidate can be called with name and value", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            expect(() => {
                act(() => {
                    result.current.runValidate("dateCompleted", "01/15/2024");
                });
            }).not.toThrow();
        });
    });

    describe("Display Values", () => {
        it("step2CompletedByUserName fetches user name via hook", () => {
            renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(123);
        });

        it("step2DateCompletedLabel formats date via helper", () => {
            renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber));

            expect(formatDateToMonthDayYear).toHaveBeenCalledWith("2024-01-15");
        });

        it("handles undefined/null stepTwoData gracefully", () => {
            renderHook(() => useProcurementTrackerStepTwo(undefined));

            expect(useGetUserFullNameFromId).toHaveBeenCalledWith(undefined);
            expect(formatDateToMonthDayYear).toHaveBeenCalledWith(undefined);
        });
    });

    describe("Async Operations", () => {
        it("calls handleSetCompletedStepNumber with 2 after successful step completion", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepTwo.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepTwo]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreSolicitationPackageFinalized(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep2DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStepTwoComplete(1);
            });

            expect(mockHandleSetCompletedStepNumber).toHaveBeenCalledWith(2);
        });

        it("does not call handleSetCompletedStepNumber if function not provided", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepTwo.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepTwo]);

            const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData, undefined));

            act(() => {
                result.current.setIsPreSolicitationPackageFinalized(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep2DateCompleted("2024-03-20");
            });

            await act(async () => {
                await result.current.handleStepTwoComplete(1);
            });

            // Should not throw an error
            expect(result.current).toBeDefined();
        });

        it("includes target_completion_date in payload when completing step", async () => {
            const mockUnwrap = vi.fn().mockResolvedValue({ success: true });
            mockPatchStepTwo.mockReturnValue({ unwrap: mockUnwrap });
            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepTwo]);

            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreSolicitationPackageFinalized(true);
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setStep2DateCompleted("03/20/2024");
                result.current.setTargetCompletionDate("04/15/2024");
                result.current.setDraftSolicitationDate("05/01/2024");
                result.current.setStep2Notes("Test notes");
            });

            await act(async () => {
                await result.current.handleStepTwoComplete(1);
            });

            expect(mockPatchStepTwo).toHaveBeenCalledWith({
                stepId: 1,
                data: {
                    status: "COMPLETED",
                    task_completed_by: 456,
                    date_completed: "2024-03-20",
                    notes: "Test notes",
                    target_completion_date: "2024-04-15",
                    draft_solicitation_date: "2024-05-01"
                }
            });
        });
    });

    describe("Edge Cases", () => {
        it("maintains state independence across hook instances", () => {
            const { result: result1 } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );
            const { result: result2 } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

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
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setTargetCompletionDate("2024-03-20");
                result.current.setStep2DateCompleted("2024-03-15");
            });

            expect(result.current.selectedUser).toEqual({ id: 456, full_name: "Jane Smith" });
            expect(result.current.targetCompletionDate).toBe("2024-03-20");
            expect(result.current.step2DateCompleted).toBe("2024-03-15");
        });

        it("cancelStepTwo resets step two state values", () => {
            const { result } = renderHook(() =>
                useProcurementTrackerStepTwo(mockStepTwoData, mockHandleSetCompletedStepNumber)
            );

            act(() => {
                result.current.setIsPreSolicitationPackageFinalized(true);
                result.current.setDraftSolicitationDate("2024-05-01");
                result.current.setSelectedUser({ id: 456, full_name: "Jane Smith" });
                result.current.setTargetCompletionDate("2024-03-20");
                result.current.setStep2DateCompleted("2024-03-15");
                result.current.setStep2Notes("Some notes");
            });

            act(() => {
                result.current.cancelStepTwo();
            });

            expect(result.current.isPreSolicitationPackageFinalized).toBe(false);
            expect(result.current.draftSolicitationDate).toBe("");
            expect(result.current.selectedUser).toEqual({});
            expect(result.current.targetCompletionDate).toBe("");
            expect(result.current.step2DateCompleted).toBe("");
            expect(result.current.step2Notes).toBe("");
        });
    });
});
