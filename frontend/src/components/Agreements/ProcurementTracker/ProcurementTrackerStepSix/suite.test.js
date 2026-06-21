import { describe, it, expect } from "vitest";
import suite from "./suite";

describe("ProcurementTrackerStepSix validation suite", () => {
    describe("dateCompleted validation", () => {
        it("should require dateCompleted", () => {
            const result = suite.run({ dateCompleted: "" }, "dateCompleted");
            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("This is required information");
        });

        it("should validate MM/DD/YYYY format", () => {
            const result = suite.run({ dateCompleted: "2026-05-07" }, "dateCompleted");
            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be MM/DD/YYYY");
        });

        it("should reject future dates", () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const formattedDate = `${String(futureDate.getMonth() + 1).padStart(2, "0")}/${String(futureDate.getDate()).padStart(2, "0")}/${futureDate.getFullYear()}`;

            const result = suite.run({ dateCompleted: formattedDate }, "dateCompleted");
            expect(result.hasErrors("dateCompleted")).toBe(true);
            expect(result.getErrors("dateCompleted")).toContain("Date must be today or earlier");
        });

        it("should accept today's date", () => {
            const today = new Date();
            const formattedDate = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;

            const result = suite.run({ dateCompleted: formattedDate }, "dateCompleted");
            expect(result.hasErrors("dateCompleted")).toBe(false);
        });
    });

    describe("targetCompletionDate validation", () => {
        it("should allow empty targetCompletionDate", () => {
            const result = suite.run({ targetCompletionDate: "" }, "targetCompletionDate");
            expect(result.hasErrors("targetCompletionDate")).toBe(false);
        });

        it("should validate MM/DD/YYYY format if provided", () => {
            const result = suite.run({ targetCompletionDate: "2026-05-07" }, "targetCompletionDate");
            expect(result.hasErrors("targetCompletionDate")).toBe(true);
            expect(result.getErrors("targetCompletionDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should reject past dates", () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const formattedDate = `${String(yesterday.getMonth() + 1).padStart(2, "0")}/${String(yesterday.getDate()).padStart(2, "0")}/${yesterday.getFullYear()}`;

            const result = suite.run({ targetCompletionDate: formattedDate }, "targetCompletionDate");
            expect(result.hasErrors("targetCompletionDate")).toBe(true);
            expect(result.getErrors("targetCompletionDate")).toContain("Date cannot be in the past");
        });

        it("should accept future dates", () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const formattedDate = `${String(futureDate.getMonth() + 1).padStart(2, "0")}/${String(futureDate.getDate()).padStart(2, "0")}/${futureDate.getFullYear()}`;

            const result = suite.run({ targetCompletionDate: formattedDate }, "targetCompletionDate");
            expect(result.hasErrors("targetCompletionDate")).toBe(false);
        });
    });

    describe("users validation", () => {
        it("should require users", () => {
            const result = suite.run({ users: "" }, "users");
            expect(result.hasErrors("users")).toBe(true);
            expect(result.getErrors("users")).toContain("This is required information");
        });

        it("should accept non-empty users", () => {
            const result = suite.run({ users: "John Doe" }, "users");
            expect(result.hasErrors("users")).toBe(false);
        });
    });
});
