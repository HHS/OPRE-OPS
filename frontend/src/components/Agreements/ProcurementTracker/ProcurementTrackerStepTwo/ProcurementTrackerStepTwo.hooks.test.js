import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import suite from "./suite";

vi.mock("../../../../hooks/user.hooks");

describe("useProcurementTrackerStepTwo", () => {
    const mockStepTwoData = {
        id: 102,
        step_number: 2,
        status: "PENDING"
    };

    beforeEach(() => {
        suite.reset();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-30T12:00:00.000Z"));
        useGetUserFullNameFromId.mockReturnValue("John Doe");
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("initializes with default state", () => {
        const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

        expect(result.current.targetCompletionDate).toBe("");
        expect(result.current.stepTwoData).toEqual(mockStepTwoData);
        expect(result.current.MemoizedDatePicker).toBeDefined();
    });

    it("initializes targetCompletionDate from backend target_completion_date", () => {
        const stepTwoDataWithDate = {
            ...mockStepTwoData,
            target_completion_date: "01/31/2024"
        };
        const { result } = renderHook(() => useProcurementTrackerStepTwo(stepTwoDataWithDate));

        expect(result.current.targetCompletionDate).toBe("01/31/2024");
    });

    it("updates targetCompletionDate via setter", () => {
        const { result } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

        act(() => {
            result.current.setTargetCompletionDate("01/31/2024");
        });

        expect(result.current.targetCompletionDate).toBe("01/31/2024");
    });

    it("sets validation errors for invalid date format", () => {
        const { result, rerender } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

        act(() => {
            result.current.runValidate("targetCompletionDate", "2024-01-30");
        });
        rerender();

        expect(result.current.validatorRes.hasErrors("targetCompletionDate")).toBe(true);
        expect(result.current.validatorRes.getErrors("targetCompletionDate")).toContain("Date must be MM/DD/YYYY");
    });

    it("clears validation errors after valid input", () => {
        const { result, rerender } = renderHook(() => useProcurementTrackerStepTwo(mockStepTwoData));

        act(() => {
            result.current.runValidate("targetCompletionDate", "2024-01-30");
        });
        rerender();
        expect(result.current.validatorRes.hasErrors("targetCompletionDate")).toBe(true);

        act(() => {
            result.current.runValidate("targetCompletionDate", "01/30/2024");
        });
        rerender();

        expect(result.current.validatorRes.hasErrors("targetCompletionDate")).toBe(false);
        expect(result.current.validatorRes.getErrors("targetCompletionDate")).toHaveLength(0);
    });
});
