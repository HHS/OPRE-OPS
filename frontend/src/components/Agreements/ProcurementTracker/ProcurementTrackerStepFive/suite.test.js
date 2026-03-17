import { beforeEach, describe, it, expect } from "vitest";
import suite from "./suite";

describe("ProcurementTrackerStepFive Validation Suite", () => {
    // Reset suite state before each test to prevent stale validation errors
    beforeEach(() => {
        suite.reset();
    });

    // Helper to get today's date in MM/DD/YYYY format
    const getTodayDate = () => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const year = today.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Helper to get a past date in MM/DD/YYYY format
    const getPastDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const month = String(yesterday.getMonth() + 1).padStart(2, "0");
        const day = String(yesterday.getDate()).padStart(2, "0");
        const year = yesterday.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Helper to get a future date in MM/DD/YYYY format
    const getFutureDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const day = String(tomorrow.getDate()).padStart(2, "0");
        const year = tomorrow.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const validData = {
        dateCompleted: getTodayDate(),
        users: { id: 123, full_name: "John Doe" }
    };

    describe("Valid Data", () => {
        it("should pass validation with valid dateCompleted field", () => {
            const result = suite.run(validData, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });

        it("should pass validation with today's date", () => {
            const data = { dateCompleted: getTodayDate() };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });

        it("should pass validation with a past date", () => {
            const data = { dateCompleted: getPastDate() };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });
    });

    describe("Date Completed Field - Required Validation", () => {
        it("should fail when dateCompleted is empty", () => {
            const data = { dateCompleted: "" };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should fail when dateCompleted is null", () => {
            const data = { dateCompleted: null };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should fail when dateCompleted is undefined", () => {
            const data = { dateCompleted: undefined };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });
    });

    describe("Date Completed Field - Format Validation", () => {
        it("should fail with invalid date format (wrong separator)", () => {
            const data = { dateCompleted: "01-15-2024" };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (single digit month)", () => {
            const data = { dateCompleted: "1/15/2024" };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should pass with valid MM/DD/YYYY format", () => {
            const data = { dateCompleted: "01/15/2024" };
            const result = suite.run(data, "dateCompleted");

            // Should not have format error (may have other errors like future date)
            const errors = result.getErrors("dateCompleted");
            expect(errors).not.toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid month (13)", () => {
            const data = { dateCompleted: "13/15/2024" };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid day (32)", () => {
            const data = { dateCompleted: "01/32/2024" };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });
    });

    describe("Date Completed Field - Range Validation", () => {
        it("should fail when date is in the future", () => {
            const data = { dateCompleted: getFutureDate() };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be today or earlier");
        });

        it("should pass when date is today", () => {
            const data = { dateCompleted: getTodayDate() };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).not.toContain("Date must be today or earlier");
        });

        it("should pass when date is in the past", () => {
            const data = { dateCompleted: getPastDate() };
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).not.toContain("Date must be today or earlier");
        });
    });

    describe("Target Completion Date Field - Optional Validation", () => {
        it("should pass when targetCompletionDate is empty (optional field)", () => {
            const data = { targetCompletionDate: "" };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(false);
        });

        it("should pass when targetCompletionDate is null (optional field)", () => {
            const data = { targetCompletionDate: null };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(false);
        });

        it("should pass when targetCompletionDate is undefined (optional field)", () => {
            const data = { targetCompletionDate: undefined };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(false);
        });
    });

    describe("Target Completion Date Field - Format Validation", () => {
        it("should fail with invalid format when value is provided", () => {
            const data = { targetCompletionDate: "01-15-2024" };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(true);
            expect(result.getErrors("targetCompletionDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should pass with valid MM/DD/YYYY format", () => {
            const data = { targetCompletionDate: getFutureDate() };
            const result = suite.run(data, "targetCompletionDate");

            const errors = result.getErrors("targetCompletionDate");
            expect(errors).not.toContain("Date must be MM/DD/YYYY");
        });
    });

    describe("Target Completion Date Field - Range Validation", () => {
        it("should fail when target completion date is in the past", () => {
            const data = { targetCompletionDate: getPastDate() };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(true);
            expect(result.getErrors("targetCompletionDate")).toContain("Date cannot be in the past");
        });

        it("should pass when target completion date is today", () => {
            const data = { targetCompletionDate: getTodayDate() };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(false);
            expect(result.getErrors("targetCompletionDate")).not.toContain("Date cannot be in the past");
        });

        it("should pass when target completion date is in the future", () => {
            const data = { targetCompletionDate: getFutureDate() };
            const result = suite.run(data, "targetCompletionDate");

            expect(result.hasErrors("targetCompletionDate")).toBe(false);
            expect(result.getErrors("targetCompletionDate")).not.toContain("Date cannot be in the past");
        });
    });

    describe("Users Field - Required Validation", () => {
        it("should fail when users is empty", () => {
            const data = { users: "" };
            const result = suite.run(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should fail when users is null", () => {
            const data = { users: null };
            const result = suite.run(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should pass when users is present", () => {
            const data = { users: { id: 456, full_name: "Jane Smith" } };
            const result = suite.run(data, "users");

            expect(result.hasErrors("users")).toBe(false);
            expect(result.getErrors("users")).toHaveLength(0);
        });
    });

    describe("Field-Specific Validation (only())", () => {
        it("should only validate the specified field when using only()", () => {
            const data = { dateCompleted: "invalid" };

            // Only validate dateCompleted field
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
        });

        it("should validate dateCompleted when specified", () => {
            const data = { dateCompleted: getFutureDate() };

            // Only validate dateCompleted field
            const result = suite.run(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be today or earlier");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data object", () => {
            const result = suite.run({}, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
        });

        it("should handle null data", () => {
            const result = suite.run(null, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
        });

        it("should handle undefined data", () => {
            const result = suite.run(undefined, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
        });
    });
});
