import { beforeEach } from "vitest";
import suite from "./datePickerSuite";

describe("datePickerSuite Validation", () => {
    const getFutureDate = () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const year = futureDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const getPastDate = () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const month = String(pastDate.getMonth() + 1).padStart(2, "0");
        const day = String(pastDate.getDate()).padStart(2, "0");
        const year = pastDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    beforeEach(() => {
        suite.reset();
    });

    describe("Regular User Validations", () => {
        it("should pass validation with a future date", () => {
            const result = suite.run({ needByDate: getFutureDate() });

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should fail validation with a past date", () => {
            const result = suite.run({ needByDate: getPastDate() });

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });

        it("should fail validation with an invalid date format", () => {
            const result = suite.run({ needByDate: "not-a-date" });

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should skip validation when needByDate is null", () => {
            const result = suite.run({ needByDate: null });

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validation when needByDate is empty string", () => {
            const result = suite.run({ needByDate: "" });

            expect(result.hasErrors()).toBe(false);
        });
    });

    describe("SUPER_USER Validations", () => {
        it("should skip validation for SUPER_USER with a past date", () => {
            const result = suite.run({ needByDate: "01/01/2020" }, true);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should skip validation for SUPER_USER with an invalid date format", () => {
            const result = suite.run({ needByDate: "not-a-date" }, true);

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validation for SUPER_USER with a future date", () => {
            const result = suite.run({ needByDate: getFutureDate() }, true);

            expect(result.hasErrors()).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should default to non-super-user behavior when isSuperUser is undefined", () => {
            const result = suite.run({ needByDate: getPastDate() }, undefined);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });

        it("should default to non-super-user behavior when isSuperUser is false", () => {
            const result = suite.run({ needByDate: getPastDate() }, false);

            expect(result.hasErrors()).toBe(true);
        });
    });
});
