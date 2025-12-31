import { beforeEach } from "vitest";
import suite from "./suite";

describe("BudgetLinesForm Validation Suite", () => {
    // Generate a date that's always in the future for validation tests
    // Use 90 days to ensure it's well into the future even with timezone differences
    const getFutureDate = () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const year = futureDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Reset suite state before each test to prevent stale validation errors
    beforeEach(() => {
        suite.reset();
    });

    // Create validData dynamically to ensure fresh date on each access
    const getValidData = () => ({
        servicesComponentNumber: 1,
        selectedCan: { id: 1, number: "G123456" },
        enteredAmount: 1000,
        needByDate: getFutureDate()
    });

    const invalidData = {
        servicesComponentId: null,
        selectedCan: null,
        enteredAmount: null,
        needByDate: ""
    };

    describe("Regular User Validations", () => {
        it("should pass validation with valid data for regular users", () => {
            const result = suite(getValidData());

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("allServicesComponentSelect")).toHaveLength(0);
            expect(result.getErrors("selectedCan")).toHaveLength(0);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should fail validation with invalid data for regular users", () => {
            const result = suite(invalidData);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("allServicesComponentSelect")).toContain("This is required information");
            expect(result.getErrors("selectedCan")).toContain("This is required information");
            expect(result.getErrors("enteredAmount")).toContain("This is required information");
            expect(result.getErrors("needByDate")).toContain("This is required information");
        });

        it("should validate amount is greater than 0", () => {
            const dataWithZeroAmount = { ...getValidData(), enteredAmount: 0 };
            const result = suite(dataWithZeroAmount);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("enteredAmount")).toContain("Amount must be greater than 0");
        });

        it("should validate date format", () => {
            const dataWithInvalidDate = { ...getValidData(), needByDate: "invalid-date" };
            const result = suite(dataWithInvalidDate);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should validate date is in the future", () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const pastDate = `${String(yesterday.getMonth() + 1).padStart(2, "0")}/${String(yesterday.getDate()).padStart(2, "0")}/${yesterday.getFullYear()}`;

            const dataWithPastDate = { ...getValidData(), needByDate: pastDate };
            const result = suite(dataWithPastDate);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });
    });

    describe("SUPER_USER Validations", () => {
        it("should skip all validations for SUPER_USER with invalid data", () => {
            const result = suite(invalidData, true);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("allServicesComponentSelect")).toHaveLength(0);
            expect(result.getErrors("selectedCan")).toHaveLength(0);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should skip all validations for SUPER_USER with completely empty data", () => {
            const emptyData = {
                servicesComponentId: undefined,
                selectedCan: undefined,
                enteredAmount: undefined,
                needByDate: undefined
            };
            const result = suite(emptyData, true);

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validations for SUPER_USER even with negative amounts", () => {
            const dataWithNegativeAmount = { ...getValidData(), enteredAmount: -1000 };
            const result = suite(dataWithNegativeAmount, true);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
        });

        it("should skip validations for SUPER_USER even with past dates", () => {
            const dataWithPastDate = { ...getValidData(), needByDate: "01/01/2020" };
            const result = suite(dataWithPastDate, true);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });
    });

    describe("Mixed User Roles", () => {
        it("should skip validations when SUPER_USER is present with other roles", () => {
            const isSuperUser = true;
            const result = suite([invalidData], isSuperUser);

            expect(result.hasErrors()).toBe(false);
        });

        it("should validate normally when SUPER_USER is not present with other roles", () => {
            const isSuperUser = false;
            const result = suite([invalidData], isSuperUser);

            expect(result.hasErrors()).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle undefined userRoles parameter", () => {
            const result = suite(getValidData(), undefined);

            expect(result.hasErrors()).toBe(false);
        });

        it("should handle null userRoles parameter", () => {
            const result = suite(getValidData(), null);

            expect(result.hasErrors()).toBe(false);
        });

        it("should handle no param passed in", () => {
            const result = suite(getValidData());

            expect(result.hasErrors()).toBe(false);
        });

        it("should validate normally with invalid data and empty roles", () => {
            const result = suite(invalidData);

            expect(result.hasErrors()).toBe(true);
        });
    });
});
