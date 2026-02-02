import { beforeEach, describe, it, expect } from "vitest";
import suite from "./suite";

describe("ProcurementTrackerStepOne Validation Suite", () => {
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
        users: { id: 1, full_name: "John Doe" },
        dateCompleted: getTodayDate()
    };

    const invalidData = {
        users: null,
        dateCompleted: ""
    };

    describe("Valid Data", () => {
        it("should pass validation with all valid fields", () => {
            const result = suite(validData);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("users")).toHaveLength(0);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });

        it("should pass validation with today's date", () => {
            const data = { ...validData, dateCompleted: getTodayDate() };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });

        it("should pass validation with a past date", () => {
            const data = { ...validData, dateCompleted: getPastDate() };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });
    });

    describe("Users Field Validation", () => {
        it("should fail when users field is empty", () => {
            const data = { ...validData, users: null };
            const result = suite(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should fail when users field is undefined", () => {
            const data = { ...validData, users: undefined };
            const result = suite(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should fail when users field is empty string", () => {
            const data = { ...validData, users: "" };
            const result = suite(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should pass when users field has a valid user object", () => {
            const data = { ...validData, users: { id: 123, full_name: "Jane Smith" } };
            const result = suite(data, "users");

            expect(result.hasErrors("users")).toBe(false);
            expect(result.getErrors("users")).toHaveLength(0);
        });
    });

    describe("Date Completed Field - Required Validation", () => {
        it("should fail when dateCompleted is empty", () => {
            const data = { ...validData, dateCompleted: "" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should fail when dateCompleted is null", () => {
            const data = { ...validData, dateCompleted: null };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should fail when dateCompleted is undefined", () => {
            const data = { ...validData, dateCompleted: undefined };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });
    });

    describe("Date Completed Field - Format Validation", () => {
        it("should fail with invalid date format (wrong separator)", () => {
            const data = { ...validData, dateCompleted: "01-15-2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (single digit month)", () => {
            const data = { ...validData, dateCompleted: "1/15/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (single digit day)", () => {
            const data = { ...validData, dateCompleted: "01/5/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (two digit year)", () => {
            const data = { ...validData, dateCompleted: "01/15/24" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (text)", () => {
            const data = { ...validData, dateCompleted: "January 15, 2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid date format (ISO format)", () => {
            const data = { ...validData, dateCompleted: "2024-01-15" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should pass with valid MM/DD/YYYY format", () => {
            const data = { ...validData, dateCompleted: "01/15/2024" };
            const result = suite(data, "dateCompleted");

            // Should not have format error (may have other errors like future date)
            const errors = result.getErrors("dateCompleted");
            expect(errors).not.toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid month (13)", () => {
            const data = { ...validData, dateCompleted: "13/15/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid day (32)", () => {
            const data = { ...validData, dateCompleted: "01/32/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid day (00)", () => {
            const data = { ...validData, dateCompleted: "01/00/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should fail with invalid month (00)", () => {
            const data = { ...validData, dateCompleted: "00/15/2024" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });
    });

    describe("Date Completed Field - Range Validation", () => {
        it("should fail when date is in the future", () => {
            const data = { ...validData, dateCompleted: getFutureDate() };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be today or earlier");
        });

        it("should pass when date is today", () => {
            const data = { ...validData, dateCompleted: getTodayDate() };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).not.toContain("Date must be today or earlier");
        });

        it("should pass when date is in the past", () => {
            const data = { ...validData, dateCompleted: getPastDate() };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).not.toContain("Date must be today or earlier");
        });

        it("should pass when date is far in the past", () => {
            const data = { ...validData, dateCompleted: "01/01/2020" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(false);
            expect(result.getErrors("dateCompleted")).not.toContain("Date must be today or earlier");
        });
    });

    describe("Multiple Field Validation", () => {
        it("should fail validation when all fields are invalid", () => {
            const result = suite(invalidData);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should show all date errors when date is invalid", () => {
            const data = { ...validData, dateCompleted: "invalid" };
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            const errors = result.getErrors("dateCompleted");
            // Should have format error, and possibly range error depending on validation order
            expect(errors).toContain("Date must be MM/DD/YYYY");
        });
    });

    describe("Field-Specific Validation (only())", () => {
        it("should only validate the specified field when using only()", () => {
            const data = { users: null, dateCompleted: "invalid" };

            // Only validate users field
            const result = suite(data, "users");

            expect(result.hasErrors("users")).toBe(true);
            // dateCompleted errors should not appear because we only validated users
            expect(result.getErrors("dateCompleted")).toHaveLength(0);
        });

        it("should only validate dateCompleted when specified", () => {
            const data = { users: null, dateCompleted: getFutureDate() };

            // Only validate dateCompleted field
            const result = suite(data, "dateCompleted");

            expect(result.hasErrors("dateCompleted")).toBe(true);
            // users errors should not appear because we only validated dateCompleted
            expect(result.getErrors("users")).toHaveLength(0);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data object", () => {
            const result = suite({});

            expect(result.hasErrors()).toBe(true);
        });

        it("should handle null data", () => {
            const result = suite(null);

            expect(result.hasErrors()).toBe(true);
        });

        it("should handle undefined data", () => {
            const result = suite(undefined);

            expect(result.hasErrors()).toBe(true);
        });

        it("should handle date with spaces", () => {
            const data = { ...validData, dateCompleted: " 01/15/2024 " };
            const result = suite(data, "dateCompleted");

            // Should fail format validation due to leading/trailing spaces
            expect(result.hasErrors("dateCompleted")).toBe(true);
        });

        it("should fail validation when users field is empty object", () => {
            const data = { ...validData, users: {} };
            const result = suite(data, "users");

            // Empty object should fail isNotEmpty check
            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });
    });
});
