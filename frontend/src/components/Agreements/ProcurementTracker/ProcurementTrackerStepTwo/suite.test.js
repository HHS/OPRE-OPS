import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import suite from "./suite";

describe("ProcurementTrackerStepTwo validation suite", () => {
    beforeEach(() => {
        suite.reset();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-30T12:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("passes validation for a valid MM/DD/YYYY date", () => {
        const result = suite({ targetCompletionDate: "01/30/2024" }, "targetCompletionDate");

        expect(result.hasErrors("targetCompletionDate")).toBe(false);
        expect(result.getErrors("targetCompletionDate")).toHaveLength(0);
    });

    it("fails format validation for non-MM/DD/YYYY dates", () => {
        const result = suite({ targetCompletionDate: "2024-01-30" }, "targetCompletionDate");

        expect(result.hasErrors("targetCompletionDate")).toBe(true);
        expect(result.getErrors("targetCompletionDate")).toContain("Date must be MM/DD/YYYY");
    });

    it("fails when date is in the past", () => {
        const result = suite({ targetCompletionDate: "01/29/2024" }, "targetCompletionDate");

        expect(result.hasErrors("targetCompletionDate")).toBe(true);
        expect(result.getErrors("targetCompletionDate")).toContain("Date must be today or later");
    });

    it("passes for today and future dates", () => {
        const todayResult = suite({ targetCompletionDate: "01/30/2024" }, "targetCompletionDate");
        const futureResult = suite({ targetCompletionDate: "01/31/2024" }, "targetCompletionDate");

        expect(todayResult.hasErrors("targetCompletionDate")).toBe(false);
        expect(futureResult.hasErrors("targetCompletionDate")).toBe(false);
    });

    it("does not report past-date error when format is invalid", () => {
        const result = suite({ targetCompletionDate: "not-a-date" }, "targetCompletionDate");

        expect(result.hasErrors("targetCompletionDate")).toBe(true);
        expect(result.getErrors("targetCompletionDate")).toContain("Date must be MM/DD/YYYY");
        expect(result.getErrors("targetCompletionDate")).not.toContain("Date must be today or later");
    });
});
